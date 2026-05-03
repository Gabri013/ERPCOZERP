import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DollarSign, Factory, Package, Users, Settings, RotateCcw,
  Bell, ShoppingCart, Briefcase, TrendingUp, TrendingDown, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { resolveApiUrl } from '@/config/appConfig';
import { useAuth } from '@/lib/AuthContext';
import { usePermissao } from '@/lib/PermissaoContext';
import { getDefaultWidgetsByRole } from '@/lib/defaultDashboardLayouts';
import {
  dashboardConfig,
  ALL_WIDGETS,
  sanitizeWidgetIds,
  deriveSectorLabelFromRole,
  filterWidgetIdsByPermissions,
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

// ─── Labels do setor por role ─────────────────────────────────────────────────
const ROLE_LABEL = {
  master:              'Dono / Admin',
  gerente:             'Gerente Geral',
  gerente_producao:    'Gerente de Produção',
  orcamentista_vendas: 'Vendas / Orçamentos',
  projetista:          'Engenharia / Projetos',
  compras:             'Compras / Suprimentos',
  corte_laser:         'Corte a Laser',
  dobra_montagem:      'Dobra e Montagem',
  solda:               'Solda',
  expedicao:           'Expedição',
  qualidade:           'Qualidade',
  financeiro:          'Financeiro',
  rh:                  'RH',
};

// ─── Mapeamento Widget ID → Componente ────────────────────────────────────────
const WIDGET_COMPONENTS = {
  // KPIs
  kpi_vendas:       ({ kpis }) => (
    <WidgetKPI
      label={kpis?.dashboardScope === 'mine' ? 'Suas vendas' : 'Vendas'}
      value={kpis.totalVendas ?? 'R$ 0'}
      sub={kpis?.dashboardScope === 'mine' ? 'Valor dos seus pedidos (exc. rascunho/cancelados)' : 'Faturamento do período'}
      icon={DollarSign}
      trend={kpis.trendVendas}
      trendVal={kpis.trendVendasVal}
    />
  ),
  kpi_producao:     ({ kpis }) => <WidgetKPI label="Produção" value={kpis.totalOPs ?? '0'} sub="OPs em andamento" icon={Factory} trend={kpis.trendOPs} trendVal={kpis.trendOPsVal} />,
  kpi_financeiro:   ({ kpis }) => <WidgetKPI label="Financeiro" value={kpis.saldoFinanceiro ?? 'R$ 0'} sub="Saldo (receber − pagar)" icon={DollarSign} />,
  kpi_projetos:     ({ kpis }) => <WidgetKPI label="Projetos" value={kpis.totalOPs ?? '0'} sub="Eng. / roteiros ativos" icon={Briefcase} />,
  kpi_funcionarios: ({ kpis }) => <WidgetKPI label="Funcionários" value={kpis.totalFuncionarios ?? '0'} sub="Headcount ativo" icon={Users} />,
  // KPIs legado
  kpi_faturamento:  ({ kpis }) => <WidgetKPI label="Faturamento" value={kpis.totalVendas ?? 'R$ 0'} sub="Vendas" icon={DollarSign} />,
  kpi_pedidos:      ({ kpis }) => <WidgetKPI label="Clientes ativos" value={kpis.totalClientes ?? '0'} sub="Base ativa" icon={Users} />,
  kpi_ops:          ({ kpis }) => <WidgetKPI label="OPs em andamento" value={kpis.totalOPs ?? '0'} sub="Total de OPs" icon={Factory} />,
  kpi_estoque:      ({ kpis }) => <WidgetKPI label="Itens em estoque" value={kpis.totalProdutos ?? '0'} sub="Produtos" icon={Package} />,
  kpi_ocs:          ({ kpis }) => <WidgetKPI label="Ordens de compra" value={kpis.totalOCs ?? '0'} sub="Compras" icon={ShoppingCart} />,
  kpi_notifs:       ({ kpis }) => <WidgetKPI label="Notificações" value={kpis.unreadNotifs ?? '0'} sub={kpis.sector ? `Setor: ${kpis.sector}` : 'Alertas'} icon={Bell} badge={Number(kpis.unreadNotifs || 0)} />,
  // Gráficos
  chart_vendas_mes:        ({ kpis }) => (
    <WidgetGraficoVendas
      series={kpis?.series}
      mode="vendas_valor"
      title={kpis?.dashboardScope === 'mine' ? 'Seu faturamento mensal' : 'Faturamento mensal'}
      subtitle={kpis?.dashboardScope === 'mine' ? 'Seus pedidos (6 meses)' : 'Pedidos da empresa (6 meses)'}
      linkTo="/vendas/pedidos"
      linkLabel="Ver pedidos"
    />
  ),
  chart_conversao:         ({ kpis }) => (
    <WidgetGraficoVendas
      series={kpis?.series}
      mode="vendas_qtd"
      title="Volume de pedidos"
      subtitle="Quantidade por mês"
      linkTo="/vendas/pedidos"
      linkLabel="Ver pedidos"
    />
  ),
  chart_funil_vendas: ({ kpis }) => (
    <WidgetGraficoVendas
      series={kpis?.series}
      mode="clientes"
      title={kpis?.dashboardScope === 'mine' ? 'Novos clientes (cadastro geral)' : 'Novos clientes'}
      subtitle={
        kpis?.dashboardScope === 'mine'
          ? 'Consolidado da empresa não aparece na sua visão pessoal.'
          : 'Cadastros nos últimos 6 meses'
      }
      linkTo="/vendas/clientes"
      linkLabel={kpis?.dashboardScope === 'mine' ? '' : 'Ver clientes'}
    />
  ),
  chart_producao_mes:      ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  chart_ops_hoje:          ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} title="OPs do Dia" />,
  chart_lead_time:         ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} title="Lead Time (meses)" />,
  chart_ops_atrasadas:     ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} title="OPs Atrasadas" />,
  chart_qualidade:         ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} title="Qualidade / Rejeição" />,
  chart_eficiencia:        ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} title="Eficiência do Chão" />,
  chart_carga_trabalho:    ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} title="Carga de Trabalho" />,
  chart_projetos_mes:      ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} title="Projetos por Mês" />,
  chart_receitas_despesas: () => <WidgetGraficoFinanceiro />,
  chart_contas_vencer:     () => <WidgetGraficoFinanceiro title="Contas a Vencer" />,
  chart_dre:               () => <WidgetGraficoFinanceiro title="DRE (Resumo)" />,
  chart_ponto:             ({ kpis }) => <WidgetGraficoVendas series={kpis?.series} mode="clientes" title="Ponto / Presença" subtitle="Referência de período" />,
  chart_custos_folha:      () => <WidgetGraficoFinanceiro title="Custos de Folha" />,
  // Legado
  grafico_vendas:    ({ kpis }) => <WidgetGraficoVendas series={kpis?.series} />,
  grafico_financeiro: () => <WidgetGraficoFinanceiro />,
  grafico_producao:  ({ kpis }) => <WidgetGraficoProducao series={kpis?.series} />,
  // Tabelas
  pedidos_recentes: () => <WidgetPedidosRecentes />,
  top_produtos:     () => <WidgetPedidosRecentes title="Top Produtos" />,
  estoque_critico:  () => <WidgetEstoqueCritico />,
  alertas_estoque:  () => <WidgetEstoqueCritico />,
  // Alertas
  alertas_financeiro: () => <WidgetAlertas tipo="financeiro" />,
  alertas_pedidos: () => <WidgetAlertas tipo="pedidos" />,
  alertas_aprovacao: () => <WidgetAlertas tipo="aprovacao" />,
  alertas_ferias: () => <WidgetAlertas tipo="ferias" />,
  alertas: () => <WidgetAlertas />,
};

function DashboardWidget({ id, kpis }) {
  const Comp = WIDGET_COMPONENTS[id];
  if (Comp) return <Comp kpis={kpis} />;
  return <WidgetPlaceholder widgetId={id} />;
}

// ─── Grid col-span por size ───────────────────────────────────────────────────
function getColSpan(id) {
  const w = ALL_WIDGETS.find((x) => x.id === id);
  if (!w) return '';
  return w.size === '2x1' ? 'sm:col-span-2' : '';
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const { permissions, isLoadingPermissions } = usePermissao();
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(true);
  const [widgetIds, setWidgetIds] = useState([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const configuringRef = useRef(false);

  const roleCode = useMemo(() => primaryRole(user?.roles), [user?.roles]);
  const sectorLabel = useMemo(
    () => user?.sector?.trim() || deriveSectorLabelFromRole(roleCode),
    [user?.sector, roleCode],
  );

  useEffect(() => { configuringRef.current = showConfig; }, [showConfig]);

  const reloadDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(resolveApiUrl('/api/dashboard'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json?.success) setKpis(json.data || {});
    } catch { setKpis({}); }
  }, [token]);

  // Carrega KPIs
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) { if (mounted) setLoading(false); return; }
      setLoading(true);
      try {
        const res = await fetch(resolveApiUrl('/api/dashboard'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (mounted && json?.success) setKpis(json.data || {});
      } catch { if (mounted) setKpis({}); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [token]);

  // Carrega layout salvo
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) { if (mounted) setLayoutReady(true); return; }
      if (mounted) setLayoutReady(false);

      const sector = user?.sector?.trim() || deriveSectorLabelFromRole(roleCode);
      let appliedRemote = false;

      try {
        const remote = await dashboardLayoutServiceApi.getLayout();
        const cleaned = sanitizeWidgetIds(remote);
        if (mounted && cleaned.length > 0) {
          // Filtra widgets do layout salvo que o user ainda tem permissão
          const filtered = filterWidgetIdsByPermissions(cleaned, permissions || []);
          setWidgetIds(filtered.length ? filtered : cleaned);
          dashboardConfig.save(user.id, filtered.length ? filtered : cleaned);
          appliedRemote = true;
        }
      } catch { /* API offline */ }

      if (!mounted || configuringRef.current) { if (mounted) setLayoutReady(true); return; }

      if (!appliedRemote) {
        const next = dashboardConfig.get(user.id, roleCode, sector);
        const filtered = filterWidgetIdsByPermissions(next, permissions || []);
        setWidgetIds(filtered.length ? filtered : next);
        try { await dashboardLayoutServiceApi.saveLayout(filtered.length ? filtered : next); } catch { /* apenas local */ }
      }
      if (mounted) setLayoutReady(true);
    })().catch(() => { if (mounted) setLayoutReady(true); });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.sector, roleCode]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reloadDashboard();
    setRefreshing(false);
    toast.success('Dashboard atualizado');
  };

  const resetToDefault = useCallback(async () => {
    if (!user?.id) { toast.error('Faça login para restaurar o layout.'); return; }
    const sector = user?.sector?.trim() || deriveSectorLabelFromRole(roleCode);
    try {
      const remote = await dashboardLayoutServiceApi.resetLayout();
      let next = sanitizeWidgetIds(remote);
      if (!next.length) next = getDefaultWidgetsByRole(roleCode, sector);
      const filtered = filterWidgetIdsByPermissions(next, permissions || []);
      setWidgetIds(filtered.length ? filtered : next);
      dashboardConfig.save(user.id, filtered.length ? filtered : next);
      await reloadDashboard();
      toast.success('Layout padrão do seu perfil aplicado.');
    } catch {
      const next = dashboardConfig.reset(user.id, roleCode, sector);
      const filtered = filterWidgetIdsByPermissions(next, permissions || []);
      setWidgetIds(filtered.length ? filtered : next);
      try { await dashboardLayoutServiceApi.saveLayout(filtered.length ? filtered : next); } catch { /* ignore */ }
      await reloadDashboard();
      toast('Padrão aplicado neste dispositivo.');
    }
  }, [user?.id, user?.sector, roleCode, reloadDashboard, permissions]);

  // Widgets ativos filtrados por permissão (segurança no render)
  // enquanto as permissões estão carregando, mostra todos os widgets válidos
  // para evitar flash de "nenhum widget ativo"
  const activeWidgets = useMemo(() => {
    const all = new Set(ALL_WIDGETS.map((w) => w.id));
    const valid = widgetIds.filter((id) => all.has(id));
    if (isLoadingPermissions || !permissions?.length) return valid;
    return filterWidgetIdsByPermissions(valid, permissions);
  }, [widgetIds, permissions, isLoadingPermissions]);

  if (loading || (user?.id && !layoutReady)) {
    return (
      <div className="flex items-center justify-center min-h-[16rem] text-muted-foreground">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {kpis?.dashboardScope === 'mine'
              ? `${sectorLabel} — seus pedidos e metas comerciais`
              : `${ROLE_LABEL[roleCode] || sectorLabel} — visão da empresa`}{' '}
            · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Settings size={12} /> Personalizar
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors"
          >
            <RotateCcw size={12} /> Padrão
          </button>
        </div>
      </div>

      {/* ── Grid de widgets ──────────────────────────────────────────────── */}
      {activeWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[14rem] text-center gap-3 erp-card p-8">
          <Settings size={40} className="text-muted-foreground/30" />
          <div>
            <p className="font-medium text-muted-foreground">Nenhum widget ativo</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Clique em <strong>Personalizar</strong> para adicionar widgets ao seu dashboard
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowConfig(true)}
            className="cozinha-blue-bg text-white text-xs px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            <Settings size={12} className="inline mr-1.5" />
            Personalizar agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
          {activeWidgets.map((id) => (
            <div key={id} className={getColSpan(id)}>
              <DashboardWidget id={id} kpis={kpis} />
            </div>
          ))}
        </div>
      )}

      {/* ── Modal configurador ───────────────────────────────────────────── */}
      {showConfig && (
        <DashboardConfigurador
          key={widgetIds.join('|')}
          ativos={widgetIds}
          onClose={() => setShowConfig(false)}
          onSave={async (next) => {
            const cleaned = sanitizeWidgetIds(next);
            if (cleaned.length === 0) { toast.error('Selecione pelo menos um widget.'); return; }
            // Re-filtra por permissão antes de salvar (segurança)
            const filtered = filterWidgetIdsByPermissions(cleaned, permissions || []);
            const toSave = filtered.length ? filtered : cleaned;
            setWidgetIds(toSave);
            if (user?.id) dashboardConfig.save(user.id, toSave);
            try {
              await dashboardLayoutServiceApi.saveLayout(toSave);
              const remote = await dashboardLayoutServiceApi.getLayout();
              const synced = sanitizeWidgetIds(remote);
              if (synced.length > 0) {
                const syncFiltered = filterWidgetIdsByPermissions(synced, permissions || []);
                setWidgetIds(syncFiltered.length ? syncFiltered : synced);
                if (user?.id) dashboardConfig.save(user.id, syncFiltered.length ? syncFiltered : synced);
              }
            } catch {
              toast('Salvo localmente; não foi possível sincronizar com o servidor.');
            }
            await reloadDashboard();
            setShowConfig(false);
            toast.success('Dashboard personalizado salvo!');
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
