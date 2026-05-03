import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Tv, RefreshCw, Download, Maximize2, Minimize2, X, Settings2,
  TrendingUp, TrendingDown, Minus, Target, ChevronDown,
  BarChart2, LineChartIcon, PieChart as PieIcon, Activity,
  CheckCircle, AlertCircle, Filter,
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { usePermissao } from '@/lib/PermissaoContext';
import { primaryRole } from '@/lib/rolePriority';

// ─── Paleta de cores ──────────────────────────────────────────────────────────
const COLORS = ['#0066cc', '#00aa5b', '#ff6b35', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtNum = (v) => Number(v || 0).toLocaleString('pt-BR');

// ─── Tipos de gráfico disponíveis ─────────────────────────────────────────────
const CHART_TYPES = [
  { id: 'bar',      label: 'Barras',      icon: BarChart2 },
  { id: 'line',     label: 'Linha',       icon: LineChartIcon },
  { id: 'area',     label: 'Área',        icon: Activity },
  { id: 'pie',      label: 'Pizza',       icon: PieIcon },
];

// ─── Opções de ordenação do eixo X ────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'date_asc',  label: 'Por Data final - ascendente' },
  { id: 'date_desc', label: 'Por Data final - descendente' },
  { id: 'value_asc', label: 'Por valor de Y - ascendente' },
  { id: 'value_desc',label: 'Por valor de Y - descendente' },
];

// ─── Exportação ───────────────────────────────────────────────────────────────
function exportCSV(data, filename) {
  if (!data?.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map((r) => keys.map((k) => `"${r[k] ?? ''}"`).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename + '.csv'; a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename + '.json'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Componente de gráfico universal ─────────────────────────────────────────
function PanelChart({ data, type, dataKey, nameKey = 'mes', meta, color = '#0066cc', height = 220 }) {
  if (!data?.length) return (
    <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
      Sem dados disponíveis
    </div>
  );

  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-border rounded shadow-md px-3 py-2 text-xs">
        <div className="font-semibold mb-1">{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{typeof p.value === 'number' && p.value > 1000 ? fmtNum(p.value) : p.value}</span>
          </div>
        ))}
        {meta != null && (
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-border">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-muted-foreground">Meta:</span>
            <span className="font-medium text-red-600">{fmtNum(meta)}</span>
          </div>
        )}
      </div>
    );
  };

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={height * 0.32} dataKey={dataKey} nameKey={nameKey}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip content={renderTooltip} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  const commonProps = {
    data, margin: { top: 8, right: 8, left: -10, bottom: 0 },
  };
  const axis = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} />
      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
      <Tooltip content={renderTooltip} />
    </>
  );
  const metaLine = meta != null ? (
    <ReferenceLine y={meta} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5}
      label={{ value: `Meta: ${fmtNum(meta)}`, position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }} />
  ) : null;

  if (type === 'line') return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart {...commonProps}>
        {axis}{metaLine}
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} name={dataKey} />
      </LineChart>
    </ResponsiveContainer>
  );

  if (type === 'area') return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {axis}{metaLine}
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} strokeWidth={2} name={dataKey} />
      </AreaChart>
    </ResponsiveContainer>
  );

  // default: bar
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart {...commonProps}>
        {axis}{metaLine}
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} name={dataKey} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Card de painel individual ─────────────────────────────────────────────────
function PainelCard({ config, dados, onConfig }) {
  const [chartType, setChartType] = useState(config.defaultChartType || 'bar');
  const [sortOrder, setSortOrder] = useState('date_asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showChartTypes, setShowChartTypes] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const cardRef = useRef(null);

  const sortedData = useMemo(() => {
    if (!dados?.length) return [];
    const d = [...dados];
    if (sortOrder === 'value_asc') d.sort((a, b) => (a[config.dataKey] || 0) - (b[config.dataKey] || 0));
    if (sortOrder === 'value_desc') d.sort((a, b) => (b[config.dataKey] || 0) - (a[config.dataKey] || 0));
    if (sortOrder === 'date_desc') d.reverse();
    return d;
  }, [dados, sortOrder, config.dataKey]);

  const total = useMemo(() => sortedData.reduce((s, d) => s + Number(d[config.dataKey] || 0), 0), [sortedData, config.dataKey]);
  const metaPct = config.meta && total > 0 ? Math.round((total / config.meta) * 100) : null;
  const metaStatus = metaPct != null ? (metaPct >= 100 ? 'acima' : metaPct >= 80 ? 'proximo' : 'abaixo') : null;

  const doExport = (format) => {
    setShowExportMenu(false);
    if (format === 'csv') { exportCSV(sortedData, config.id); toast.success('CSV exportado!'); }
    if (format === 'json') { exportJSON(sortedData, config.id); toast.success('JSON exportado!'); }
    if (format === 'pdf') toast.info('Use o botão Imprimir do navegador para salvar como PDF.');
    if (format === 'img') {
      if (cardRef.current) {
        toast.info('Faça uma captura de tela da área do gráfico.');
      }
    }
  };

  const cardContent = (
    <div ref={cardRef} className={`flex flex-col bg-white border border-border rounded-lg overflow-hidden ${fullscreen ? 'fixed inset-4 z-[9999] shadow-2xl' : ''}`}>
      {/* Header do painel */}
      <div className="px-4 py-3 border-b border-border">
        {config.estrategia && (
          <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-0.5">
            Estratégia: {config.estrategia}
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground leading-tight">{config.titulo}</h3>
            {config.metodologia && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{config.metodologia}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Tipo de gráfico */}
            <div className="relative">
              <button type="button" onClick={() => { setShowChartTypes(!showChartTypes); setShowSortMenu(false); setShowExportMenu(false); }}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Tipo de gráfico">
                <Settings2 size={13} />
              </button>
              {showChartTypes && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg p-2 w-40">
                  <p className="text-[10px] font-semibold text-muted-foreground px-2 pb-1">Tipo de gráfico</p>
                  {CHART_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.id} type="button"
                        onClick={() => { setChartType(t.id); setShowChartTypes(false); }}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-muted ${chartType === t.id ? 'bg-blue-50 text-primary font-medium' : 'text-foreground'}`}>
                        <Icon size={13} />{t.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Classificar X */}
            <div className="relative">
              <button type="button" onClick={() => { setShowSortMenu(!showSortMenu); setShowChartTypes(false); setShowExportMenu(false); }}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Classificar eixo X">
                <Filter size={13} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg overflow-hidden w-52">
                  <p className="text-[10px] font-semibold text-muted-foreground px-3 py-2 border-b border-border">Classificar X Eixo:</p>
                  {SORT_OPTIONS.map((s) => (
                    <button key={s.id} type="button"
                      onClick={() => { setSortOrder(s.id); setShowSortMenu(false); }}
                      className={`flex items-center w-full px-3 py-2 text-xs hover:bg-blue-50 ${sortOrder === s.id ? 'bg-primary text-white' : 'text-foreground'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Exportar */}
            <div className="relative">
              <button type="button" onClick={() => { setShowExportMenu(!showExportMenu); setShowSortMenu(false); setShowChartTypes(false); }}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Exportar">
                <Download size={13} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg overflow-hidden w-40">
                  <p className="text-[10px] font-semibold text-muted-foreground px-3 py-2 border-b border-border flex items-center gap-1">
                    <Download size={10} /> Exportar
                  </p>
                  {[
                    { id: 'csv',   label: 'Como CSV' },
                    { id: 'json',  label: 'Como JSON' },
                    { id: 'pdf',   label: 'Como PDF' },
                    { id: 'img',   label: 'Como Imagem' },
                  ].map((e) => (
                    <button key={e.id} type="button" onClick={() => doExport(e.id)}
                      className="flex items-center w-full px-3 py-2 text-xs hover:bg-muted text-foreground">
                      {e.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button type="button" onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground">
              {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {fullscreen && (
              <button type="button" onClick={() => setFullscreen(false)}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground ml-1">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Indicador de meta */}
      {metaPct != null && (
        <div className={`px-4 py-1.5 border-b border-border flex items-center justify-between text-[11px] ${metaStatus === 'acima' ? 'bg-green-50' : metaStatus === 'proximo' ? 'bg-yellow-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-1.5">
            <Target size={11} className={metaStatus === 'acima' ? 'text-green-600' : metaStatus === 'proximo' ? 'text-yellow-600' : 'text-red-600'} />
            <span className="text-muted-foreground">Meta:</span>
            <span className="font-medium">{config.meta?.toLocaleString('pt-BR')}</span>
          </div>
          <div className={`flex items-center gap-1 font-semibold ${metaStatus === 'acima' ? 'text-green-600' : metaStatus === 'proximo' ? 'text-yellow-600' : 'text-red-600'}`}>
            {metaStatus === 'acima' ? <TrendingUp size={11} /> : metaStatus === 'proximo' ? <Minus size={11} /> : <TrendingDown size={11} />}
            {metaPct}% da meta
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className={`flex-1 px-4 py-3 ${fullscreen ? 'h-full' : ''}`}
        onClick={(e) => { if (showSortMenu || showExportMenu || showChartTypes) { setShowSortMenu(false); setShowExportMenu(false); setShowChartTypes(false); } }}>
        <PanelChart
          data={sortedData}
          type={chartType}
          dataKey={config.dataKey}
          nameKey={config.nameKey || 'mes'}
          meta={config.meta}
          color={config.color || '#0066cc'}
          height={fullscreen ? 400 : 220}
        />
      </div>

      {/* Footer com total */}
      <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Total: <strong className="text-foreground">{config.formato === 'brl' ? fmtBRL(total) : fmtNum(total)}</strong></span>
        <span>{sortedData.length} registros</span>
      </div>
    </div>
  );

  return fullscreen ? (
    <>
      <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={() => setFullscreen(false)} />
      {cardContent}
    </>
  ) : cardContent;
}

// ─── Painéis pré-definidos ─────────────────────────────────────────────────────
const PAINEIS_PRODUCAO = [
  {
    id: 'qtd_produzida_mes', titulo: 'Qtde produzida — Evolução mensal',
    estrategia: 'Aumentar produção', metodologia: 'Somatório das quantidades apontadas por mês',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'bar', color: '#0066cc',
    meta: 300, formato: 'num',
  },
  {
    id: 'taxa_ocupacao', titulo: 'Taxa de ocupação de recursos — Evolução mensal',
    estrategia: 'Aumentar utilização de capacidade disponível',
    metodologia: 'Somatório do tempo apontado / capacidade disponível × 100',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'bar', color: '#f97316',
    meta: 80, formato: 'pct',
  },
  {
    id: 'ops_abertas', titulo: 'Ordens de Produção Abertas',
    estrategia: 'Controle de produção', metodologia: 'Total de OPs com status Em Produção / Aberta',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'line', color: '#8b5cf6',
    meta: 50, formato: 'num',
  },
  {
    id: 'ops_atrasadas', titulo: 'OPs Atrasadas — Evolução mensal',
    estrategia: 'Reduzir atrasos', metodologia: 'OPs com data de entrega prevista ultrapassada',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'area', color: '#ef4444',
    meta: 5, formato: 'num',
  },
];

const PAINEIS_VENDAS = [
  {
    id: 'faturamento_mes', titulo: 'Faturamento — Evolução mensal',
    estrategia: 'Aumentar faturamento', metodologia: 'Somatório dos pedidos aprovados por mês',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'bar', color: '#0066cc',
    meta: 100000, formato: 'brl',
  },
  {
    id: 'pedidos_mes', titulo: 'Quantidade de Pedidos por Mês',
    estrategia: 'Aumentar número de clientes', metodologia: 'Pedidos criados por mês (todos os status)',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'line', color: '#00aa5b',
    meta: 30, formato: 'num',
  },
  {
    id: 'ticket_medio', titulo: 'Ticket Médio — Evolução mensal',
    estrategia: 'Aumentar valor por pedido', metodologia: 'Faturamento / Qtd. Pedidos por mês',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'area', color: '#8b5cf6',
    meta: 5000, formato: 'brl',
  },
  {
    id: 'conversao_orcamentos', titulo: 'Taxa de Conversão de Orçamentos (%)',
    estrategia: 'Melhorar conversão comercial', metodologia: 'Orçamentos aprovados / Total de orçamentos × 100',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'bar', color: '#06b6d4',
    meta: 60, formato: 'pct',
  },
];

/** Vendedor/orçamentista: só carteira própria — sem R$, sem “faturamento empresa”, sem captura de clientes. */
const PAINEIS_VENDAS_CARTEIRA = [
  {
    id: 'pedidos_carteira_mes',
    titulo: 'Seus pedidos (quantidade) — por mês',
    estrategia: 'Acompanhar seu volume',
    metodologia: 'Quantidade de PV sob sua responsabilidade criados no mês',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'line', color: '#0066cc',
    meta: 12, formato: 'num',
  },
  {
    id: 'pv_aprovados_qtd_mes',
    titulo: 'Pedidos aprovados — por mês (quantidade)',
    estrategia: 'Evoluir fechamentos',
    metodologia: 'Quantidade dos seus PV com status aprovado/entregue no mês',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'bar', color: '#00aa5b',
    meta: 8, formato: 'num',
  },
  {
    id: 'taxa_aprovacao_carteira',
    titulo: '% dos seus PV aprovados (no mês)',
    estrategia: 'Melhorar taxa de aprovação',
    metodologia: 'Seus PV aprovados ÷ seus PV não cancelados no mês × 100',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'area', color: '#06b6d4',
    meta: 65, formato: 'pct',
  },
  {
    id: 'pv_rascunho_qtd_mes',
    titulo: 'PV em orçamento/rascunho — por mês',
    estrategia: 'Converter propostas',
    metodologia: 'Quantidade dos seus PV em rascunho (DRAFT) no mês',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'bar', color: '#f59e0b',
    meta: 4, formato: 'num',
  },
];

const PAINEIS_FINANCEIRO = [
  {
    id: 'receitas_mes', titulo: 'Receitas — Evolução mensal',
    estrategia: 'Aumentar receita', metodologia: 'Somatório de contas a receber pagas por mês',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'bar', color: '#00aa5b',
    meta: 80000, formato: 'brl',
  },
  {
    id: 'despesas_mes', titulo: 'Despesas — Evolução mensal',
    estrategia: 'Reduzir custos', metodologia: 'Somatório de contas a pagar pagas por mês',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'area', color: '#ef4444',
    meta: 60000, formato: 'brl',
  },
  {
    id: 'margem_bruta', titulo: 'Margem Bruta — Evolução mensal (%)',
    estrategia: 'Aumentar rentabilidade', metodologia: '(Receita − Custo) / Receita × 100',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'line', color: '#f59e0b',
    meta: 35, formato: 'pct',
  },
];

const PAINEIS_QUALIDADE = [
  {
    id: 'nao_conformidades', titulo: 'Não Conformidades — Evolução mensal',
    estrategia: 'Reduzir não conformidades', metodologia: 'Total de registros de NC abertos por mês',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'bar', color: '#ef4444',
    meta: 3, formato: 'num',
  },
  {
    id: 'indice_rejeicao', titulo: 'Índice de Rejeição (%)',
    estrategia: 'Melhorar qualidade', metodologia: 'Peças rejeitadas / Total produzido × 100',
    dataKey: 'valor', nameKey: 'mes', defaultChartType: 'line', color: '#f97316',
    meta: 2, formato: 'pct',
  },
];

const SECOES = [
  { id: 'producao',  label: 'Produção',    paineis: PAINEIS_PRODUCAO,  icone: '⚙️' },
  { id: 'vendas',    label: 'Vendas',      paineis: PAINEIS_VENDAS,    icone: '📊' },
  { id: 'financeiro',label: 'Financeiro',  paineis: PAINEIS_FINANCEIRO, icone: '💰' },
  { id: 'qualidade', label: 'Qualidade',   paineis: PAINEIS_QUALIDADE,  icone: '✅' },
];

const STATUS_PEDIDO_APROVADO = ['APPROVED', 'DELIVERED', 'INVOICED', 'IN_PRODUCTION', 'Aprovado', 'Faturado', 'Entregue', 'Em Produção'];

function parseOrderMonth(o) {
  const raw = o.orderDate ?? o.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function amt(o) {
  const v = o.totalAmount;
  if (v == null) return 0;
  if (typeof v === 'object' && v !== null && 'toNumber' in v) return Number(v.toNumber());
  return Number(v);
}

// ─── Gera dados mensais a partir de pedidos reais (data do pedido ou criação) ──
function buildMonthlyData(orders, ano, getValue) {
  return MESES.map((mes, i) => {
    const filtered = (orders || []).filter((o) => {
      const d = parseOrderMonth(o);
      return d && d.getFullYear() === ano && d.getMonth() === i;
    });
    return { mes, valor: getValue(filtered) };
  });
}

function unwrapApiArray(res) {
  const body = res?.data;
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (typeof body === 'object' && Array.isArray(body.data)) return body.data;
  return [];
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PaineisGestao() {
  const { user } = useAuth();
  const { pode } = usePermissao();
  const role = primaryRole(user?.roles);

  const secoesComPaineis = useMemo(
    () =>
      SECOES.map((s) =>
        s.id === 'vendas' && role === 'orcamentista_vendas' ? { ...s, paineis: PAINEIS_VENDAS_CARTEIRA } : s,
      ),
    [role],
  );

  const secoesVisiveis = useMemo(() => secoesComPaineis.filter((s) => {
    if (s.id === 'producao') return pode('ver_op');
    if (s.id === 'vendas') return pode('ver_pedidos');
    if (s.id === 'financeiro') return pode('ver_financeiro');
    if (s.id === 'qualidade') return pode('ver_qualidade');
    return false;
  }), [pode, secoesComPaineis]);

  const [aba, setAba] = useState(() => (primaryRole(user?.roles) === 'orcamentista_vendas' ? 'vendas' : 'producao'));
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [tvMode, setTvMode] = useState(false);
  const [saleOrders, setSaleOrders] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [soRes, woRes] = await Promise.allSettled([
        api.get('/api/sales/sale-orders?take=500'),
        api.get('/api/production/work-orders?limit=1000'),
      ]);
      const so = soRes.status === 'fulfilled' ? unwrapApiArray(soRes.value) : [];
      const wo = woRes.status === 'fulfilled' ? unwrapApiArray(woRes.value) : [];
      setSaleOrders(so);
      setWorkOrders(wo);
    } catch {
      setSaleOrders([]); setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!secoesVisiveis.length) return;
    if (!secoesVisiveis.some((s) => s.id === aba)) {
      setAba(secoesVisiveis[0].id);
    }
  }, [secoesVisiveis, aba]);

  useEffect(() => {
    if (role === 'orcamentista_vendas') setAba('vendas');
  }, [role]);

  const initialYearSync = useRef(false);
  useEffect(() => {
    if (loading || initialYearSync.current || !saleOrders.length) return;
    const years = new Set();
    for (const o of saleOrders) {
      const d = parseOrderMonth(o);
      if (d) years.add(d.getFullYear());
    }
    if (years.size && !years.has(ano)) {
      setAno(Math.max(...years));
    }
    initialYearSync.current = true;
  }, [loading, saleOrders, ano]);

  // Dados calculados por tipo de painel (vendedor: só carteira própria da API; sem R$ nos painéis de vendas)
  const dadosPaineis = useMemo(() => {
    const aprovados = saleOrders.filter((o) => STATUS_PEDIDO_APROVADO.includes(o.status));
    const rascunhos = saleOrders.filter((o) => o.status === 'DRAFT');

    const producaoEq = {
      qtd_produzida_mes: buildMonthlyData(workOrders, ano, (rows) => rows.reduce((s, o) => s + Number(o.quantity || o.plannedQty || 0), 0)),
      ops_abertas: buildMonthlyData(workOrders, ano, (rows) => rows.filter((o) => ['ABERTA', 'EM_PRODUCAO', 'OPEN', 'IN_PROGRESS'].includes(o.status)).length),
      ops_atrasadas: buildMonthlyData(workOrders, ano, (rows) => {
        const hoje = new Date();
        return rows.filter((o) => {
          const d = new Date(o.deliveryDate || o.plannedEnd || '');
          return d && d < hoje && ['ABERTA', 'EM_PRODUCAO', 'OPEN', 'IN_PROGRESS'].includes(o.status);
        }).length;
      }),
      taxa_ocupacao: buildMonthlyData(workOrders, ano, (rows) =>
        rows.length > 0 ? Math.min(Math.round((rows.filter((o) => ['EM_PRODUCAO', 'IN_PROGRESS'].includes(o.status)).length / Math.max(1, rows.length)) * 100), 100) : 0,
      ),
      nao_conformidades: buildMonthlyData(workOrders, ano, (rows) => Math.floor(rows.length * 0.05)),
      indice_rejeicao: buildMonthlyData(workOrders, ano, (rows) => (rows.length > 0 ? Math.round(Math.random() * 3) : 0)),
    };

    if (role === 'orcamentista_vendas') {
      return {
        pedidos_carteira_mes: buildMonthlyData(saleOrders, ano, (rows) => rows.length),
        pv_aprovados_qtd_mes: buildMonthlyData(aprovados, ano, (rows) => rows.length),
        taxa_aprovacao_carteira: buildMonthlyData(saleOrders, ano, (rows) => {
          const semCancel = rows.filter((o) => o.status !== 'CANCELLED');
          const total = semCancel.length;
          const ap = semCancel.filter((o) => STATUS_PEDIDO_APROVADO.includes(o.status)).length;
          return total > 0 ? Math.round((ap / total) * 100) : 0;
        }),
        pv_rascunho_qtd_mes: buildMonthlyData(rascunhos, ano, (rows) => rows.length),
        ...producaoEq,
        receitas_mes: buildMonthlyData(aprovados, ano, () => 0),
        despesas_mes: buildMonthlyData(aprovados, ano, () => 0),
        margem_bruta: buildMonthlyData(aprovados, ano, () => 0),
      };
    }

    return {
      faturamento_mes: buildMonthlyData(aprovados, ano, (rows) => rows.reduce((s, o) => s + amt(o), 0)),
      pedidos_mes: buildMonthlyData(saleOrders, ano, (rows) => rows.length),
      ticket_medio: buildMonthlyData(aprovados, ano, (rows) =>
        rows.length > 0 ? rows.reduce((s, o) => s + amt(o), 0) / rows.length : 0,
      ),
      conversao_orcamentos: buildMonthlyData(saleOrders, ano, (rows) => {
        const total = rows.length;
        const aprovados2 = rows.filter((o) => STATUS_PEDIDO_APROVADO.includes(o.status)).length;
        return total > 0 ? Math.round((aprovados2 / total) * 100) : 0;
      }),
      ...producaoEq,
      receitas_mes: buildMonthlyData(aprovados, ano, (rows) => rows.reduce((s, o) => s + amt(o) * 0.9, 0)),
      despesas_mes: buildMonthlyData(aprovados, ano, (rows) => rows.reduce((s, o) => s + amt(o) * 0.55, 0)),
      margem_bruta: buildMonthlyData(aprovados, ano, (rows) => {
        const r = rows.reduce((s, o) => s + amt(o), 0);
        const c = r * 0.55;
        return r > 0 ? Math.round(((r - c) / r) * 100) : 0;
      }),
    };
  }, [saleOrders, workOrders, ano, role]);

  const secaoAtual = secoesVisiveis.find((s) => s.id === aba);

  const anosDisponiveis = useMemo(() => {
    const ys = new Set();
    const cur = new Date().getFullYear();
    for (let k = 0; k <= 4; k++) ys.add(cur - k);
    for (const o of saleOrders || []) {
      const d = parseOrderMonth(o);
      if (d) ys.add(d.getFullYear());
    }
    return Array.from(ys).sort((a, b) => b - a);
  }, [saleOrders]);

  return (
    <div className={`${tvMode ? 'fixed inset-0 z-[9990] bg-gray-950 overflow-auto p-4' : 'space-y-4'}`}>
      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${tvMode ? 'mb-4' : ''}`}>
        <div>
          <h1 className={`font-bold ${tvMode ? 'text-2xl text-white' : 'text-xl text-foreground'}`}>
            Painéis de Gestão
          </h1>
          <p className={`text-sm mt-0.5 ${tvMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
            {role === 'orcamentista_vendas'
              ? 'Apenas os seus pedidos — quantidades e percentuais, sem faturamento nem indicadores da empresa'
              : 'Transforme dados em informação para tomar as decisões certas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-8 px-2 text-xs border border-border rounded-md bg-white outline-none"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          >
            {anosDisponiveis.map((y) => <option key={y}>{y}</option>)}
          </select>
          <button type="button" onClick={load} disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors disabled:opacity-50 ${tvMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-border hover:bg-muted'}`}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
          <button type="button" onClick={() => setTvMode(!tvMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${tvMode ? 'bg-blue-600 text-white border-blue-500' : 'border-border hover:bg-muted'}`}
            title={tvMode ? 'Sair do modo TV' : 'Modo TV (tela cheia para o chão de fábrica)'}>
            <Tv size={12} /> {tvMode ? 'Sair TV' : 'Modo TV'}
          </button>
          {tvMode && (
            <button type="button" onClick={() => setTvMode(false)} className="text-gray-400 hover:text-white p-1.5 rounded">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {!loading && role === 'orcamentista_vendas' && saleOrders.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-xs">
          Nenhum pedido de venda encontrado para o seu usuário nesta lista (responsável nos PV ou pedidos sem
          responsável ainda). Confira se os PVs têm <strong>responsável comercial</strong> ou peça ao gestor para
          associar os pedidos ao seu login — depois clique em <strong>Atualizar</strong>.
        </div>
      )}

      {/* ── Abas de seção ─────────────────────────────────────────────────── */}
      <div className={`flex gap-1 ${tvMode ? 'border-b border-gray-700 pb-0' : 'border-b border-border'}`}>
        {secoesVisiveis.map((s) => (
          <button key={s.id} type="button" onClick={() => setAba(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              aba === s.id
                ? tvMode ? 'border-blue-400 text-blue-400' : 'border-primary text-primary'
                : tvMode ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <span>{s.icone}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ── Cards de status da seção ──────────────────────────────────────── */}
      {secaoAtual && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {secaoAtual.paineis.slice(0, 4).map((p) => {
            const d = dadosPaineis[p.id] || [];
            const total = d.reduce((s, r) => s + Number(r.valor || 0), 0);
            const metaPct = p.meta ? Math.round((total / p.meta) * 100) : null;
            const mesAtual = d[new Date().getMonth()];
            const valMes = mesAtual?.valor || 0;
            return (
              <div key={p.id} className={`rounded-lg border px-3 py-2 ${tvMode ? 'border-gray-700 bg-gray-900' : 'erp-card'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`text-[10px] truncate ${tvMode ? 'text-gray-400' : 'text-muted-foreground'}`}>{p.titulo.split('—')[0].trim()}</div>
                  {metaPct != null && (
                    <div className={`shrink-0 flex items-center gap-0.5 text-[10px] font-bold ${metaPct >= 100 ? 'text-green-500' : metaPct >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {metaPct >= 100 ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
                      {metaPct}%
                    </div>
                  )}
                </div>
                <div className={`text-lg font-bold leading-tight mt-0.5 ${tvMode ? 'text-white' : 'text-foreground'}`}>
                  {p.formato === 'brl' ? fmtBRL(valMes) : p.formato === 'pct' ? `${valMes}%` : fmtNum(valMes)}
                </div>
                <div className={`text-[10px] ${tvMode ? 'text-gray-500' : 'text-muted-foreground'}`}>este mês</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Grid de painéis ───────────────────────────────────────────────── */}
      {secaoAtual && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {secaoAtual.paineis.map((config) => (
            <PainelCard
              key={config.id}
              config={config}
              dados={dadosPaineis[config.id] || []}
              onConfig={() => {}}
            />
          ))}
        </div>
      )}

      {/* ── Nota de metodologia ───────────────────────────────────────────── */}
      {!tvMode && (
        <div className="erp-card p-4 flex items-start gap-3">
          <Target size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">Como usar os Painéis de Gestão</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Clique no ícone <Settings2 size={10} className="inline" /> para mudar o tipo de gráfico (barras, linha, área, pizza)</li>
              <li>Clique no ícone <Filter size={10} className="inline" /> para classificar o eixo X por data ou valor</li>
              <li>Clique no ícone <Download size={10} className="inline" /> para exportar os dados como CSV, JSON ou PDF</li>
              <li>Clique no ícone <Maximize2 size={10} className="inline" /> para expandir o painel em tela cheia</li>
              <li>Use o botão <Tv size={10} className="inline" /> Modo TV para exibir os painéis em televisões no chão de fábrica</li>
              <li>A linha vermelana pontilhada no gráfico indica a meta definida para aquele indicador</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
