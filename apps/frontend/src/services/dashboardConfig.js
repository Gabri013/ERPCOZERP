// Gerencia a configuração de widgets do dashboard por usuário
import {
  getDefaultWidgetsByRole,
  deriveSectorLabelFromRole,
} from '@/lib/defaultDashboardLayouts';

const PREFIX = 'nomus_erp_dashboard_cfg_';

/**
 * Catálogo de widgets (configurador + grid). Inclui IDs novos, legado e placeholders.
 * `size` 2x1 = largura dupla no grid.
 */
export const ALL_WIDGETS = [
  // ——— KPIs (novos) ———
  { id: 'kpi_vendas', label: 'KPI — Vendas / faturamento', grupo: 'KPIs', size: '1x1' },
  { id: 'kpi_producao', label: 'KPI — Produção / OPs', grupo: 'KPIs', size: '1x1' },
  { id: 'kpi_financeiro', label: 'KPI — Financeiro', grupo: 'KPIs', size: '1x1' },
  { id: 'kpi_projetos', label: 'KPI — Projetos (engenharia)', grupo: 'KPIs', size: '1x1' },
  { id: 'kpi_funcionarios', label: 'KPI — RH / headcount', grupo: 'KPIs', size: '1x1' },
  // ——— KPIs legado ———
  { id: 'kpi_faturamento', label: 'KPI — Faturamento (legado)', grupo: 'KPIs', size: '1x1' },
  { id: 'kpi_pedidos', label: 'KPI — Clientes ativos (legado)', grupo: 'KPIs', size: '1x1' },
  { id: 'kpi_ops', label: 'KPI — OPs em andamento (legado)', grupo: 'KPIs', size: '1x1' },
  { id: 'kpi_estoque', label: 'KPI — Itens em estoque (legado)', grupo: 'KPIs', size: '1x1' },
  { id: 'kpi_ocs', label: 'KPI — Ordens de compra (legado)', grupo: 'KPIs', size: '1x1' },
  { id: 'kpi_notifs', label: 'KPI — Notificações (legado)', grupo: 'KPIs', size: '1x1' },
  // ——— Gráficos (novos) ———
  { id: 'chart_vendas_mes', label: 'Gráfico — Vendas / captação (mês)', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_producao_mes', label: 'Gráfico — Produção / OPs (mês)', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_lead_time', label: 'Gráfico — Lead time', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_conversao', label: 'Gráfico — Conversão', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_funil_vendas', label: 'Gráfico — Funil de vendas', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_ops_atrasadas', label: 'Gráfico — OPs atrasadas', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_qualidade', label: 'Gráfico — Qualidade', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_eficiencia', label: 'Gráfico — Eficiência', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_projetos_mes', label: 'Gráfico — Projetos (mês)', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_carga_trabalho', label: 'Gráfico — Carga de trabalho', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_ops_hoje', label: 'Gráfico — OPs hoje', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_receitas_despesas', label: 'Gráfico — Receitas x despesas', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_contas_vencer', label: 'Gráfico — Contas a vencer', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_dre', label: 'Gráfico — DRE (resumo)', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_ponto', label: 'Gráfico — Ponto / presença', grupo: 'Gráficos', size: '2x1' },
  { id: 'chart_custos_folha', label: 'Gráfico — Custos de folha', grupo: 'Gráficos', size: '2x1' },
  // ——— Gráficos legado ———
  { id: 'grafico_vendas', label: 'Gráfico — Captação clientes (legado)', grupo: 'Gráficos', size: '2x1' },
  { id: 'grafico_financeiro', label: 'Gráfico — Receber vs pagar (legado)', grupo: 'Gráficos', size: '1x1' },
  { id: 'grafico_producao', label: 'Gráfico — OPs 6 meses (legado)', grupo: 'Gráficos', size: '2x1' },
  // ——— Tabelas / listas ———
  { id: 'top_produtos', label: 'Tabela — Top produtos', grupo: 'Tabelas', size: '2x1' },
  { id: 'pedidos_recentes', label: 'Tabela — Pedidos recentes', grupo: 'Tabelas', size: '2x1' },
  { id: 'estoque_critico', label: 'Lista — Estoque crítico (legado)', grupo: 'Tabelas', size: '1x1' },
  // ——— Alertas / painéis ———
  { id: 'alertas_estoque', label: 'Alertas — Estoque crítico', grupo: 'Informações', size: '1x1' },
  { id: 'alertas_financeiro', label: 'Alertas — Financeiro', grupo: 'Informações', size: '1x1' },
  { id: 'alertas_pedidos', label: 'Alertas — Pedidos / aprovações', grupo: 'Informações', size: '1x1' },
  { id: 'alertas_aprovacao', label: 'Alertas — Aprovações (engenharia)', grupo: 'Informações', size: '1x1' },
  { id: 'alertas_ferias', label: 'Alertas — Férias / RH', grupo: 'Informações', size: '1x1' },
  { id: 'alertas', label: 'Painel — Alertas consolidados (legado)', grupo: 'Informações', size: '1x1' },
];

/** Catálogo completo de widgets (alias para documentação / uso externo). */
export const DEFAULT_WIDGETS = ALL_WIDGETS;

const ALLOWED_WIDGET_IDS = new Set(ALL_WIDGETS.map((w) => w.id));

/** Mantém a ordem salva e descarta ids desconhecidos (dados legados / API). */
export function sanitizeWidgetIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => typeof id === 'string' && ALLOWED_WIDGET_IDS.has(id));
}

export const dashboardConfig = {
  /**
   * @param {string} usuarioId
   * @param {string} roleCode — ex.: resultado de primaryRole()
   * @param {string|null|undefined} sector — campo `user.sector` ou null
   */
  get(usuarioId, roleCode, sector) {
    const fallback = getDefaultWidgetsByRole(
      roleCode || 'user',
      sector ?? undefined,
    );
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
