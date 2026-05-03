/**
 * Layouts padrão do dashboard por papel (role.code) — espelha `defaultDashboardLayouts.js` no frontend.
 */

function intersectAllowed(ids: string[], allowed: Set<string>): string[] {
  return ids.filter((id) => allowed.has(id));
}

/** IDs válidos (frontend ALL_WIDGETS + legado). */
export const KNOWN_WIDGET_IDS = new Set([
  // Novos (por perfil)
  'kpi_vendas', 'kpi_producao', 'kpi_financeiro',
  'chart_vendas_mes', 'chart_producao_mes',
  'alertas_estoque', 'alertas_financeiro', 'alertas_pedidos',
  'chart_lead_time', 'top_produtos',
  'chart_conversao', 'chart_funil_vendas',
  'chart_ops_atrasadas', 'chart_qualidade', 'chart_eficiencia',
  'kpi_projetos', 'chart_projetos_mes', 'alertas_aprovacao', 'chart_carga_trabalho',
  'chart_ops_hoje',
  'chart_receitas_despesas', 'chart_contas_vencer', 'chart_dre',
  'kpi_funcionarios', 'chart_ponto', 'alertas_ferias', 'chart_custos_folha',
  // Tabelas
  'pedidos_recentes', 'estoque_critico',
  // Legado (layouts antigos — podem existir em layouts salvos)
  'kpi_faturamento', 'kpi_pedidos', 'kpi_ops', 'kpi_estoque', 'kpi_ocs', 'kpi_notifs',
  'grafico_vendas', 'grafico_financeiro', 'grafico_producao', 'alertas',
]);

/**
 * Mapeamento de widget legado → novo equivalente.
 * Usado para migrar layouts antigos automaticamente.
 */
const LEGACY_TO_NEW: Record<string, string> = {
  grafico_producao:  'chart_producao_mes',
  grafico_vendas:    'chart_vendas_mes',
  grafico_financeiro:'chart_receitas_despesas',
  kpi_faturamento:   'kpi_vendas',
  kpi_ops:           'kpi_producao',
  kpi_pedidos:       'kpi_vendas',
  kpi_estoque:       'kpi_vendas',
  kpi_ocs:           'kpi_producao',
  kpi_notifs:        'alertas_pedidos',
  alertas:           'alertas_estoque',
};

/**
 * Migra um layout salvo removendo IDs legados que já têm equivalente novo,
 * e deduplicando entradas repetidas.
 */
export function migrateLegacyLayout(widgets: string[]): string[] {
  if (!Array.isArray(widgets) || widgets.length === 0) return widgets;

  const result: string[] = [];
  const seen = new Set<string>();

  for (const id of widgets) {
    // Resolve legado → novo
    const resolved = LEGACY_TO_NEW[id] ?? id;
    // Só adiciona se conhecido e não duplicado
    if (KNOWN_WIDGET_IDS.has(resolved) && !seen.has(resolved)) {
      result.push(resolved);
      seen.add(resolved);
    }
  }

  return result.length > 0 ? result : widgets;
}

export function getDefaultDashboardWidgets(roleCode: string, _sectorName?: string | null): string[] {
  let base: string[];

  switch (roleCode) {
    case 'master':
    case 'gerente':
      base = [
        'kpi_vendas',
        'kpi_producao',
        'kpi_financeiro',
        'chart_vendas_mes',
        'chart_producao_mes',
        'alertas_estoque',
        'alertas_financeiro',
        'alertas_pedidos',
        'chart_lead_time',
        'top_produtos',
      ];
      break;
    case 'gerente_producao':
      base = [
        'kpi_producao',
        'chart_producao_mes',
        'alertas_estoque',
        'chart_lead_time',
        'chart_ops_atrasadas',
        'chart_qualidade',
        'chart_eficiencia',
      ];
      break;
    case 'orcamentista_vendas':
      base = [
        'kpi_vendas',
        'chart_vendas_mes',
        'chart_conversao',
        'pedidos_recentes',
        'alertas_pedidos',
      ];
      break;
    case 'projetista':
      base = ['kpi_projetos', 'chart_projetos_mes', 'alertas_aprovacao', 'chart_carga_trabalho'];
      break;
    case 'compras':
      base = ['kpi_producao', 'alertas_estoque', 'top_produtos', 'pedidos_recentes'];
      break;
    case 'corte_laser':
    case 'dobra_montagem':
    case 'solda':
      base = ['kpi_producao', 'chart_ops_hoje', 'alertas_estoque'];
      break;
    case 'qualidade':
      base = ['kpi_producao', 'chart_ops_hoje', 'chart_qualidade', 'alertas_estoque'];
      break;
    case 'expedicao':
      base = ['kpi_producao', 'chart_ops_hoje', 'pedidos_recentes', 'alertas_estoque'];
      break;
    case 'financeiro':
      base = [
        'kpi_financeiro',
        'chart_receitas_despesas',
        'alertas_financeiro',
        'chart_contas_vencer',
        'chart_dre',
      ];
      break;
    case 'rh':
      base = ['kpi_funcionarios', 'chart_ponto', 'alertas_ferias', 'chart_custos_folha'];
      break;
    default:
      base = [
        'kpi_vendas',
        'kpi_producao',
        'chart_vendas_mes',
        'chart_producao_mes',
        'alertas_pedidos',
        'alertas_estoque',
      ];
  }

  const cleaned = intersectAllowed(base, KNOWN_WIDGET_IDS);
  return cleaned.length ? cleaned : ['kpi_producao', 'alertas_estoque'];
}
