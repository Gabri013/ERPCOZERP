// Gerencia a configuração de widgets do dashboard por usuário
const PREFIX = 'nomus_erp_dashboard_cfg_';

export const ALL_WIDGETS = [
  { id: 'kpi_faturamento',    label: 'KPI — Faturamento',         grupo: 'KPIs',         size: '1x1' },
  { id: 'kpi_pedidos',        label: 'KPI — Clientes Ativos',     grupo: 'KPIs',         size: '1x1' },
  { id: 'kpi_ops',            label: 'KPI — OPs em Andamento',    grupo: 'KPIs',         size: '1x1' },
  { id: 'kpi_estoque',        label: 'KPI — Itens em Estoque',    grupo: 'KPIs',         size: '1x1' },
  { id: 'kpi_ocs',            label: 'KPI — Ordens de Compra',    grupo: 'KPIs',         size: '1x1' },
  { id: 'kpi_notifs',         label: 'KPI — Notificações',        grupo: 'KPIs',         size: '1x1' },
  { id: 'grafico_vendas',     label: 'Gráfico — Captação Clientes',grupo: 'Gráficos',    size: '2x1' },
  { id: 'grafico_financeiro', label: 'Gráfico — Receber vs Pagar',grupo: 'Gráficos',     size: '1x1' },
  { id: 'grafico_producao',   label: 'Gráfico — OPs (6 meses)',   grupo: 'Gráficos',     size: '2x1' },
  { id: 'pedidos_recentes',   label: 'Tabela — Pedidos Recentes', grupo: 'Tabelas',      size: '2x1' },
  { id: 'estoque_critico',    label: 'Lista — Estoque Crítico',   grupo: 'Tabelas',      size: '1x1' },
  { id: 'alertas',            label: 'Painel — Alertas',          grupo: 'Informações',  size: '1x1' },
];

const DEFAULT_BY_PERFIL = {
  dono:              ['kpi_faturamento','kpi_pedidos','kpi_ops','kpi_estoque','kpi_ocs','kpi_notifs','grafico_vendas','grafico_financeiro','grafico_producao','estoque_critico','alertas'],
  gerente_geral:     ['kpi_pedidos','kpi_ops','kpi_estoque','kpi_ocs','kpi_notifs','grafico_vendas','grafico_financeiro','grafico_producao','alertas'],
  gerente_producao:  ['kpi_ops','kpi_estoque','kpi_notifs','grafico_producao','estoque_critico','alertas'],
  gerente_vendas:    ['kpi_pedidos','kpi_notifs','grafico_vendas','alertas'],
  engenharia:        ['kpi_estoque','kpi_notifs','grafico_producao','alertas'],
  producao:          ['kpi_ops','kpi_notifs','grafico_producao','estoque_critico','alertas'],
  qualidade:         ['kpi_ops','kpi_notifs','grafico_producao','alertas'],
  expedicao:         ['kpi_ops','kpi_notifs','grafico_producao','alertas'],
  pcp:               ['kpi_ops','kpi_pedidos','grafico_producao','pedidos_recentes'],
  compras:           ['kpi_estoque','estoque_critico','alertas'],
  financeiro:        ['kpi_faturamento','grafico_financeiro','alertas'],
  rh:                ['kpi_faturamento'],
  vendas:            ['kpi_pedidos','grafico_vendas','pedidos_recentes'],
  default:           ['kpi_pedidos','kpi_ops','kpi_estoque','kpi_notifs','grafico_vendas','grafico_producao','alertas'],
};

export const dashboardConfig = {
  get: (usuarioId, perfil) => {
    const key = `${PREFIX}${usuarioId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : (DEFAULT_BY_PERFIL[perfil] || DEFAULT_BY_PERFIL.default);
      } catch {
        return DEFAULT_BY_PERFIL[perfil] || DEFAULT_BY_PERFIL.default;
      }
    }
    return DEFAULT_BY_PERFIL[perfil] || DEFAULT_BY_PERFIL.default;
  },

  save: (usuarioId, widgetIds) => {
    localStorage.setItem(`${PREFIX}${usuarioId}`, JSON.stringify(widgetIds));
  },

  reset: (usuarioId, perfil) => {
    localStorage.removeItem(`${PREFIX}${usuarioId}`);
    return DEFAULT_BY_PERFIL[perfil] || DEFAULT_BY_PERFIL.default;
  },
};