import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DollarSign, Factory, Package, Users, Settings, RotateCcw, Bell, ShoppingCart, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { resolveApiUrl } from '@/config/appConfig';
import { useAuth } from '@/lib/AuthContext';
import { getDefaultWidgetsByRole } from '@/lib/defaultDashboardLayouts';
import {
  dashboardConfig,
  ALL_WIDGETS,
  sanitizeWidgetIds,
  deriveSectorLabelFromRole,
} from '@/services/dashboardConfig';
import { dashboardLayoutServiceApi } from '@/services/dashboardLayoutServiceApi';
import DashboardConfigurador from '@/components/dashboard/DashboardConfigurador';
import WidgetKPI from '@/components/dashboard/WidgetKPI';
import WidgetGraficoVendas from '@/components/dashboard/WidgetGraficoVendas';
import WidgetGraficoFinanceiro from '@/components/dashboard/WidgetGraficoFinanceiro';
import WidgetGraficoProducao from '@/components/dashboard/WidgetGraficoProducao';
import WidgetPedidosRecentes from '@/components/dashboard/WidgetPedidosRecentes';
import WidgetEstoqueCritico from '@/components/dashboard/WidgetEstoqueCritico';
import WidgetAlertas from '@/components/dashboard/WidgetAlertas';
import WidgetPlaceholder from '@/components/dashboard/widgets/WidgetPlaceholder';
import { primaryRole } from '@/lib/rolePriority';

/** Mesmo componente / props para KPI + gráficos reaproveitados */
const WIDGET_COMPONENTS = {
  kpi_vendas: ({ kpis }) => (
    <WidgetKPI label="Vendas" value={kpis.totalVendas ?? 'R$ 0'} sub="Faturamento resumido" icon={DollarSign} />
  ),
  kpi_faturamento: ({ kpis }) => (
    <WidgetKPI label="Faturamento" value={kpis.totalVendas ?? 'R$ 0'} sub="Vendas (core)" icon={DollarSign} />
  ),
  kpi_producao: ({ kpis }) => (
    <WidgetKPI label="Produção" value={kpis.totalOPs ?? '0'} sub="OPs em andamento" icon={Factory} />
  ),
  kpi_ops: ({ kpis }) => (
    <WidgetKPI label="OPs em andamento" value={kpis.totalOPs ?? '0'} sub="Total de OPs (core)" icon={Factory} />
  ),
  kpi_pedidos: ({ kpis }) => (
    <WidgetKPI label="Clientes ativos" value={kpis.totalClientes ?? '0'} sub="Captação e base ativa" icon={Users} />
  ),
  kpi_estoque: ({ kpis }) => (
    <WidgetKPI label="Itens em estoque" value={kpis.totalProdutos ?? '0'} sub="Produtos (core)" icon={Package} />
  ),
  kpi_ocs: ({ kpis }) => (
    <WidgetKPI label="Ordens de compra" value={kpis.totalOCs ?? '0'} sub="Compras (core)" icon={ShoppingCart} />
  ),
  kpi_notifs: ({ kpis }) => (
    <WidgetKPI
      label="Notificações"
      value={kpis.unreadNotifs ?? '0'}
      sub={kpis.sector ? `Setor: ${kpis.sector}` : 'Alertas por setor'}
      icon={Bell}
      badge={Number(kpis.unreadNotifs || 0)}
    />
  ),
  kpi_financeiro: ({ kpis }) => (
    <WidgetKPI label="Financeiro" value={kpis.totalVendas ?? '—'} sub="Indicadores consolidados" icon={DollarSign} />
  ),
  kpi_projetos: ({ kpis }) => (
    <WidgetKPI label="Projetos" value={kpis.totalOPs ?? '—'} sub="Engenharia / roteiros" icon={Briefcase} />
  ),
  kpi_funcionarios: ({ kpis }) => (
    <WidgetKPI label="RH" value={kpis.totalClientes ?? '—'} sub="Base / indicadores" icon={Users} />
  ),
  chart_vendas_mes: ({ kpis }) => <WidgetGraficoVendas series={kpis?.series} />,
  grafico_vendas: ({ kpis }) => <WidgetGraficoVendas series={kpis?.series} />,
  chart_producao_mes: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  grafico_producao: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  chart_ops_hoje: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  chart_lead_time: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  chart_receitas_despesas: () => <WidgetGraficoFinanceiro />,
  grafico_financeiro: () => <WidgetGraficoFinanceiro />,
  chart_conversao: ({ kpis }) => <WidgetGraficoVendas series={kpis?.series} />,
  chart_funil_vendas: ({ kpis }) => <WidgetGraficoVendas series={kpis?.series} />,
  chart_ops_atrasadas: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  chart_qualidade: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  chart_eficiencia: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  chart_projetos_mes: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  chart_carga_trabalho: ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  chart_contas_vencer: () => <WidgetGraficoFinanceiro />,
  chart_dre: () => <WidgetGraficoFinanceiro />,
  chart_ponto: ({ kpis }) => <WidgetGraficoVendas series={kpis?.series} />,
  chart_custos_folha: () => <WidgetGraficoFinanceiro />,
  pedidos_recentes: () => <WidgetPedidosRecentes />,
  top_produtos: () => <WidgetPedidosRecentes />,
  estoque_critico: () => <WidgetEstoqueCritico />,
  alertas_estoque: () => <WidgetEstoqueCritico />,
  alertas_financeiro: () => <WidgetAlertas />,
  alertas_pedidos: () => <WidgetAlertas />,
  alertas_aprovacao: () => <WidgetAlertas />,
  alertas_ferias: () => <WidgetAlertas />,
  alertas: () => <WidgetAlertas />,
};

function DashboardWidget({ id, kpis }) {
  const Comp = WIDGET_COMPONENTS[id];
  if (Comp) return <Comp kpis={kpis} />;
  return <WidgetPlaceholder widgetId={id} />;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(true);
  const [widgetIds, setWidgetIds] = useState([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const configuringRef = useRef(false);

  const roleCode = useMemo(() => primaryRole(user?.roles), [user?.roles]);

  useEffect(() => {
    configuringRef.current = showConfig;
  }, [showConfig]);

  const reloadDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(resolveApiUrl('/api/dashboard'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (json?.success) {
        setKpis(json.data || {});
      }
    } catch {
      setKpis({});
    }
  }, [token]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      setLoading(true);
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
    (async () => {
      if (!user?.id) {
        if (mounted) setLayoutReady(true);
        return;
      }
      if (mounted) setLayoutReady(false);

      const sector = user?.sector?.trim() || deriveSectorLabelFromRole(roleCode);

      let appliedRemote = false;
      try {
        const remote = await dashboardLayoutServiceApi.getLayout();
        const cleaned = sanitizeWidgetIds(remote);
        if (mounted && cleaned.length > 0) {
          setWidgetIds(cleaned);
          dashboardConfig.save(user.id, cleaned);
          appliedRemote = true;
        }
      } catch {
        /* API fora */
      }

      if (!mounted || configuringRef.current) {
        if (mounted) setLayoutReady(true);
        return;
      }

      if (!appliedRemote) {
        const next = dashboardConfig.get(user.id, roleCode, sector);
        setWidgetIds(next);
        try {
          await dashboardLayoutServiceApi.saveLayout(next);
        } catch {
          /* só local */
        }
      }
      if (mounted) setLayoutReady(true);
    })().catch(() => {
      if (mounted) setLayoutReady(true);
    });

    return () => {
      mounted = false;
    };
  }, [user?.id, user?.sector, roleCode]);

  const resetToDefault = useCallback(async () => {
    if (!user?.id) {
      toast.error('Faça login para restaurar o layout.');
      return;
    }
    const sector = user?.sector?.trim() || deriveSectorLabelFromRole(roleCode);
    try {
      const remote = await dashboardLayoutServiceApi.resetLayout();
      let next = sanitizeWidgetIds(remote);
      if (!next.length) {
        next = getDefaultWidgetsByRole(roleCode, sector);
      }
      setWidgetIds(next);
      dashboardConfig.save(user.id, next);
      await reloadDashboard();
      toast.success('Layout padrão do seu perfil aplicado.');
    } catch {
      const next = dashboardConfig.reset(user.id, roleCode, sector);
      setWidgetIds(next);
      try {
        await dashboardLayoutServiceApi.saveLayout(next);
      } catch {
        /* ignore */
      }
      await reloadDashboard();
      toast('Padrão aplicado neste dispositivo; servidor não respondeu.');
    }
  }, [user?.id, user?.sector, roleCode, reloadDashboard]);

  const activeWidgets = useMemo(() => {
    const all = new Set(ALL_WIDGETS.map((w) => w.id));
    return widgetIds.filter((id) => all.has(id));
  }, [widgetIds]);

  if (loading || (user?.id && !layoutReady)) {
    return <div className="flex items-center justify-center min-h-[16rem] text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Personalize o que você quer ver</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowConfig(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs border border-border rounded hover:bg-muted"
          >
            <Settings size={13} /> Personalizar
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs border border-border rounded hover:bg-muted"
          >
            <RotateCcw size={13} /> Padrão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min sm:auto-rows-[180px]">
        {activeWidgets.map((id) => {
          const size = ALL_WIDGETS.find((w) => w.id === id)?.size;
          const span = size === '2x1' ? 'lg:col-span-2' : '';
          return (
            <div key={id} className={span}>
              <DashboardWidget id={id} kpis={kpis} />
            </div>
          );
        })}
      </div>

      {showConfig && (
        <DashboardConfigurador
          key={widgetIds.join('|')}
          ativos={widgetIds}
          onClose={() => setShowConfig(false)}
          onSave={async (next) => {
            const cleaned = sanitizeWidgetIds(next);
            if (cleaned.length === 0) {
              toast.error('Selecione pelo menos um widget.');
              return;
            }
            setWidgetIds(cleaned);
            if (user?.id) dashboardConfig.save(user.id, cleaned);
            try {
              await dashboardLayoutServiceApi.saveLayout(cleaned);
              const remote = await dashboardLayoutServiceApi.getLayout();
              const synced = sanitizeWidgetIds(remote);
              if (synced.length > 0) {
                setWidgetIds(synced);
                if (user?.id) dashboardConfig.save(user.id, synced);
              }
            } catch {
              toast('Salvo neste dispositivo; não foi possível sincronizar com o servidor.');
            }
            await reloadDashboard();
            setShowConfig(false);
          }}
          onReset={async () => {
            setShowConfig(false);
            await resetToDefault();
          }}
        />
      )}
    </div>
  );
}
