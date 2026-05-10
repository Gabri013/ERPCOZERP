import { useState, useEffect, useCallback } from 'react';
import { listProjects } from '@/services/projectsApi.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  FolderKanban, Plus, Clock, DollarSign, Users, MessageSquare,
  Paperclip, TrendingUp, Calendar, BarChart2, Eye, Download,
} from 'lucide-react';
import { toast } from 'sonner';

const R$ = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v) => `${Number(v || 0).toFixed(1)}%`;

// ─── Projetos ────────────────────────────────────────────────────────────────
const PROJETOS = [
  {
    id: 'PRJ-2026-001', nome: 'Linha de Produção Pharma Brasil',
    cliente: 'Pharma Brasil Ltda', pedido: 'PV-2026-0089',
    inicio: '2026-03-01', fim_planejado: '2026-06-30', fim_real: null,
    status: 'em_andamento', avanco: 52,
    custo_orcado: 480_000, custo_real: 198_500,
    receita: 620_000, receita_realizada: 280_000,
    responsavel: 'Carlos Eng.', equipe: ['Carlos Eng.', 'Ana Qualidade', 'Pedro Prod.', 'Maria Fin.'],
    descricao: 'Fornecimento e instalação de linha completa de tanques e reatores para produção farmacêutica.',
    tarefas: [
      { id: 1, nivel: 0, nome: 'Engenharia e Projetos',    dur: 20, inicio_d: 0,  avanco: 100, responsavel: 'Carlos Eng.',  predecessora: null, custo_h_orc: 8000,  horas_orc: 120, horas_real: 118 },
      { id: 2, nivel: 1, nome: 'Memorial Descritivo',      dur: 5,  inicio_d: 0,  avanco: 100, responsavel: 'Carlos Eng.',  predecessora: null, custo_h_orc: 2000,  horas_orc: 30,  horas_real: 28 },
      { id: 3, nivel: 1, nome: 'Desenhos Técnicos',        dur: 10, inicio_d: 5,  avanco: 100, responsavel: 'Carlos Eng.',  predecessora: 2,    custo_h_orc: 4000,  horas_orc: 60,  horas_real: 62 },
      { id: 4, nivel: 1, nome: 'Aprovação do Cliente',     dur: 5,  inicio_d: 15, avanco: 100, responsavel: 'Ana Qualidade',predecessora: 3,    custo_h_orc: 2000,  horas_orc: 30,  horas_real: 28 },
      { id: 5, nivel: 0, nome: 'Fabricação',               dur: 60, inicio_d: 20, avanco: 65,  responsavel: 'Pedro Prod.',  predecessora: 4,    custo_h_orc: 30000, horas_orc: 450, horas_real: 290 },
      { id: 6, nivel: 1, nome: 'Fabricação Tanques (×2)',  dur: 30, inicio_d: 20, avanco: 100, responsavel: 'Pedro Prod.',  predecessora: 4,    custo_h_orc: 15000, horas_orc: 200, horas_real: 198 },
      { id: 7, nivel: 1, nome: 'Fabricação Reatores (×1)', dur: 25, inicio_d: 25, avanco: 80,  responsavel: 'Pedro Prod.',  predecessora: 4,    custo_h_orc: 10000, horas_orc: 150, horas_real: 112 },
      { id: 8, nivel: 1, nome: 'Inspeção e Testes',        dur: 10, inicio_d: 50, avanco: 0,   responsavel: 'Ana Qualidade',predecessora: 7,    custo_h_orc: 5000,  horas_orc: 100, horas_real: 0 },
      { id: 9, nivel: 0, nome: 'Instalação',               dur: 20, inicio_d: 80, avanco: 0,   responsavel: 'Pedro Prod.',  predecessora: 5,    custo_h_orc: 12000, horas_orc: 200, horas_real: 0 },
      { id: 10,nivel: 0, nome: 'Comissionamento',          dur: 10, inicio_d: 100,avanco: 0,   responsavel: 'Carlos Eng.',  predecessora: 9,    custo_h_orc: 6000,  horas_orc: 80,  horas_real: 0 },
    ],
    custos_extras: [
      { data: '2026-03-15', descricao: 'Frete de materiais especiais', valor: 4800, categoria: 'Logística' },
      { data: '2026-04-02', descricao: 'Ensaios laboratoriais externos', valor: 3200, categoria: 'Qualidade' },
    ],
    comunicacao: [
      { data: '2026-04-30', usuario: 'Carlos Eng.', mensagem: 'Fabricação dos tanques concluída. Iniciando reatores.', tipo: 'nota' },
      { data: '2026-04-28', usuario: 'Ana Qualidade', mensagem: 'Certificados de materiais aprovados pelo cliente.', tipo: 'nota' },
      { data: '2026-04-25', usuario: 'Maria Fin.', mensagem: 'Fatura #001 emitida — R$ 186.000 (30% adiantamento).', tipo: 'financeiro' },
    ],
    fluxo_caixa: [
      { mes: 'Mar', recebido: 186000, pago: 120000 },
      { mes: 'Abr', recebido: 94000, pago: 48000 },
      { mes: 'Mai', recebido: 0, pago: 28000 },
      { mes: 'Jun', recebido: 340000, pago: 42000 },
    ],
  },
  {
    id: 'PRJ-2026-002', nome: 'Modernização Alimentos SA',
    cliente: 'Alimentos SA', pedido: 'PV-2026-0081',
    inicio: '2026-04-01', fim_planejado: '2026-05-31', fim_real: null,
    status: 'em_andamento', avanco: 35,
    custo_orcado: 180_000, custo_real: 52_000,
    receita: 240_000, receita_realizada: 72_000,
    responsavel: 'Pedro Prod.', equipe: ['Pedro Prod.', 'Carlos Eng.'],
    descricao: 'Modernização da linha de agitadores da planta industrial.',
    tarefas: [],
    custos_extras: [],
    comunicacao: [],
    fluxo_caixa: [
      { mes: 'Abr', recebido: 72000, pago: 40000 },
      { mes: 'Mai', recebido: 168000, pago: 62000 },
    ],
  },
];

const STATUS_PRJ = {
  em_andamento: { label: 'Em Andamento', cls: 'erp-badge-info'    },
  concluido:    { label: 'Concluído',    cls: 'erp-badge-success' },
  atrasado:     { label: 'Atrasado',     cls: 'erp-badge-danger'  },
  planejamento: { label: 'Planejamento', cls: 'erp-badge-warning' },
};

const CORES_STATUS = { 100: '#10b981', 0: '#d1d5db' };
const ganttColor = (avanco) => avanco === 100 ? '#10b981' : avanco > 0 ? '#2563eb' : '#d1d5db';
const TOTAL_DIAS = 110;

export default function GestaoProjetos() {
  const [aba, setAba] = useState('lista');
  const [projetos, setProjetos] = useState([]);
  const [projetoSel, setProjetoSel] = useState(null);
  const [abaDetalhe, setAbaDetalhe] = useState('gantt');
  const [tarefaExp, setTarefaExp] = useState({});
  const [showNovoProj, setShowNovoProj] = useState(false);
  const [showApontamento, setShowApontamento] = useState(false);
  const [showCusto, setShowCusto] = useState(false);
  const [msgNova, setMsgNova] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProjetos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listProjects();
      const mapped = (data ?? []).map((p) => ({
          id: p.code,
          _id: p.id,
          nome: p.name,
          cliente: p.clientName,
          pedido: p.linkedOrderId || '',
          inicio: p.startDate ? p.startDate.slice(0, 10) : '',
          fim_planejado: p.dueDate ? p.dueDate.slice(0, 10) : '',
          fim_real: null,
          status: p.status,
          avanco: p.progress,
          custo_orcado: Number(p.budgetedCost || 0),
          custo_real: (p.costEntries || []).reduce((s, c) => s + Number(c.amount), 0),
          receita: Number(p.revenue || 0),
          receita_realizada: 0,
          responsavel: p.responsible || '',
          equipe: Array.isArray(p.team) ? p.team : [],
          descricao: p.description || '',
          tarefas: (p.tasks || []).map((t) => ({
            id: t.id,
            nivel: t.level,
            nome: t.name,
            dur: t.durationDays,
            inicio_d: t.startOffset,
            avanco: t.progress,
            responsavel: t.responsible || '',
            predecessora: t.predecessor,
            custo_h_orc: 0,
            horas_orc: Number(t.hoursPlanned),
            horas_real: Number(t.hoursReal),
          })),
          custos_extras: (p.costEntries || []).map((c) => ({
            data: c.entryDate ? c.entryDate.slice(0, 10) : '',
            descricao: c.description,
            valor: Number(c.amount),
            categoria: c.category,
          })),
          comunicacao: (p.notes || []).map((n) => ({
            data: n.createdAt?.slice(0, 10),
            usuario: n.userName,
            mensagem: n.content,
            tipo: n.noteType,
          })),
          fluxo_caixa: [],
        }));
      setProjetos(mapped);
      setProjetoSel(mapped[0] || null);
    } catch {
      setProjetos([]); setProjetoSel(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjetos(); }, [loadProjetos]);

  const proj = projetoSel;
  const totalHorasOrc = proj?.tarefas.reduce((s, t) => s + t.horas_orc, 0) || 0;
  const totalHorasReal = proj?.tarefas.reduce((s, t) => s + t.horas_real, 0) || 0;
  const custoMO = proj?.tarefas.reduce((s, t) => s + t.custo_h_orc * (t.horas_real / (t.horas_orc || 1)), 0) || 0;
  const custosExtras = proj?.custos_extras.reduce((s, c) => s + c.valor, 0) || 0;
  const custoTotalReal = custoMO + custosExtras;
  const varCusto = proj ? ((custoTotalReal - proj.custo_orcado) / proj.custo_orcado * 100) : 0;

  const ABAS = [{ id: 'lista', label: 'Lista de Projetos' }, { id: 'detalhe', label: 'Detalhe do Projeto', disabled: !proj }];
  const ABAS_DETALHE = [
    { id: 'gantt',      label: 'Gantt / EAP' },
    { id: 'apontamentos', label: 'Apontamentos' },
    { id: 'custos',     label: 'Custos' },
    { id: 'painel',     label: 'Painel Financeiro' },
    { id: 'comunicacao',label: 'Comunicação' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><FolderKanban size={20} className="text-primary" />Gestão de Projetos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Planejamento, execução, custos e comunicação integrados à produção e financeiro</p>
        </div>
        <button type="button" onClick={() => setShowNovoProj(true)} className="erp-btn text-xs flex items-center gap-1.5 self-start"><Plus size={13} />Novo Projeto</button>
      </div>

      {/* KPIs globais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Projetos Ativos', val: projetos.filter((p) => p.status === 'em_andamento').length, icon: <FolderKanban size={14} className="text-primary" />, cor: 'text-primary' },
          { label: 'Receita Total', val: R$(projetos.reduce((s, p) => s + p.receita, 0)), icon: <DollarSign size={14} className="text-green-600" />, cor: 'text-green-700' },
          { label: 'Custo Orçado', val: R$(projetos.reduce((s, p) => s + p.custo_orcado, 0)), icon: <BarChart2 size={14} className="text-blue-600" />, cor: 'text-primary' },
          { label: 'Margem Proj.', val: pct(projetos.reduce((s, p) => s + p.receita, 0) ? (projetos.reduce((s, p) => s + p.receita - p.custo_orcado, 0)) / projetos.reduce((s, p) => s + p.receita, 0) * 100 : 0), icon: <TrendingUp size={14} className="text-yellow-600" />, cor: 'text-yellow-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3 flex items-center gap-3">{k.icon}<div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className={`font-bold text-sm ${k.cor}`}>{k.val}</p></div></div>
        ))}
      </div>

      {/* Abas principais */}
      <div className="border-b border-border flex gap-0">
        {ABAS.map((a) => (
          <button key={a.id} type="button" disabled={a.disabled} onClick={() => !a.disabled && setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors disabled:opacity-40 ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── LISTA ────────────────────────────────────────────────────────── */}
      {aba === 'lista' && (
        <div className="space-y-3">
          {projetos.map((p) => {
            const margem = ((p.receita - p.custo_orcado) / p.receita * 100).toFixed(1);
            return (
              <div key={p.id} className={`erp-card p-5 border-l-4 ${p.status === 'concluido' ? 'border-l-green-500' : p.status === 'atrasado' ? 'border-l-red-500' : 'border-l-primary'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-primary">{p.id}</span>
                      <span className={`erp-badge ${STATUS_PRJ[p.status]?.cls}`}>{STATUS_PRJ[p.status]?.label}</span>
                    </div>
                    <p className="font-bold text-base mt-0.5">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.cliente} · {p.pedido}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.descricao}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={11} />{p.inicio} → {p.fim_planejado}</span>
                      <span className="flex items-center gap-1"><Users size={11} />{p.equipe.length} pessoas</span>
                      <span className="flex items-center gap-1"><Users size={11} />Resp.: {p.responsavel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="grid grid-cols-3 gap-3 text-right text-xs">
                      <div><p className="text-muted-foreground">Receita</p><p className="font-bold text-green-700">{R$(p.receita)}</p></div>
                      <div><p className="text-muted-foreground">Custo Orc.</p><p className="font-bold">{R$(p.custo_orcado)}</p></div>
                      <div><p className="text-muted-foreground">Margem</p><p className={`font-bold ${Number(margem) >= 25 ? 'text-green-600' : 'text-red-600'}`}>{margem}%</p></div>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between text-xs mb-0.5"><span className="text-muted-foreground">Avanço</span><span className="font-bold">{p.avanco}%</span></div>
                      <div className="h-2 w-36 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${p.avanco === 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${p.avanco}%` }} /></div>
                    </div>
                    <button type="button" onClick={() => { setProjetoSel(p); setAba('detalhe'); }} className="erp-btn text-xs flex items-center gap-1"><Eye size={11} />Abrir Projeto</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETALHE ──────────────────────────────────────────────────────── */}
      {aba === 'detalhe' && proj && (
        <div className="space-y-3">
          {/* Header projeto */}
          <div className="erp-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><span className="font-mono font-bold text-primary">{proj.id}</span><span className={`erp-badge ${STATUS_PRJ[proj.status]?.cls}`}>{STATUS_PRJ[proj.status]?.label}</span></div>
              <p className="font-bold text-base">{proj.nome}</p>
              <p className="text-xs text-muted-foreground">{proj.cliente} · {proj.inicio} → {proj.fim_planejado}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowApontamento(true)} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Clock size={12} />Apontar Horas</button>
              <button type="button" onClick={() => setShowCusto(true)} className="erp-btn-ghost text-xs flex items-center gap-1.5"><DollarSign size={12} />Registrar Custo</button>
              <button type="button" onClick={() => { setAba('lista'); }} className="erp-btn-ghost text-xs">← Voltar</button>
            </div>
          </div>

          {/* KPIs projeto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Avanço', val: `${proj.avanco}%`, sub: 'do projeto concluído', cor: 'text-primary' },
              { label: 'Custo Realizado', val: R$(custoTotalReal), sub: `de ${R$(proj.custo_orcado)} orçado`, cor: varCusto > 10 ? 'text-red-600' : 'text-foreground' },
              { label: 'Horas Apontadas', val: `${totalHorasReal}h`, sub: `de ${totalHorasOrc}h planejadas`, cor: 'text-primary' },
              { label: 'Receita Realizada', val: R$(proj.receita_realizada), sub: `de ${R$(proj.receita)} total`, cor: 'text-green-700' },
            ].map((k) => (
              <div key={k.label} className="erp-card p-3"><p className="text-[10px] text-muted-foreground">{k.label}</p><p className={`text-sm font-bold ${k.cor}`}>{k.val}</p><p className="text-[10px] text-muted-foreground">{k.sub}</p></div>
            ))}
          </div>

          {/* Sub-abas */}
          <div className="border-b border-border flex gap-0 overflow-x-auto">
            {ABAS_DETALHE.map((a) => (
              <button key={a.id} type="button" onClick={() => setAbaDetalhe(a.id)}
                className={`px-4 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${abaDetalhe === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                {a.label}
              </button>
            ))}
          </div>

          {/* ── GANTT / EAP ──── */}
          {abaDetalhe === 'gantt' && (
            <div className="space-y-2">
              <div className="erp-card overflow-x-auto">
                <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center justify-between">
                  <span>EAP — Estrutura Analítica do Projeto + Gráfico de Gantt</span>
                  <button type="button" onClick={() => toast.info('Gantt exportado!')} className="erp-btn-ghost text-xs flex items-center gap-1"><Download size={11} />Exportar</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="w-full text-xs" style={{ minWidth: 900 }}>
                    <thead>
                      <tr className="bg-muted/10">
                        <th className="text-left px-3 py-2 w-52">Tarefa</th>
                        <th className="text-right px-3 py-2 w-16">Dur.</th>
                        <th className="text-right px-3 py-2 w-16">Hrs Orc.</th>
                        <th className="text-right px-3 py-2 w-16">Hrs Real</th>
                        <th className="text-left px-3 py-2 w-24">Responsável</th>
                        <th className="px-3 py-2 w-14">Avanço</th>
                        <th className="px-3 py-2" style={{ minWidth: 400 }}>
                          <div className="flex text-[9px] text-muted-foreground">
                            {Array.from({ length: 11 }, (_, i) => (
                              <div key={i} className="flex-1 text-center">{(i * 10) + 'd'}</div>
                            ))}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {proj.tarefas.map((t) => (
                        <tr key={t.id} className={`border-b border-border/20 ${t.nivel === 0 ? 'bg-primary/5 font-semibold' : ''}`}>
                          <td className={`px-3 py-1.5 ${t.nivel === 1 ? 'pl-7' : ''}`}>{t.nome}</td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground">{t.dur}d</td>
                          <td className="px-3 py-1.5 text-right">{t.horas_orc}h</td>
                          <td className={`px-3 py-1.5 text-right ${t.horas_real > t.horas_orc ? 'text-red-600 font-bold' : 'text-green-700'}`}>{t.horas_real > 0 ? `${t.horas_real}h` : '—'}</td>
                          <td className="px-3 py-1.5 text-muted-foreground text-[10px]">{t.responsavel}</td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${t.avanco === 100 ? 'bg-green-500' : t.avanco > 0 ? 'bg-primary' : 'bg-muted'}`} style={{ width: `${t.avanco}%` }} /></div>
                              <span className="text-[10px] w-7 text-right">{t.avanco}%</span>
                            </div>
                          </td>
                          <td className="px-1 py-1.5">
                            <div className="relative h-5" style={{ minWidth: 400 }}>
                              <div className="absolute top-1 h-3 rounded-sm"
                                style={{
                                  left: `${(t.inicio_d / TOTAL_DIAS) * 100}%`,
                                  width: `${(t.dur / TOTAL_DIAS) * 100}%`,
                                  backgroundColor: ganttColor(t.avanco),
                                  minWidth: 4,
                                }}
                                title={`${t.nome}: dia ${t.inicio_d} → ${t.inicio_d + t.dur}`}
                              />
                              {t.avanco > 0 && t.avanco < 100 && (
                                <div className="absolute top-1 h-3 rounded-sm bg-primary/50"
                                  style={{ left: `${(t.inicio_d / TOTAL_DIAS) * 100}%`, width: `${(t.dur * t.avanco / 100 / TOTAL_DIAS) * 100}%` }}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── APONTAMENTOS ──── */}
          {abaDetalhe === 'apontamentos' && (
            <div className="space-y-3">
              <div className="erp-card p-4" style={{ height: 200 }}>
                <p className="text-xs font-semibold mb-2">Horas Planejadas × Realizadas por Tarefa</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={proj.tarefas.filter((t) => t.horas_orc > 0).map((t) => ({ nome: t.nome.substring(0, 16), orc: t.horas_orc, real: t.horas_real || 0 }))} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="nome" tick={{ fontSize: 8 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}h`} />
                    <Tooltip formatter={(v) => `${v}h`} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="orc"  name="Planejado" fill="#d1d5db" radius={[2,2,0,0]} />
                    <Bar dataKey="real" name="Realizado" fill="#2563eb" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="erp-card overflow-x-auto">
                <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center justify-between">
                  <span>Registros de Apontamento</span>
                  <button type="button" onClick={() => setShowApontamento(true)} className="erp-btn text-xs flex items-center gap-1"><Plus size={11} />Novo Apontamento</button>
                </div>
                <table className="erp-table w-full">
                  <thead><tr><th>Data</th><th>Tarefa</th><th>Pessoa</th><th className="text-right">Horas</th><th>Observação</th></tr></thead>
                  <tbody>
                    {[
                      { data: '2026-04-30', tarefa: 'Fabricação Tanques (×2)', pessoa: 'Pedro Prod.', horas: 8, obs: 'Soldagem do casco concluída' },
                      { data: '2026-04-29', tarefa: 'Fabricação Reatores (×1)', pessoa: 'Carlos Eng.', horas: 6, obs: 'Montagem das bocas de visita' },
                      { data: '2026-04-28', tarefa: 'Aprovação do Cliente', pessoa: 'Ana Qualidade', horas: 3, obs: 'Reunião de revisão técnica' },
                    ].map((ap, i) => (
                      <tr key={i}><td>{ap.data}</td><td className="font-medium">{ap.tarefa}</td><td className="text-muted-foreground text-xs">{ap.pessoa}</td><td className="text-right font-bold">{ap.horas}h</td><td className="text-muted-foreground text-xs">{ap.obs}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CUSTOS ──── */}
          {abaDetalhe === 'custos' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Custo MO Realizado', val: R$(custoMO), pct_orc: pct(custoMO/proj.custo_orcado*100), cor: 'text-primary' },
                  { label: 'Custos Extras', val: R$(custosExtras), pct_orc: pct(custosExtras/proj.custo_orcado*100), cor: 'text-yellow-600' },
                  { label: 'Total Real vs. Orçado', val: R$(custoTotalReal), pct_orc: pct(varCusto), cor: varCusto > 10 ? 'text-red-600' : 'text-green-700' },
                ].map((k) => (
                  <div key={k.label} className="erp-card p-4 text-center">
                    <p className="text-[10px] text-muted-foreground">{k.label}</p>
                    <p className={`text-base font-bold ${k.cor}`}>{k.val}</p>
                    <p className="text-[10px] text-muted-foreground">{k.pct_orc} do orçado</p>
                  </div>
                ))}
              </div>
              <div className="erp-card overflow-x-auto">
                <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center justify-between">
                  <span>Custos Extraordinários</span>
                  <button type="button" onClick={() => setShowCusto(true)} className="erp-btn text-xs flex items-center gap-1"><Plus size={11} />Registrar Custo</button>
                </div>
                {proj.custos_extras.length === 0
                  ? <div className="p-6 text-center text-xs text-muted-foreground">Nenhum custo extra registrado.</div>
                  : <table className="erp-table w-full"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="text-right">Valor</th></tr></thead>
                    <tbody>{proj.custos_extras.map((c, i) => <tr key={i}><td>{c.data}</td><td className="font-medium">{c.descricao}</td><td><span className="erp-badge erp-badge-info">{c.categoria}</span></td><td className="text-right font-semibold">{R$(c.valor)}</td></tr>)}</tbody>
                  </table>}
              </div>
            </div>
          )}

          {/* ── PAINEL FINANCEIRO ──── */}
          {abaDetalhe === 'painel' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Receita Total',      val: R$(proj.receita), cor: 'text-green-700' },
                  { label: 'Receita Realizada',  val: R$(proj.receita_realizada), cor: 'text-green-600' },
                  { label: 'Custo Orçado',       val: R$(proj.custo_orcado), cor: 'text-primary' },
                  { label: 'Margem Orçada',      val: pct((proj.receita-proj.custo_orcado)/proj.receita*100), cor: 'text-yellow-600' },
                ].map((k) => (
                  <div key={k.label} className="erp-card p-3 text-center"><p className="text-[10px] text-muted-foreground">{k.label}</p><p className={`text-base font-bold ${k.cor}`}>{k.val}</p></div>
                ))}
              </div>
              <div className="erp-card p-4" style={{ height: 220 }}>
                <p className="text-xs font-semibold mb-2">Fluxo de Caixa do Projeto — Recebido × Pago</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={proj.fluxo_caixa}>
                    <defs>
                      <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gradPag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => R$(v)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area dataKey="recebido" name="Recebido" stroke="#10b981" fill="url(#gradRec)" strokeWidth={2} />
                    <Area dataKey="pago" name="Pago" stroke="#ef4444" fill="url(#gradPag)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="erp-card p-4 space-y-2">
                <p className="text-xs font-semibold">Transações Vinculadas ao Projeto</p>
                <div className="space-y-1.5 text-xs">
                  {[
                    { tipo: 'NF-e Saída',   ref: 'NF-e 000310', desc: 'Fatura 30% adiantamento',  valor: 186000, data: '2026-03-15', sinal: '+' },
                    { tipo: 'NF-e Entrada', ref: 'NF-e 004812', desc: 'Compra Chapa 316L',          valor: -41200, data: '2026-04-27', sinal: '-' },
                    { tipo: 'NF-e Saída',   ref: 'NF-e 000324', desc: 'Fatura 15% avanço',          valor: 94000,  data: '2026-04-28', sinal: '+' },
                    { tipo: 'Financeiro',   ref: 'PAG-0512',     desc: 'Pagamento fornecedor aço',   valor: -38500, data: '2026-04-10', sinal: '-' },
                  ].map((tr, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/10 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2"><span className="erp-badge erp-badge-info">{tr.tipo}</span><span className="font-mono text-[10px]">{tr.ref}</span><span className="text-muted-foreground">{tr.desc}</span></div>
                      <div className="flex items-center gap-3"><span className="text-muted-foreground">{tr.data}</span><span className={`font-bold font-mono ${tr.sinal === '+' ? 'text-green-600' : 'text-red-600'}`}>{tr.sinal}{R$(Math.abs(tr.valor))}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── COMUNICAÇÃO ──── */}
          {abaDetalhe === 'comunicacao' && (
            <div className="space-y-3">
              <div className="erp-card p-4 space-y-3">
                <p className="text-xs font-semibold flex items-center gap-2"><MessageSquare size={13} className="text-primary" />Comunicação da Equipe</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {proj.comunicacao.map((msg, i) => (
                    <div key={i} className={`flex gap-3 p-3 rounded-lg text-xs ${msg.tipo === 'financeiro' ? 'bg-green-50 border border-green-200' : 'bg-muted/20'}`}>
                      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">{msg.usuario.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
                      <div className="flex-1"><div className="flex items-center gap-2"><span className="font-semibold">{msg.usuario}</span><span className="text-muted-foreground">{msg.data}</span></div><p className="mt-0.5">{msg.mensagem}</p></div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1 border-t border-border">
                  <input className="erp-input flex-1 text-xs" placeholder="Registrar nota, interação ou atualização..." value={msgNova} onChange={(e) => setMsgNova(e.target.value)} />
                  <button type="button" className="erp-btn-ghost text-xs flex items-center gap-1"><Paperclip size={12} />Anexo</button>
                  <button type="button" onClick={() => { if (msgNova.trim()) { toast.success('Mensagem registrada!'); setMsgNova(''); } }} className="erp-btn text-xs">Enviar</button>
                </div>
              </div>
              <div className="erp-card p-4 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-2"><Users size={13} className="text-primary" />Equipe do Projeto</p>
                <div className="flex flex-wrap gap-2">
                  {proj.equipe.map((m) => (
                    <div key={m} className="flex items-center gap-2 bg-muted/20 border border-border rounded-full px-3 py-1.5 text-xs">
                      <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold">{m.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Projeto */}
      {showNovoProj && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><FolderKanban size={15} />Novo Projeto</p>
              <button type="button" onClick={() => setShowNovoProj(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="erp-label">Nome do Projeto</label><input className="erp-input w-full" placeholder="Ex.: Linha Pharma — Cliente ABC" /></div>
                <div><label className="erp-label">Cliente</label><input className="erp-input w-full" /></div>
                <div><label className="erp-label">Pedido de Venda</label><input className="erp-input w-full" placeholder="PV-2026-..." /></div>
                <div><label className="erp-label">Data de Início</label><input type="date" className="erp-input w-full" /></div>
                <div><label className="erp-label">Prazo de Entrega</label><input type="date" className="erp-input w-full" /></div>
                <div><label className="erp-label">Receita Contratada (R$)</label><input type="number" className="erp-input w-full" /></div>
                <div><label className="erp-label">Custo Orçado (R$)</label><input type="number" className="erp-input w-full" /></div>
                <div><label className="erp-label">Responsável</label><input className="erp-input w-full" /></div>
                <div><label className="erp-label">Template de EAP</label><select className="erp-input w-full"><option>Em branco</option><option>Projeto Padrão (Fabricação)</option></select></div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNovoProj(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Projeto criado!'); setShowNovoProj(false); }} className="erp-btn flex-1">Criar Projeto</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apontamento */}
      {showApontamento && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><Clock size={15} />Apontar Horas no Projeto</p>
              <button type="button" onClick={() => setShowApontamento(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Data</label><input type="date" className="erp-input w-full" defaultValue="2026-04-30" /></div>
                <div><label className="erp-label">Horas Trabalhadas</label><input type="number" step="0.5" className="erp-input w-full" defaultValue={8} /></div>
                <div><label className="erp-label">Tarefa</label><select className="erp-input w-full">{proj?.tarefas.map((t) => <option key={t.id}>{t.nome}</option>)}</select></div>
                <div><label className="erp-label">Pessoa</label><select className="erp-input w-full">{proj?.equipe.map((m) => <option key={m}>{m}</option>)}</select></div>
                <div className="col-span-2"><label className="erp-label">Observação</label><input className="erp-input w-full" placeholder="O que foi executado..." /></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowApontamento(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Horas apontadas!'); setShowApontamento(false); }} className="erp-btn flex-1">Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Custo */}
      {showCusto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><DollarSign size={15} />Registrar Custo no Projeto</p>
              <button type="button" onClick={() => setShowCusto(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Data</label><input type="date" className="erp-input w-full" defaultValue="2026-04-30" /></div>
                <div><label className="erp-label">Valor (R$)</label><input type="number" className="erp-input w-full" /></div>
                <div><label className="erp-label">Categoria</label><select className="erp-input w-full"><option>Logística</option><option>Qualidade</option><option>Material</option><option>Serviço</option><option>Outros</option></select></div>
                <div className="col-span-2"><label className="erp-label">Descrição</label><input className="erp-input w-full" placeholder="Descreva o custo..." /></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCusto(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Custo registrado!'); setShowCusto(false); }} className="erp-btn flex-1">Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
