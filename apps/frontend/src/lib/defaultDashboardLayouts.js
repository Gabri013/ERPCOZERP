/**
 * Layouts padrão por código de role (`roles.code`) e setor opcional.
 * Deve permanecer alinhado a `apps/backend/src/lib/defaultDashboardLayout.ts`.
 */

const KNOWN = new Set([
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
  'chart_conversao',
  'chart_funil_vendas',
  'chart_ops_atrasadas',
  'chart_qualidade',
  'chart_eficiencia',
  'kpi_projetos',
  'chart_projetos_mes',
  'alertas_aprovacao',
  'chart_carga_trabalho',
  'chart_ops_hoje',
  'chart_receitas_despesas',
  'chart_contas_vencer',
  'chart_dre',
  'kpi_funcionarios',
  'chart_ponto',
  'alertas_ferias',
  'chart_custos_folha',
]);

function intersect(ids) {
  return ids.filter((id) => KNOWN.has(id));
}

/**
 * Rótulo de setor para exibição quando o usuário não tem `sector` gravado no cadastro.
 */
export function deriveSectorLabelFromRole(roleCode) {
  const map = {
    master:              'Diretoria',
    gerente:             'Gerência',
    gerente_producao:    'Produção',
    orcamentista_vendas: 'Vendas',
    projetista:          'Engenharia',
    compras:             'Compras',
    corte_laser:         'Corte Laser',
    dobra_montagem:      'Dobra/Montagem',
    solda:               'Solda',
    expedicao:           'Expedição',
    qualidade:           'Qualidade',
    financeiro:          'Financeiro',
    rh:                  'RH',
    user:                'Geral',
  };
  return map[roleCode] || 'Geral';
}

/**
 * Ajuste fino por setor cadastrado (ex.: operador + setor "Expedição").
 */
export function refineWidgetsBySector(widgets, roleCode, sectorName) {
  if (!sectorName || typeof sectorName !== 'string') return widgets;
  const s = sectorName.trim().toLowerCase();
  if (!s) return widgets;

  const productionOps = new Set(['corte_laser', 'dobra_montagem', 'solda', 'qualidade', 'expedicao']);
  if (productionOps.has(roleCode) && (s.includes('expedi') || s.includes('produ'))) {
    const focus = ['kpi_producao', 'chart_ops_hoje', 'alertas_estoque'];
    const narrowed = intersect(widgets.filter((id) => focus.includes(id)));
    return narrowed.length ? narrowed : intersect(focus);
  }

  return widgets;
}

/**
 * @param {string} roleCode — primeiro papel após prioridade (ex.: `primaryRole`)
 * @param {string} [sectorName] — `user.sector` ou derivado
 * @returns {string[]} IDs de widgets
 */
export function getDefaultWidgetsByRole(roleCode, sectorName) {
  const code = typeof roleCode === 'string' && roleCode.trim() ? roleCode.trim() : 'user';

  let base;
  switch (code) {
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
        'top_produtos',
        'alertas_pedidos',
        'chart_funil_vendas',
      ];
      break;
    case 'projetista':
      base = ['kpi_projetos', 'chart_projetos_mes', 'alertas_aprovacao', 'chart_carga_trabalho'];
      break;
    // Compras / Suprimentos: foco em estoque crítico, pedidos e materiais
    case 'compras':
      base = [
        'kpi_producao',
        'alertas_estoque',
        'top_produtos',
        'pedidos_recentes',
      ];
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

  let out = intersect(base);
  out = refineWidgetsBySector(out, code, sectorName);
  if (!out.length) out = ['kpi_producao', 'alertas_estoque'];
  return out;
}
