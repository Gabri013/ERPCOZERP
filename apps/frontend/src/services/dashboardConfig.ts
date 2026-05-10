import {
  getDefaultWidgetsByRole,
  deriveSectorLabelFromRole,
} from '@/lib/defaultDashboardLayouts';

const PREFIX = 'nomus_erp_dashboard_cfg_';

/**
 * Catálogo de widgets.
 * - `requiredPerm`: null = todos podem ver | string = 1 permissão específica | string[] = qualquer uma
 * - `hidden`: true = não aparece no configurador (ainda renderizável se salvo em layout legado)
 */
export const ALL_WIDGETS = [
  // ── KPIs ─────────────────────────────────────────────────────────────────
  { id: 'kpi_vendas',       label: 'KPI — Vendas / Faturamento',     grupo: 'KPIs', size: '1x1', requiredPerm: ['ver_pedidos','ver_clientes','ver_orcamentos'] },
  { id: 'kpi_producao',     label: 'KPI — Produção / OPs',           grupo: 'KPIs', size: '1x1', requiredPerm: ['ver_op','apontar','ver_kanban','ver_chao_fabrica','ver_pcp'] },
  { id: 'kpi_financeiro',   label: 'KPI — Financeiro',               grupo: 'KPIs', size: '1x1', requiredPerm: ['ver_financeiro'] },
  { id: 'kpi_projetos',     label: 'KPI — Projetos / Engenharia',    grupo: 'KPIs', size: '1x1', requiredPerm: ['ver_roteiros','editar_produtos'] },
  { id: 'kpi_funcionarios', label: 'KPI — RH / Headcount',           grupo: 'KPIs', size: '1x1', requiredPerm: ['ver_rh'] },

  // ── Gráficos — Vendas ─────────────────────────────────────────────────────
  { id: 'chart_vendas_mes',   label: 'Gráfico — Vendas por mês',           grupo: 'Gráficos — Vendas',    size: '2x1', requiredPerm: ['ver_pedidos','criar_orcamentos'] },
  { id: 'chart_conversao',    label: 'Gráfico — Conversão de orçamentos',  grupo: 'Gráficos — Vendas',    size: '2x1', requiredPerm: ['ver_pedidos','ver_orcamentos'] },
  { id: 'chart_funil_vendas', label: 'Gráfico — Funil de vendas / CRM',    grupo: 'Gráficos — Vendas',    size: '2x1', requiredPerm: ['ver_pedidos','ver_orcamentos','ver_crm'] },

  // ── Gráficos — Produção ───────────────────────────────────────────────────
  { id: 'chart_producao_mes',  label: 'Gráfico — OPs por mês',          grupo: 'Gráficos — Produção',  size: '2x1', requiredPerm: ['ver_op','ver_pcp'] },
  { id: 'chart_ops_hoje',      label: 'Gráfico — OPs do dia',            grupo: 'Gráficos — Produção',  size: '2x1', requiredPerm: ['ver_op','apontar','ver_chao_fabrica'] },
  { id: 'chart_lead_time',     label: 'Gráfico — Lead time de produção',  grupo: 'Gráficos — Produção',  size: '2x1', requiredPerm: ['ver_op','ver_pcp'] },
  { id: 'chart_ops_atrasadas', label: 'Gráfico — OPs atrasadas',          grupo: 'Gráficos — Produção',  size: '2x1', requiredPerm: ['ver_op','ver_pcp'] },
  { id: 'chart_qualidade',     label: 'Gráfico — Qualidade / rejeição',   grupo: 'Gráficos — Produção',  size: '2x1', requiredPerm: ['ver_op','apontar'] },
  { id: 'chart_eficiencia',    label: 'Gráfico — Eficiência do chão',     grupo: 'Gráficos — Produção',  size: '2x1', requiredPerm: ['ver_op','ver_pcp','apontar'] },
  { id: 'chart_carga_trabalho',label: 'Gráfico — Carga de trabalho',      grupo: 'Gráficos — Produção',  size: '2x1', requiredPerm: ['ver_pcp','ver_roteiros'] },
  { id: 'chart_projetos_mes',  label: 'Gráfico — Projetos por mês',       grupo: 'Gráficos — Produção',  size: '2x1', requiredPerm: ['ver_roteiros','editar_produtos'] },

  // ── Gráficos — Financeiro ─────────────────────────────────────────────────
  { id: 'chart_receitas_despesas', label: 'Gráfico — Receitas x Despesas', grupo: 'Gráficos — Financeiro', size: '2x1', requiredPerm: ['ver_financeiro'] },
  { id: 'chart_contas_vencer',     label: 'Gráfico — Contas a vencer',     grupo: 'Gráficos — Financeiro', size: '2x1', requiredPerm: ['ver_financeiro'] },
  { id: 'chart_dre',               label: 'Gráfico — DRE (resumo)',         grupo: 'Gráficos — Financeiro', size: '2x1', requiredPerm: ['ver_financeiro','ver_relatorio_financeiro'] },

  // ── Gráficos — RH ─────────────────────────────────────────────────────────
  { id: 'chart_ponto',       label: 'Gráfico — Ponto / Presença',    grupo: 'Gráficos — RH', size: '2x1', requiredPerm: ['ver_rh'] },
  { id: 'chart_custos_folha',label: 'Gráfico — Custos de folha',     grupo: 'Gráficos — RH', size: '2x1', requiredPerm: ['ver_rh','ver_folha'] },

  // ── Tabelas / Listas ──────────────────────────────────────────────────────
  { id: 'pedidos_recentes', label: 'Tabela — Últimos Pedidos de Venda', grupo: 'Tabelas', size: '2x1', requiredPerm: ['ver_pedidos'] },
  { id: 'top_produtos',     label: 'Tabela — Top Produtos',             grupo: 'Tabelas', size: '2x1', requiredPerm: ['ver_estoque','ver_pedidos'] },
  { id: 'estoque_critico',  label: 'Lista — Estoque crítico',           grupo: 'Tabelas', size: '1x1', requiredPerm: ['ver_estoque'] },

  // ── Alertas ───────────────────────────────────────────────────────────────
  { id: 'alertas_estoque',   label: 'Alertas — Estoque crítico',          grupo: 'Alertas', size: '1x1', requiredPerm: ['ver_estoque'] },
  { id: 'alertas_financeiro',label: 'Alertas — Financeiro (vencidos)',    grupo: 'Alertas', size: '1x1', requiredPerm: ['ver_financeiro'] },
  { id: 'alertas_pedidos',   label: 'Alertas — Pedidos / aprovações',     grupo: 'Alertas', size: '1x1', requiredPerm: ['ver_pedidos'] },
  { id: 'alertas_aprovacao', label: 'Alertas — Aprovações (engenharia)',  grupo: 'Alertas', size: '1x1', requiredPerm: ['ver_op','ver_roteiros'] },
  { id: 'alertas_ferias',    label: 'Alertas — Férias / RH',              grupo: 'Alertas', size: '1x1', requiredPerm: ['ver_rh'] },

  // ── Legado (ocultos no configurador, ainda renderizáveis em layouts salvos) ──
  { id: 'kpi_faturamento', label: 'KPI Faturamento (legado)', grupo: 'Legado', size: '1x1', requiredPerm: ['ver_pedidos'],  hidden: true },
  { id: 'kpi_pedidos',     label: 'KPI Clientes (legado)',    grupo: 'Legado', size: '1x1', requiredPerm: ['ver_clientes'], hidden: true },
  { id: 'kpi_ops',         label: 'KPI OPs (legado)',         grupo: 'Legado', size: '1x1', requiredPerm: ['ver_op'],       hidden: true },
  { id: 'kpi_estoque',     label: 'KPI Estoque (legado)',     grupo: 'Legado', size: '1x1', requiredPerm: ['ver_estoque'],  hidden: true },
  { id: 'kpi_ocs',         label: 'KPI OCs (legado)',         grupo: 'Legado', size: '1x1', requiredPerm: ['ver_compras'],  hidden: true },
  { id: 'kpi_notifs',      label: 'KPI Notificações (legado)',grupo: 'Legado', size: '1x1', requiredPerm: null,             hidden: true },
  { id: 'grafico_vendas',  label: 'Gráfico captação (legado)',grupo: 'Legado', size: '2x1', requiredPerm: ['ver_clientes'], hidden: true },
  { id: 'grafico_financeiro','label':'Gráfico financeiro (legado)',grupo:'Legado',size:'1x1',requiredPerm:['ver_financeiro'],hidden:true},
  { id: 'grafico_producao',label: 'Gráfico OPs (legado)',     grupo: 'Legado', size: '2x1', requiredPerm: ['ver_op'],       hidden: true },
  { id: 'alertas',         label: 'Alertas consolidados (legado)',grupo:'Legado',size:'1x1',requiredPerm: null,             hidden: true },
];

export const DEFAULT_WIDGETS = ALL_WIDGETS;

const ALLOWED_WIDGET_IDS = new Set(ALL_WIDGETS.map((w) => w.id));

/** Remove ids desconhecidos (dados legados / API). */
export function sanitizeWidgetIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => typeof id === 'string' && ALLOWED_WIDGET_IDS.has(id));
}

/**
 * Retorna o subset de widgets que o usuário pode ver,
 * dado o conjunto de permissões dele.
 * @param {Set<string>|string[]} userPermissions
 */
export function getWidgetsByPermissions(userPermissions) {
  const perms = userPermissions instanceof Set ? userPermissions : new Set(Array.isArray(userPermissions) ? userPermissions : []);
  return ALL_WIDGETS.filter((w) => {
    if (w.hidden) return false;
    if (!w.requiredPerm || w.requiredPerm.length === 0) return true;
    const required = Array.isArray(w.requiredPerm) ? w.requiredPerm : [w.requiredPerm];
    return required.some((p) => perms.has(p));
  });
}

/**
 * Filtra uma lista de widget IDs para remover aqueles
 * que o usuário não tem permissão (usado ao carregar layout salvo).
 */
export function filterWidgetIdsByPermissions(widgetIds, userPermissions) {
  const perms = userPermissions instanceof Set ? userPermissions : new Set(Array.isArray(userPermissions) ? userPermissions : []);
  const map = new Map(ALL_WIDGETS.map((w) => [w.id, w]));
  return widgetIds.filter((id) => {
    const w = map.get(id);
    if (!w) return false;
    if (!w.requiredPerm || w.requiredPerm.length === 0) return true;
    const required = Array.isArray(w.requiredPerm) ? w.requiredPerm : [w.requiredPerm];
    return required.some((p) => perms.has(p));
  });
}

export const dashboardConfig = {
  get(usuarioId, roleCode, sector) {
    const fallback = getDefaultWidgetsByRole(roleCode || 'user', sector ?? undefined);
    const key = `${PREFIX}${usuarioId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const candidate = Array.isArray(parsed) ? parsed : fallback;
        const cleaned = sanitizeWidgetIds(candidate);
        return cleaned.length ? cleaned : fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  },

  save(usuarioId, widgetIds) {
    const cleaned = sanitizeWidgetIds(widgetIds);
    localStorage.setItem(`${PREFIX}${usuarioId}`, JSON.stringify(cleaned));
  },

  reset(usuarioId, roleCode, sector) {
    localStorage.removeItem(`${PREFIX}${usuarioId}`);
    return getDefaultWidgetsByRole(roleCode || 'user', sector ?? undefined);
  },
};

export { deriveSectorLabelFromRole };
