import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Factory, Package, Users, Settings, RotateCcw, Bell, ShoppingCart } from 'lucide-react';
import { resolveApiUrl } from '@/config/appConfig';
import { useAuth } from '@/lib/AuthContext';
import { dashboardConfig, ALL_WIDGETS } from '@/services/dashboardConfig';
import { dashboardLayoutServiceApi } from '@/services/dashboardLayoutServiceApi';
import DashboardConfigurador from '@/components/dashboard/DashboardConfigurador';
import WidgetKPI from '@/components/dashboard/WidgetKPI';
import WidgetGraficoVendas from '@/components/dashboard/WidgetGraficoVendas';
import WidgetGraficoFinanceiro from '@/components/dashboard/WidgetGraficoFinanceiro';
import WidgetGraficoProducao from '@/components/dashboard/WidgetGraficoProducao';
import WidgetPedidosRecentes from '@/components/dashboard/WidgetPedidosRecentes';
import WidgetEstoqueCritico from '@/components/dashboard/WidgetEstoqueCritico';
import WidgetAlertas from '@/components/dashboard/WidgetAlertas';

const PERFIL_BY_ROLE = {
  master: 'dono',
  gerente: 'gerente_geral',
  gerente_producao: 'gerente_producao',
  orcamentista_vendas: 'vendas',
  projetista: 'engenharia',
  corte_laser: 'producao',
  dobra_montagem: 'producao',
  solda: 'producao',
  expedicao: 'producao',
  qualidade: 'qualidade',
  user: 'default',
};

function getPerfilFromUser(user) {
  const role = user?.roles?.[0];
  return PERFIL_BY_ROLE[role] || 'default';
}

const WIDGET_COMPONENTS = {
  kpi_faturamento: ({ kpis }) => <WidgetKPI label="Faturamento" value={kpis.totalVendas ?? 'R$ 0'} sub="Vendas (core): em migração" icon={DollarSign} />,
  kpi_pedidos: ({ kpis }) => <WidgetKPI label="Clientes Ativos" value={kpis.totalClientes ?? '0'} sub="Captação e base ativa" icon={Users} />,
  kpi_ops: ({ kpis }) => <WidgetKPI label="OPs em Andamento" value={kpis.totalOPs ?? '0'} sub="Total de OPs (core)" icon={Factory} />,
  kpi_estoque: ({ kpis }) => <WidgetKPI label="Itens em Estoque" value={kpis.totalProdutos ?? '0'} sub="Total de produtos (core)" icon={Package} />,
  kpi_ocs: ({ kpis }) => <WidgetKPI label="Ordens de Compra" value={kpis.totalOCs ?? '0'} sub="Compras (core)" icon={ShoppingCart} />,
  kpi_notifs: ({ kpis }) => <WidgetKPI label="Notificações" value={kpis.unreadNotifs ?? '0'} sub={kpis.sector ? `Setor: ${kpis.sector}` : 'Alertas por setor'} icon={Bell} badge={Number(kpis.unreadNotifs || 0)} />,
  grafico_vendas: ({ kpis }) => <WidgetGraficoVendas series={kpis?.series} />,
  grafico_financeiro: () => <WidgetGraficoFinanceiro />,
  grafico_producao: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  pedidos_recentes: () => <WidgetPedidosRecentes />,
  estoque_critico: () => <WidgetEstoqueCritico />,
  alertas: () => <WidgetAlertas />,
};

export default function Dashboard() {
  const { token, user } = useAuth();
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(true);
  const [widgetIds, setWidgetIds] = useState([]);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const response = await fetch(resolveApiUrl('/api/dashboard'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();

        if (mounted && json?.success) {
          setKpis(json.data || {});
        }
      } catch {
        if (mounted) {
          setKpis({});
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    let mounted = true;
    async function loadLayout() {
      if (!user?.id) return;
      const perfil = getPerfilFromUser(user);
      try {
        const remote = await dashboardLayoutServiceApi.getLayout();
        if (!mounted) return;

        // Se existir layout remoto (mesmo vazio), ele é a fonte de verdade em modo API.
        if (Array.isArray(remote)) {
          if (remote.length) {
            setWidgetIds(remote);
            return;
          }
        }
      } catch {
        // fallback local
      }

      if (!mounted) return;
      const localDefault = dashboardConfig.get(user.id, perfil);
      setWidgetIds(localDefault);
    }
    loadLayout();
    return () => { mounted = false; };
  }, [user?.id]);

  const activeWidgets = useMemo(() => {
    const all = new Set(ALL_WIDGETS.map(w => w.id));
    return widgetIds.filter(id => all.has(id));
  }, [widgetIds]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Personalize o que você quer ver</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
            <Settings size={13}/> Personalizar
          </button>
          <button
            onClick={async () => {
              if (!user?.id) return;
              const perfil = getPerfilFromUser(user);
              const next = dashboardConfig.reset(user.id, perfil);
              setWidgetIds(next);
              try { await dashboardLayoutServiceApi.resetLayout(); } catch {}
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
          >
            <RotateCcw size={13}/> Padrão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
        {activeWidgets.map((id) => {
          const Comp = WIDGET_COMPONENTS[id];
          if (!Comp) return null;
          const size = ALL_WIDGETS.find(w => w.id === id)?.size;
          const span = size === '2x1' ? 'lg:col-span-2' : '';
          return (
            <div key={id} className={span}>
              <Comp kpis={kpis} />
            </div>
          );
        })}
      </div>

      {showConfig && (
        <DashboardConfigurador
          ativos={widgetIds}
          onClose={() => setShowConfig(false)}
          onSave={async (next) => {
            setWidgetIds(next);
            if (user?.id) dashboardConfig.save(user.id, next);
            try { await dashboardLayoutServiceApi.saveLayout(next); } catch {}
            setShowConfig(false);
          }}
          onReset={async () => {
            if (!user?.id) return;
            const perfil = getPerfilFromUser(user);
            const next = dashboardConfig.reset(user.id, perfil);
            setWidgetIds(next);
            try { await dashboardLayoutServiceApi.resetLayout(); } catch {}
          }}
        />
      )}
    </div>
  );
}
