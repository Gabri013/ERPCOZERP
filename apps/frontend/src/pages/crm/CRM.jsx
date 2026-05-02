import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  listCrmProcesses,
  createCrmProcess,
  updateCrmProcess,
  changeCrmProcessStage,
  deleteCrmProcess,
  addCrmNote,
} from '@/services/crmProcessesApi.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
} from 'recharts';
import {
  Users, Plus, Search, Filter, Eye, MessageSquare, Paperclip,
  ChevronDown, ChevronRight, ArrowRight, CheckCircle, XCircle,
  MoreVertical, Pencil, Trash2, ShoppingCart, PhoneCall, Wrench,
  TrendingUp, BarChart2, Star, Clock, Tag, Settings,
} from 'lucide-react';
import { toast } from 'sonner';

const R$ = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

// ─── Tipos de processo ────────────────────────────────────────────────────────
const TIPOS = {
  negociacao:  { label: 'Negociação de Venda',  icon: <ShoppingCart size={12} />, cor: 'erp-badge-success', bg: 'bg-green-50 border-green-200' },
  suporte:     { label: 'Suporte ao Cliente',   icon: <PhoneCall   size={12} />, cor: 'erp-badge-info',    bg: 'bg-blue-50  border-blue-200'  },
  assistencia: { label: 'Assistência Técnica',  icon: <Wrench      size={12} />, cor: 'erp-badge-warning', bg: 'bg-yellow-50 border-yellow-200' },
};

// ─── Etapas por tipo ──────────────────────────────────────────────────────────
const ETAPAS = {
  negociacao:  ['Pré-venda', 'Apresentação Agendada', 'Apresentação Realizada', 'Aguardando Fechamento', 'Negociação Ganha', 'Negociação Perdida'],
  suporte:     ['Aberto', 'Em Análise', 'Aguardando Cliente', 'Em Execução', 'Resolvido', 'Fechado'],
  assistencia: ['Solicitado', 'Agendado', 'Em Campo', 'Laudo Emitido', 'Concluído', 'Cancelado'],
};

const ETAPA_COR = {
  'Negociação Ganha': 'bg-green-500', 'Resolvido': 'bg-green-500', 'Concluído': 'bg-green-500', 'Fechado': 'bg-green-500',
  'Negociação Perdida': 'bg-red-400', 'Cancelado': 'bg-red-400',
};
const etapaCol = (e) => ETAPA_COR[e] || 'bg-primary';


// ─── Campos personalizados por tipo ──────────────────────────────────────────
const CAMPOS_DEF = {
  negociacao:  ['Produto de Interesse', 'Concorrentes', 'Tomador de Decisão', 'Origem do Lead', 'Comissão (%)'],
  suporte:     ['Equipamento', 'Pedido Original', 'Garantia', 'Tipo de Falha'],
  assistencia: ['Contrato', 'Escopo', 'Local', 'Técnico Responsável'],
};

const CORES_PIE = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CRM() {
  const [aba, setAba] = useState('kanban');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [processoSel, setProcessoSel] = useState(null);
  const [abaDetalhe, setAbaDetalhe] = useState('dados');
  const [showNovo, setShowNovo] = useState(false);
  const [showGerarPedido, setShowGerarPedido] = useState(false);
  const [novaTipo, setNovaTipo] = useState('negociacao');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProcessos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listCrmProcesses();
      const mapped = (data ?? []).map((p) => ({
          id: p.id,
          tipo: p.type,
          titulo: p.title,
          cliente: p.clientName,
          responsavel: p.responsible || '',
          etapa: p.stage,
          valor: Number(p.value || 0),
          probabilidade: p.probability || 0,
          origem: p.origin || '',
          prioridade: p.priority,
          abertura: p.openedAt ? p.openedAt.slice(0, 10) : '',
          previsao: p.forecastAt ? p.forecastAt.slice(0, 10) : null,
          pedido_gerado: p.linkedOrderId || null,
          campos: p.customFields || {},
          documentos: (p.attachments || []).map((a) => ({ nome: a.fileName, data: a.createdAt?.slice(0, 10), tipo: a.fileType || 'Documento' })),
          comunicacao: (p.notes || []).map((n) => ({ data: n.createdAt?.slice(0, 10), usuario: n.userName || 'Sistema', msg: n.content, tipo: n.noteType })),
        }));
      setProcessos(mapped);
    } catch {
      setProcessos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProcessos(); }, [loadProcessos]);

  const lista = useMemo(() => processos.filter((p) => {
    if (tipoFiltro !== 'todos' && p.tipo !== tipoFiltro) return false;
    if (busca && !p.titulo.toLowerCase().includes(busca.toLowerCase()) && !p.cliente.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  }), [processos, tipoFiltro, busca]);

  // KPIs
  const totalNeg = processos.filter((p) => p.tipo === 'negociacao');
  const pipeline = totalNeg.filter((p) => !['Negociação Ganha','Negociação Perdida'].includes(p.etapa)).reduce((s, p) => s + p.valor, 0);
  const ganhos  = totalNeg.filter((p) => p.etapa === 'Negociação Ganha').reduce((s, p) => s + p.valor, 0);
  const taxaConv = totalNeg.length ? (totalNeg.filter((p) => p.etapa === 'Negociação Ganha').length / totalNeg.length * 100).toFixed(0) : 0;

  // Kanban agrupa por etapa
  const tipoKanban = tipoFiltro === 'todos' ? 'negociacao' : tipoFiltro;
  const etapasKanban = ETAPAS[tipoKanban];
  const colunas = etapasKanban.map((e) => ({ etapa: e, cards: lista.filter((p) => p.tipo === tipoKanban && p.etapa === e) }));

  // Funil
  const dadosFunil = ETAPAS.negociacao.slice(0, -1).map((e) => ({ name: e, value: totalNeg.filter((p) => p.etapa === e || ETAPAS.negociacao.indexOf(e) < ETAPAS.negociacao.indexOf(p.etapa)).length }));

  // Distribuição por tipo
  const distTipo = Object.entries(TIPOS).map(([k, v]) => ({ name: v.label, value: processos.filter((p) => p.tipo === k).length }));

  const ABAS = [
    { id: 'kanban',   label: 'Kanban' },
    { id: 'lista',    label: 'Lista' },
    { id: 'painel',   label: 'Painel' },
    { id: 'campos',   label: 'Campos Personalizados' },
    ...(processoSel ? [{ id: 'detalhe', label: `↗ ${processoSel.id}` }] : []),
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Users size={20} className="text-primary" />CRM — Gestão de Processos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Negociações, suporte ao cliente e assistência técnica em um único lugar</p>
        </div>
        <button type="button" onClick={() => setShowNovo(true)} className="erp-btn text-xs flex items-center gap-1.5 self-start"><Plus size={13} />Novo Processo</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pipeline Ativo',    val: R$(pipeline),   sub: 'em negociações abertas', icon: <TrendingUp size={14} className="text-primary" /> },
          { label: 'Receita Ganha',     val: R$(ganhos),     sub: 'negociações fechadas',   icon: <CheckCircle size={14} className="text-green-600" /> },
          { label: 'Taxa de Conversão', val: `${taxaConv}%`, sub: 'de leads em vendas',     icon: <Star size={14} className="text-yellow-500" /> },
          { label: 'Processos Abertos', val: processos.filter((p) => !['Negociação Ganha','Negociação Perdida','Resolvido','Fechado','Concluído','Cancelado'].includes(p.etapa)).length, sub: 'aguardando ação', icon: <Clock size={14} className="text-orange-500" /> },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3 flex items-center gap-3">{k.icon}<div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className="font-bold text-sm">{k.val}</p><p className="text-[10px] text-muted-foreground">{k.sub}</p></div></div>
        ))}
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-36 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-8 text-xs w-full" placeholder="Buscar processo ou cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {[['todos','Todos'], ['negociacao','Negociação'], ['suporte','Suporte'], ['assistencia','Assistência']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setTipoFiltro(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${tipoFiltro === v ? 'bg-primary text-white border-primary' : 'bg-muted/10 border-border text-muted-foreground hover:bg-muted/20'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── KANBAN ──────────────────────────────────────────────────── */}
      {aba === 'kanban' && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3" style={{ minWidth: etapasKanban.length * 200 }}>
            {colunas.map((col) => (
              <div key={col.etapa} className="flex-1 min-w-44">
                <div className={`h-1.5 rounded-full mb-2 ${etapaCol(col.etapa)}`} />
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <p className="text-xs font-semibold">{col.etapa}</p>
                  <span className="text-[10px] bg-muted/20 rounded-full px-2 py-0.5">{col.cards.length}</span>
                </div>
                <div className="space-y-2">
                  {col.cards.map((c) => (
                    <div key={c.id} onClick={() => { setProcessoSel(c); setAba('detalhe'); setAbaDetalhe('dados'); }}
                      className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow bg-white ${c.prioridade === 'Alta' ? 'border-l-4 border-l-red-400' : 'border-border'}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`erp-badge ${TIPOS[c.tipo]?.cor} text-[9px]`}>{TIPOS[c.tipo]?.label}</span>
                        {c.pedido_gerado && <span className="erp-badge erp-badge-success text-[9px]">PV Gerado</span>}
                      </div>
                      <p className="text-xs font-semibold line-clamp-2">{c.titulo}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.cliente}</p>
                      {c.valor > 0 && <p className="text-[11px] font-bold text-primary mt-1">{R$(c.valor)}</p>}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9px] text-muted-foreground">{c.responsavel}</span>
                        {c.probabilidade < 100 && <div className="flex items-center gap-1"><div className="w-10 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${c.probabilidade}%` }} /></div><span className="text-[9px]">{c.probabilidade}%</span></div>}
                      </div>
                    </div>
                  ))}
                  {col.cards.length === 0 && <div className="border border-dashed border-border rounded-lg p-4 text-center text-[10px] text-muted-foreground">Nenhum processo</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LISTA ──────────────────────────────────────────────────── */}
      {aba === 'lista' && (
        <div className="erp-card overflow-x-auto">
          <table className="erp-table w-full">
            <thead>
              <tr><th>ID</th><th>Tipo</th><th>Título / Cliente</th><th>Responsável</th><th>Etapa</th><th className="text-right">Valor</th><th>Prob.</th><th>Previsão</th><th></th></tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="hover:bg-muted/5 cursor-pointer" onClick={() => { setProcessoSel(p); setAba('detalhe'); setAbaDetalhe('dados'); }}>
                  <td className="font-mono font-bold text-primary text-xs">{p.id}</td>
                  <td><span className={`erp-badge ${TIPOS[p.tipo]?.cor} text-[9px]`}>{TIPOS[p.tipo]?.label}</span></td>
                  <td><p className="font-semibold text-xs">{p.titulo}</p><p className="text-[10px] text-muted-foreground">{p.cliente}</p></td>
                  <td className="text-xs text-muted-foreground">{p.responsavel}</td>
                  <td><span className={`erp-badge text-[9px] ${['Negociação Ganha','Resolvido','Concluído','Fechado'].includes(p.etapa) ? 'erp-badge-success' : ['Negociação Perdida','Cancelado'].includes(p.etapa) ? 'erp-badge-danger' : 'erp-badge-info'}`}>{p.etapa}</span></td>
                  <td className="text-right font-semibold text-xs">{p.valor > 0 ? R$(p.valor) : '—'}</td>
                  <td><div className="flex items-center gap-1"><div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${p.probabilidade}%` }} /></div><span className="text-[10px]">{p.probabilidade}%</span></div></td>
                  <td className="text-xs text-muted-foreground">{p.previsao}</td>
                  <td><button type="button" className="erp-btn-ghost text-xs p-1" onClick={(e) => { e.stopPropagation(); setProcessoSel(p); setAba('detalhe'); }}><Eye size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PAINEL ──────────────────────────────────────────────────── */}
      {aba === 'painel' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Funil de vendas */}
            <div className="erp-card p-4">
              <p className="text-xs font-semibold mb-3">Funil de Vendas — Negociações</p>
              <div className="space-y-1.5">
                {ETAPAS.negociacao.map((e, i) => {
                  const cnt = totalNeg.filter((p) => p.etapa === e).length;
                  const maxCnt = Math.max(...ETAPAS.negociacao.map((et) => totalNeg.filter((p) => p.etapa === et).length), 1);
                  const pctW = Math.max(20, (cnt / Math.max(totalNeg.length, 1)) * 100);
                  return (
                    <div key={e} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-36 shrink-0 text-right">{e}</span>
                      <div className="flex-1 h-5 bg-muted/20 rounded-md overflow-hidden flex items-center">
                        <div className={`h-full rounded-md flex items-center px-2 ${etapaCol(e)}`} style={{ width: `${pctW}%`, minWidth: 24, transition: 'width 0.3s' }}>
                          <span className="text-[9px] text-white font-bold">{cnt}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribuição por tipo */}
            <div className="erp-card p-4">
              <p className="text-xs font-semibold mb-2">Processos por Tipo</p>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name.split(' ')[0]}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>
                      {distTipo.map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pipeline por responsável */}
            <div className="erp-card p-4" style={{ height: 220 }}>
              <p className="text-xs font-semibold mb-2">Pipeline por Responsável</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={['Carlos Eng.','Ana Comercial','Pedro Prod.','Maria Fin.'].map((r) => ({
                  nome: r.split(' ')[0],
                  pipeline: processos.filter((p) => p.responsavel === r).reduce((s, p) => s + p.valor, 0),
                  ganho: processos.filter((p) => p.responsavel === r && p.etapa === 'Negociação Ganha').reduce((s, p) => s + p.valor, 0),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nome" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => R$(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="pipeline" name="Pipeline" fill="#2563eb" radius={[2,2,0,0]} />
                  <Bar dataKey="ganho"    name="Ganho"    fill="#10b981" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Evolução de processos abertos */}
            <div className="erp-card p-4" style={{ height: 220 }}>
              <p className="text-xs font-semibold mb-2">Evolução de Processos — últimos 6 meses</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { mes: 'Dez', neg: 3, sup: 4, ast: 2 },
                  { mes: 'Jan', neg: 5, sup: 3, ast: 3 },
                  { mes: 'Fev', neg: 4, sup: 5, ast: 2 },
                  { mes: 'Mar', neg: 6, sup: 4, ast: 4 },
                  { mes: 'Abr', neg: 5, sup: 6, ast: 3 },
                  { mes: 'Mai', neg: 7, sup: 5, ast: 4 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line dataKey="neg" name="Negociação" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line dataKey="sup" name="Suporte"    stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line dataKey="ast" name="Assistência" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPOS PERSONALIZADOS ─────────────────────────────────── */}
      {aba === 'campos' && (
        <div className="space-y-4">
          {Object.entries(TIPOS).map(([tipo, meta]) => (
            <div key={tipo} className="erp-card overflow-hidden">
              <div className={`px-4 py-3 border-b border-border flex items-center justify-between ${tipo === 'negociacao' ? 'bg-green-50' : tipo === 'suporte' ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center gap-2">{meta.icon}<p className="text-xs font-semibold">{meta.label}</p></div>
                <button type="button" onClick={() => toast.info('Campo adicionado!')} className="erp-btn text-xs flex items-center gap-1"><Plus size={11} />Novo Campo</button>
              </div>
              <table className="erp-table w-full">
                <thead><tr><th>#</th><th>Nome do Campo</th><th>Tipo</th><th>Obrigatório</th><th>Ativo</th><th></th></tr></thead>
                <tbody>
                  {CAMPOS_DEF[tipo].map((c, i) => (
                    <tr key={c}>
                      <td className="text-muted-foreground text-[10px]">{i + 1}</td>
                      <td className="font-medium text-xs">{c}</td>
                      <td><span className="erp-badge erp-badge-info text-[9px]">Texto</span></td>
                      <td><span className={`erp-badge text-[9px] ${i < 2 ? 'erp-badge-warning' : 'erp-badge-success'}`}>{i < 2 ? 'Sim' : 'Não'}</span></td>
                      <td><span className="erp-badge erp-badge-success text-[9px]">Ativo</span></td>
                      <td><button type="button" className="erp-btn-ghost p-1 text-xs"><Pencil size={11} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* ── DETALHE ──────────────────────────────────────────────── */}
      {aba === 'detalhe' && processoSel && (() => {
        const p = processoSel;
        const ABAS_D = [
          { id: 'dados',       label: 'Dados' },
          { id: 'comunicacao', label: 'Comunicação' },
          { id: 'documentos',  label: 'Documentos' },
          { id: 'campos',      label: 'Campos Personalizados' },
        ];
        return (
          <div className="space-y-3">
            {/* Cabeçalho processo */}
            <div className={`erp-card p-4 border-l-4 ${p.tipo === 'negociacao' ? 'border-l-green-500' : p.tipo === 'suporte' ? 'border-l-blue-500' : 'border-l-yellow-500'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-primary">{p.id}</span>
                    <span className={`erp-badge ${TIPOS[p.tipo]?.cor}`}>{TIPOS[p.tipo]?.label}</span>
                    <span className={`erp-badge text-[9px] ${['Negociação Ganha','Resolvido','Concluído','Fechado'].includes(p.etapa) ? 'erp-badge-success' : ['Negociação Perdida','Cancelado'].includes(p.etapa) ? 'erp-badge-danger' : 'erp-badge-info'}`}>{p.etapa}</span>
                    {p.prioridade === 'Alta' && <span className="erp-badge erp-badge-danger text-[9px]">⚡ Alta Prioridade</span>}
                  </div>
                  <p className="font-bold text-base mt-1">{p.titulo}</p>
                  <p className="text-xs text-muted-foreground">{p.cliente} · Resp: {p.responsavel}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {p.valor > 0 && <p className="text-lg font-bold text-primary">{R$(p.valor)}</p>}
                  {p.tipo === 'negociacao' && !p.pedido_gerado && p.etapa === 'Aguardando Fechamento' && (
                    <button type="button" onClick={() => setShowGerarPedido(true)} className="erp-btn text-xs flex items-center gap-1.5"><ShoppingCart size={12} />Gerar Pedido de Venda</button>
                  )}
                  {p.pedido_gerado && <span className="erp-badge erp-badge-success text-xs font-bold">✓ {p.pedido_gerado}</span>}
                </div>
              </div>
              {/* Barra de etapas */}
              <div className="mt-3 overflow-x-auto">
                <div className="flex items-center gap-0" style={{ minWidth: ETAPAS[p.tipo].length * 90 }}>
                  {ETAPAS[p.tipo].map((e, i) => {
                    const idx = ETAPAS[p.tipo].indexOf(p.etapa);
                    const done = i < idx;
                    const active = i === idx;
                    return (
                      <div key={e} className="flex items-center flex-1">
                        <div className={`flex flex-col items-center gap-0.5 flex-1 px-1`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-primary bg-primary' : done ? 'border-green-500 bg-green-500' : 'border-muted-foreground/30 bg-white'}`}>
                            {done && <CheckCircle size={8} className="text-white" />}
                            {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <p className={`text-[8px] text-center leading-tight ${active ? 'text-primary font-bold' : done ? 'text-green-600' : 'text-muted-foreground'}`}>{e}</p>
                        </div>
                        {i < ETAPAS[p.tipo].length - 1 && <div className={`h-0.5 w-4 shrink-0 ${done ? 'bg-green-500' : 'bg-muted/30'}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sub-abas detalhe */}
            <div className="border-b border-border flex gap-0">
              {ABAS_D.map((a) => (
                <button key={a.id} type="button" onClick={() => setAbaDetalhe(a.id)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${abaDetalhe === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{a.label}</button>
              ))}
            </div>

            {/* ── Dados ── */}
            {abaDetalhe === 'dados' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="erp-card p-4 space-y-3">
                  <p className="text-xs font-semibold border-b pb-1.5">Informações Gerais</p>
                  {[
                    ['Tipo', TIPOS[p.tipo]?.label],
                    ['Cliente', p.cliente],
                    ['Responsável', p.responsavel],
                    ['Origem', p.origem],
                    ['Prioridade', p.prioridade],
                    ['Data de Abertura', p.abertura],
                    ['Previsão de Fechamento', p.previsao],
                    ...(p.valor > 0 ? [['Valor Estimado', R$(p.valor)], ['Probabilidade', `${p.probabilidade}%`]] : []),
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs"><span className="text-muted-foreground">{l}</span><span className="font-medium text-right max-w-40 truncate">{v}</span></div>
                  ))}
                </div>
                <div className="erp-card p-4 space-y-3">
                  <p className="text-xs font-semibold border-b pb-1.5">Mover Etapa</p>
                  <div className="grid grid-cols-1 gap-2">
                    {ETAPAS[p.tipo].map((e) => (
                      <button key={e} type="button" onClick={() => { toast.success(`Etapa alterada para: ${e}`); }}
                        className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors flex items-center justify-between ${p.etapa === e ? 'bg-primary text-white border-primary' : 'hover:bg-muted/10 border-border'}`}>
                        <span>{e}</span>
                        {p.etapa === e && <span className="text-[9px] opacity-75">etapa atual</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Comunicação ── */}
            {abaDetalhe === 'comunicacao' && (
              <div className="erp-card p-4 space-y-3">
                <p className="text-xs font-semibold flex items-center gap-2"><MessageSquare size={13} className="text-primary" />Pareceres e Comunicação</p>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {p.comunicacao.map((m, i) => (
                    <div key={i} className={`flex gap-3 p-3 rounded-lg text-xs ${m.tipo === 'pedido' ? 'bg-green-50 border border-green-200' : m.tipo === 'proposta' ? 'bg-blue-50 border border-blue-100' : 'bg-muted/10'}`}>
                      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">{m.usuario.split(' ').map((x) => x[0]).slice(0,2).join('')}</div>
                      <div><div className="flex items-center gap-2"><span className="font-semibold">{m.usuario}</span><span className="text-muted-foreground">{m.data}</span><span className={`erp-badge text-[8px] ${m.tipo === 'pedido' ? 'erp-badge-success' : m.tipo === 'proposta' ? 'erp-badge-info' : 'erp-badge-warning'}`}>{m.tipo}</span></div><p className="mt-0.5">{m.msg}</p></div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1 border-t border-border">
                  <input className="erp-input flex-1 text-xs" placeholder="Registrar parecer, atualização ou interação..." value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)} />
                  <button type="button" className="erp-btn-ghost text-xs flex items-center gap-1"><Paperclip size={12} />Anexo</button>
                  <button type="button" onClick={() => { if (novaMensagem.trim()) { toast.success('Parecer registrado!'); setNovaMensagem(''); } }} className="erp-btn text-xs">Registrar</button>
                </div>
              </div>
            )}

            {/* ── Documentos ── */}
            {abaDetalhe === 'documentos' && (
              <div className="erp-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold flex items-center gap-2"><Paperclip size={13} className="text-primary" />Documentos Anexados</p>
                  <button type="button" onClick={() => toast.info('Upload simulado!')} className="erp-btn text-xs flex items-center gap-1"><Plus size={11} />Anexar</button>
                </div>
                {p.documentos.length === 0
                  ? <div className="border border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground">Nenhum documento anexado. Clique em Anexar para adicionar.</div>
                  : <div className="space-y-2">
                    {p.documentos.map((d, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted/10 border border-border rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-2"><span className="erp-badge erp-badge-info text-[9px]">{d.tipo}</span><span className="text-xs font-medium">{d.nome}</span></div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{d.data}</span><button type="button" onClick={() => toast.info('Download simulado!')} className="erp-btn-ghost text-[10px] py-0.5 px-2">Baixar</button></div>
                      </div>
                    ))}
                  </div>}
              </div>
            )}

            {/* ── Campos Personalizados ── */}
            {abaDetalhe === 'campos' && (
              <div className="erp-card p-4 space-y-3">
                <p className="text-xs font-semibold flex items-center gap-2"><Tag size={13} className="text-primary" />Campos Personalizados — {TIPOS[p.tipo]?.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(p.campos).map(([k, v]) => (
                    <div key={k}><label className="erp-label">{k}</label><input className="erp-input w-full" defaultValue={v} /></div>
                  ))}
                  {CAMPOS_DEF[p.tipo].filter((c) => !Object.keys(p.campos).includes(c)).map((c) => (
                    <div key={c}><label className="erp-label">{c}</label><input className="erp-input w-full" placeholder="Preencher..." /></div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => toast.success('Campos salvos!')} className="erp-btn text-xs">Salvar Campos</button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Modal Novo Processo */}
      {showNovo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><Users size={15} />Novo Processo</p>
              <button type="button" onClick={() => setShowNovo(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="erp-label">Tipo de Processo</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {Object.entries(TIPOS).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setNovaTipo(k)}
                      className={`border rounded-lg p-3 text-xs text-center transition-colors flex flex-col items-center gap-1.5 ${novaTipo === k ? 'border-primary bg-primary/5 text-primary font-semibold' : 'border-border hover:bg-muted/10'}`}>
                      <span className="text-base">{k === 'negociacao' ? '🤝' : k === 'suporte' ? '📞' : '🔧'}</span>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="erp-label">Título do Processo</label><input className="erp-input w-full" placeholder="Ex.: Proposta Tanque 5.000L — Pharma Sul" /></div>
                <div><label className="erp-label">Cliente</label><input className="erp-input w-full" /></div>
                <div><label className="erp-label">Responsável</label><input className="erp-input w-full" defaultValue="Carlos Eng." /></div>
                <div><label className="erp-label">Origem</label><select className="erp-input w-full"><option>Indicação</option><option>Site</option><option>Feira</option><option>Contrato</option><option>Pós-venda</option></select></div>
                <div><label className="erp-label">Prioridade</label><select className="erp-input w-full"><option>Normal</option><option>Alta</option></select></div>
                {novaTipo === 'negociacao' && <>
                  <div><label className="erp-label">Valor Estimado (R$)</label><input type="number" className="erp-input w-full" /></div>
                  <div><label className="erp-label">Probabilidade (%)</label><input type="number" className="erp-input w-full" defaultValue={50} /></div>
                </>}
                <div><label className="erp-label">Previsão de Fechamento</label><input type="date" className="erp-input w-full" /></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNovo(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Processo criado!'); setShowNovo(false); }} className="erp-btn flex-1">Criar Processo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gerar Pedido de Venda */}
      {showGerarPedido && processoSel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><ShoppingCart size={15} />Gerar Pedido de Venda</p>
              <button type="button" onClick={() => setShowGerarPedido(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-muted/10 border border-border rounded-lg p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">Processo:</span> <span className="font-semibold">{processoSel.id}</span></p>
                <p><span className="text-muted-foreground">Cliente:</span> <span className="font-semibold">{processoSel.cliente}</span></p>
                <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-primary">{R$(processoSel.valor)}</span></p>
              </div>
              <p className="text-xs text-muted-foreground">Um Pedido de Venda será gerado no módulo de Vendas com os dados desta negociação. O processo será marcado como <strong>Negociação Ganha</strong>.</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Condição de Pagamento</label><select className="erp-input w-full"><option>30/60/90 dias</option><option>À vista</option><option>50% + 50%</option></select></div>
                <div><label className="erp-label">Prazo de Entrega</label><input type="date" className="erp-input w-full" /></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowGerarPedido(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Pedido PV-2026-0098 gerado! Processo marcado como Negociação Ganha.'); setShowGerarPedido(false); }} className="erp-btn flex-1 flex items-center gap-1.5 justify-center"><ShoppingCart size={13} />Gerar Pedido</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
