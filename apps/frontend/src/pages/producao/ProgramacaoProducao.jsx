import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';
import { Calendar, AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, RefreshCw, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const hoje = new Date();
const fmtD = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const fmtDL = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
const addDias = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
const diffDias = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

const CORES_OP = ['#2563eb','#f59e0b','#10b981','#8b5cf6','#ef4444','#0ea5e9','#f97316'];
const COR_STATUS = { 'Em Andamento': 'bg-blue-100 text-blue-700', 'Programada': 'bg-purple-100 text-purple-700', 'Atrasada': 'bg-red-100 text-red-700', 'Concluída': 'bg-green-100 text-green-700' };

const BASE = hoje;

const MAQUINAS = ['CNC-01','CNC-02','DOBR-01','SOLD-01','SOLD-02','POLL-01','MONT-01','TORN-01'];
const HORIZONTE = 21;

// ─── GANTT helper ────────────────────────────────────────────────────────────
function GanttChart({ dias, onHoje, ops = [] }) {
  const [opHover, setOpHover] = useState(null);
  const diasArr = Array.from({ length: dias }, (_, i) => addDias(BASE, i));
  const colW = 44;
  const rowH = 44;
  const labelW = 96;

  // Build rows: one per machine
  const rows = MAQUINAS.map((maq) => {
    const ops = OPS.flatMap((op, oi) =>
      op.operacoes
        .filter((o) => o.maquina === maq)
        .map((o) => ({
          ...o,
          opId: op.id,
          produto: op.produto,
          cor: CORES_OP[oi % CORES_OP.length],
          prazoCliente: op.prazo_cliente,
          prioridade: op.prioridade,
        }))
    );
    return { maq, ops };
  });

  const totalW = labelW + colW * dias;

  return (
    <div className="overflow-auto rounded-lg border border-border bg-white">
      <div style={{ minWidth: totalW, position: 'relative' }}>
        {/* Header dias */}
        <div className="flex" style={{ height: 32, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ width: labelW, minWidth: labelW }} className="flex items-center px-2 bg-muted/30 border-r border-border text-[10px] font-semibold text-muted-foreground sticky left-0 z-10">Máquina</div>
          {diasArr.map((d, i) => {
            const isHoje = diffDias(BASE, d) === 0;
            const isSab = d.getDay() === 6;
            const isDom = d.getDay() === 0;
            return (
              <div key={i} style={{ width: colW, minWidth: colW }}
                className={`flex items-center justify-center text-[9px] font-medium border-r border-border/40 ${isHoje ? 'bg-primary text-white' : isSab || isDom ? 'bg-red-50 text-red-400' : 'text-muted-foreground'}`}>
                {fmtD(d)}
              </div>
            );
          })}
        </div>

        {/* Linhas por máquina */}
        {rows.map(({ maq, ops }, ri) => (
          <div key={maq} className="flex" style={{ height: rowH, borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ width: labelW, minWidth: labelW }} className="flex items-center px-2 bg-muted/10 border-r border-border text-xs font-mono font-bold text-primary sticky left-0 z-10 truncate">{maq}</div>
            <div style={{ position: 'relative', width: colW * dias, height: rowH }}>
              {/* Grid background */}
              {diasArr.map((d, i) => {
                const isSab = d.getDay() === 6;
                const isDom = d.getDay() === 0;
                const isHoje = i === 0;
                return (
                  <div key={i} style={{ position: 'absolute', left: i * colW, top: 0, width: colW, height: rowH }}
                    className={`border-r border-border/20 ${isHoje ? 'bg-primary/5' : isSab || isDom ? 'bg-red-50/30' : ''}`} />
                );
              })}
              {/* Barras de operações */}
              {ops.map((op, oi) => {
                const startDia = diffDias(BASE, op.inicio);
                const endDia = diffDias(BASE, op.fim);
                const w = Math.max(1, endDia - startDia) * colW - 2;
                const x = startDia * colW + 1;
                if (x + w < 0 || x > colW * dias) return null;
                const isAtrasada = op.fim > op.prazoCliente;
                const isHover = opHover === `${ri}-${oi}`;
                return (
                  <div key={oi}
                    style={{ position: 'absolute', left: x, top: 6, width: w, height: rowH - 14, backgroundColor: op.cor, borderRadius: 4, cursor: 'pointer', opacity: isHover ? 1 : 0.88, transition: 'all 0.1s', zIndex: isHover ? 10 : 1 }}
                    className={`flex items-center overflow-hidden ${isAtrasada ? 'ring-2 ring-red-500' : ''}`}
                    onMouseEnter={() => setOpHover(`${ri}-${oi}`)}
                    onMouseLeave={() => setOpHover(null)}
                    title={`${op.opId} — ${op.op_nome} (${op.produto})\n${fmtD(op.inicio)} → ${fmtD(op.fim)} · ${op.h}h`}>
                    <span className="text-white text-[9px] font-semibold px-1.5 truncate whitespace-nowrap">{op.opId} {op.op_nome}</span>
                    {isAtrasada && <span className="text-white ml-auto mr-1">⚠</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Linha "hoje" */}
        <div style={{ position: 'absolute', left: labelW + 0.5, top: 0, width: 2, height: '100%', background: '#2563eb', opacity: 0.5, pointerEvents: 'none', zIndex: 20 }} />
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-2 p-2 border-t border-border/40 bg-muted/10">
        {OPS.map((op, i) => (
          <div key={op.id} className="flex items-center gap-1 text-[10px]">
            <span className="w-3 h-3 rounded" style={{ background: CORES_OP[i % CORES_OP.length] }} />
            <span className="font-mono font-semibold">{op.id}</span>
            <span className="text-muted-foreground">{op.produto}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-[10px] text-red-600"><span className="w-3 h-2 rounded border-2 border-red-500" />Atraso</div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-0.5 h-3 bg-primary/50" />Hoje</div>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function ProgramacaoProducao() {
  const [aba, setAba] = useState('gantt');
  const [horizonte, setHorizonte] = useState(21);
  const [OPS, setOPS] = useState([]);

  const loadSchedule = useCallback(async () => {
    try {
      const res = await api.get('/api/production/schedule');
      const data = res.data?.data ?? res.data ?? [];
      setOPS(Array.isArray(data) ? data : (data.ordens ?? data.ops ?? []));
    } catch {
      setOPS([]);
    }
  }, []);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const pedidosAnalise = useMemo(() => OPS.map((op, i) => {
    const ultimaOp = op.operacoes[op.operacoes.length - 1];
    const previsaoEntrega = ultimaOp.fim;
    const atrasado = previsaoEntrega > op.prazo_cliente;
    const diasAtraso = atrasado ? diffDias(op.prazo_cliente, previsaoEntrega) : 0;
    const diasAdiantado = !atrasado ? diffDias(previsaoEntrega, op.prazo_cliente) : 0;
    return { ...op, previsaoEntrega, atrasado, diasAtraso, diasAdiantado, cor: CORES_OP[i % CORES_OP.length] };
  }), []);

  const gargalосData = useMemo(() => MAQUINAS.map((maq) => {
    const ops = OPS.flatMap((op) => op.operacoes.filter((o) => o.maquina === maq));
    const totalH = ops.reduce((s, o) => s + o.h, 0);
    const capH = horizonte * 8;
    const util = Math.round((totalH / capH) * 100);
    return { maquina: maq, total_h: totalH, cap_h: capH, utilizacao: util, gargalo: util > 85 };
  }), [horizonte]);

  const faturamentoData = useMemo(() => {
    const semanas = Array.from({ length: 4 }, (_, i) => ({
      semana: `Sem ${i + 1}`,
      previsto: OPS.filter((op) => {
        const ultima = op.operacoes[op.operacoes.length - 1].fim;
        const w = diffDias(BASE, ultima);
        return w >= i * 7 && w < (i + 1) * 7;
      }).reduce((s, op) => s + op.valor, 0),
    }));
    let acumulado = 0;
    return semanas.map((s) => { acumulado += s.previsto; return { ...s, acumulado }; });
  }, []);

  const totalFaturamento = OPS.reduce((s, op) => s + op.valor, 0);
  const opsAtrasadas = pedidosAnalise.filter((p) => p.atrasado).length;
  const utilizacaoMedia = Math.round(gargalосData.reduce((s, m) => s + m.utilizacao, 0) / gargalосData.length);

  const ABAS = [
    { id: 'gantt',      label: 'Gantt' },
    { id: 'maquinas',   label: 'Por Máquina' },
    { id: 'prazos',     label: 'Análise de Prazos' },
    { id: 'gargalos',   label: 'Gargalos' },
    { id: 'faturamento',label: 'Faturamento Previsto' },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Calendar size={20} className="text-primary" /> Programação da Produção</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Capacidade finita · Gantt · Prazo de entrega · Gargalos</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Horizonte:</span>
          {[14, 21, 28].map((h) => (
            <button key={h} type="button" onClick={() => setHorizonte(h)}
              className={`px-2.5 py-1 rounded text-xs ${horizonte === h ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{h}d</button>
          ))}
          <button type="button" onClick={() => toast.info('Reprogramando...')} className="erp-btn-ghost text-xs flex items-center gap-1.5 ml-2"><RefreshCw size={13} />Reprogramar</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'OPs programadas',    value: OPS.length,        color: 'text-primary' },
          { label: 'Pedidos em atraso',  value: opsAtrasadas,      color: opsAtrasadas ? 'text-red-600' : 'text-green-600' },
          { label: 'Utiliz. média',      value: `${utilizacaoMedia}%`, color: utilizacaoMedia > 85 ? 'text-red-600' : 'text-primary' },
          { label: 'Faturamento previsto', value: `R$ ${(totalFaturamento/1000).toFixed(0)}k`, color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {opsAtrasadas > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800">
          <AlertTriangle size={13} /> <strong>{opsAtrasadas} pedido(s)</strong> com previsão de atraso na entrega · verifique a aba "Análise de Prazos"
        </div>
      )}

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── GANTT ─────────────────────────────────────────────────────────── */}
      {aba === 'gantt' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={12} />
            <span>Gráfico de Gantt — horizonte de <strong>{horizonte} dias</strong> a partir de hoje ({fmtD(hoje)})</span>
            <span className="ml-auto text-[10px] bg-muted px-2 py-0.5 rounded">Azul = linha de hoje</span>
          </div>
          <GanttChart dias={horizonte} ops={OPS} />
        </div>
      )}

      {/* ── POR MÁQUINA ───────────────────────────────────────────────────── */}
      {aba === 'maquinas' && (
        <div className="space-y-3">
          {MAQUINAS.map((maq) => {
            const ops = OPS.flatMap((op, oi) =>
              op.operacoes.filter((o) => o.maquina === maq).map((o) => ({ ...o, opId: op.id, produto: op.produto, cor: CORES_OP[oi % CORES_OP.length], prioridade: op.prioridade }))
            ).sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
            if (!ops.length) return null;
            const totalH = ops.reduce((s, o) => s + o.h, 0);
            return (
              <div key={maq} className="erp-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{maq}</span>
                    <span className="text-xs text-muted-foreground">{ops.length} operação(ões) programada(s)</span>
                  </div>
                  <span className="text-xs font-semibold">{totalH}h programadas</span>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted/10"><th className="text-left px-3 py-2">#</th><th className="text-left px-3 py-2">OP</th><th className="text-left px-3 py-2">Produto</th><th className="text-left px-3 py-2">Operação</th><th className="px-3 py-2">Início</th><th className="px-3 py-2">Fim</th><th className="text-right px-3 py-2">Horas</th><th className="text-center px-3 py-2">Status</th><th className="text-center px-3 py-2">Prior.</th></tr></thead>
                  <tbody>
                    {ops.map((op, i) => {
                      const isAtrasada = op.status === 'Programada' && new Date(op.fim) > new Date();
                      return (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/10">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: op.cor }} /><span className="font-mono font-semibold text-primary">{op.opId}</span></div></td>
                          <td className="px-3 py-2 text-muted-foreground">{op.produto}</td>
                          <td className="px-3 py-2 font-medium">{op.op_nome}</td>
                          <td className="px-3 py-2 text-center">{fmtDL(op.inicio)}</td>
                          <td className="px-3 py-2 text-center">{fmtDL(op.fim)}</td>
                          <td className="px-3 py-2 text-right font-medium">{op.h}h</td>
                          <td className="px-3 py-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${COR_STATUS[op.status]}`}>{op.status}</span></td>
                          <td className="px-3 py-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] ${op.prioridade === 'Urgente' ? 'bg-red-100 text-red-700' : op.prioridade === 'Alta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{op.prioridade}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ANÁLISE DE PRAZOS ─────────────────────────────────────────────── */}
      {aba === 'prazos' && (
        <div className="space-y-3">
          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border"><p className="text-xs font-semibold">Prazo de Entrega — Programado vs. Comprometido com Cliente</p></div>
            <table className="erp-table w-full min-w-[700px]">
              <thead><tr><th>OP</th><th>Produto</th><th>Pedido</th><th>Prior.</th><th>Prazo Cliente</th><th>Previsão Entrega</th><th className="text-right">Diferença</th><th className="text-center">Status</th><th className="text-right">Valor</th></tr></thead>
              <tbody>
                {pedidosAnalise.map((op) => (
                  <tr key={op.id} className={op.atrasado ? 'bg-red-50/40' : ''}>
                    <td className="font-mono font-bold text-primary">{op.id}</td>
                    <td className="font-medium">{op.produto}</td>
                    <td className="font-mono text-muted-foreground">{op.pedido}</td>
                    <td><span className={`px-1.5 py-0.5 rounded text-[10px] ${op.prioridade === 'Urgente' ? 'bg-red-100 text-red-700' : op.prioridade === 'Alta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{op.prioridade}</span></td>
                    <td className="font-medium">{fmtD(op.prazo_cliente)}</td>
                    <td className={`font-medium ${op.atrasado ? 'text-red-600' : 'text-green-600'}`}>{fmtD(op.previsaoEntrega)}</td>
                    <td className="text-right">
                      {op.atrasado
                        ? <span className="text-red-600 font-bold flex items-center justify-end gap-1"><AlertTriangle size={11} />+{op.diasAtraso}d</span>
                        : <span className="text-green-600 font-medium flex items-center justify-end gap-1"><CheckCircle size={11} />-{op.diasAdiantado}d</span>}
                    </td>
                    <td className="text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${op.atrasado ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {op.atrasado ? 'Previsto Atraso' : 'No Prazo'}
                      </span>
                    </td>
                    <td className="text-right font-medium">R$ {op.valor.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Timeline visual */}
          <div className="erp-card p-4">
            <p className="text-xs font-semibold mb-3">Timeline de Entregas — Próximos {horizonte} dias</p>
            <div className="relative h-8 mb-2">
              <div className="absolute inset-0 bg-muted/20 rounded" />
              {pedidosAnalise.map((op, i) => {
                const dx = diffDias(BASE, op.prazo_cliente);
                const ex = diffDias(BASE, op.previsaoEntrega);
                const pct = Math.min(100, Math.max(0, (dx / horizonte) * 100));
                const epct = Math.min(100, Math.max(0, (ex / horizonte) * 100));
                return (
                  <div key={op.id}>
                    <div title={`Prazo cliente: ${fmtD(op.prazo_cliente)}`} style={{ left: `${pct}%`, top: 4 }}
                      className="absolute w-0.5 h-5 bg-gray-400 -ml-px" />
                    <div title={`Previsão entrega: ${fmtD(op.previsaoEntrega)}`} style={{ left: `${epct}%`, top: 0 }}
                      className={`absolute w-3 h-3 rounded-full -ml-1.5 ${op.atrasado ? 'bg-red-500' : 'bg-green-500'}`} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground"><span>Hoje</span><span>{fmtD(addDias(BASE, horizonte))}</span></div>
            <div className="flex gap-3 mt-1 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" />No prazo</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" />Previsto atraso</span>
              <span className="flex items-center gap-1"><span className="w-px h-4 bg-gray-400" />Prazo cliente</span>
            </div>
          </div>
        </div>
      )}

      {/* ── GARGALOS ──────────────────────────────────────────────────────── */}
      {aba === 'gargalos' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="erp-card p-4" style={{ height: 280 }}>
              <p className="text-xs font-semibold mb-2">Utilização de Máquinas — {horizonte} dias</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gargalосData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 140]} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="maquina" tick={{ fontSize: 9 }} width={60} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <ReferenceLine x={85} stroke="#ef4444" strokeDasharray="4 3" label={{ value: 'Gargalo 85%', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
                  <Bar dataKey="utilizacao" name="Utilização" radius={[0,3,3,0]}
                    fill="#2563eb"
                    label={{ position: 'right', fontSize: 9, formatter: (v) => `${v}%` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="erp-card p-4">
              <p className="text-xs font-semibold mb-3">Detalhes por Centro de Trabalho</p>
              <div className="space-y-2">
                {gargalосData.sort((a, b) => b.utilizacao - a.utilizacao).map((m) => (
                  <div key={m.maquina}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className={`font-mono font-bold ${m.gargalo ? 'text-red-600' : 'text-primary'}`}>{m.maquina}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{m.total_h}h / {m.cap_h}h</span>
                        <span className={`font-bold ${m.gargalo ? 'text-red-600' : m.utilizacao > 65 ? 'text-primary' : 'text-muted-foreground'}`}>{m.utilizacao}%</span>
                        {m.gargalo && <AlertTriangle size={10} className="text-red-500" />}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${m.gargalo ? 'bg-red-500' : m.utilizacao > 65 ? 'bg-primary' : 'bg-green-500'}`} style={{ width: `${Math.min(100, m.utilizacao)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-border/40 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Máquinas ociosas (utilização {'<'} 50%):</p>
                {gargalосData.filter((m) => m.utilizacao < 50).map((m) => (
                  <p key={m.maquina} className="text-green-600">• <strong>{m.maquina}</strong> — {m.utilizacao}% — oportunidade de redução de custo</p>
                ))}
                {gargalосData.filter((m) => m.utilizacao >= 50).length === gargalосData.length && <p>Nenhuma máquina ociosa no período.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FATURAMENTO PREVISTO ──────────────────────────────────────────── */}
      {aba === 'faturamento' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Faturamento previsto total', value: `R$ ${totalFaturamento.toLocaleString('pt-BR')}`, color: 'text-green-600' },
              { label: 'OPs no prazo',  value: `${OPS.length - opsAtrasadas}/${OPS.length}`, color: 'text-primary' },
              { label: 'Risco de atraso', value: `R$ ${pedidosAnalise.filter((p) => p.atrasado).reduce((s, p) => s + p.valor, 0).toLocaleString('pt-BR')}`, color: 'text-red-600' },
            ].map((k) => (
              <div key={k.label} className="erp-card p-3"><p className="text-[10px] text-muted-foreground">{k.label}</p><p className={`text-lg font-bold ${k.color}`}>{k.value}</p></div>
            ))}
          </div>

          <div className="erp-card p-4" style={{ height: 260 }}>
            <p className="text-xs font-semibold mb-2">Previsão de Faturamento por Semana + Acumulado</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faturamentoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="left" dataKey="previsto" name="Faturamento Previsto" fill="#22c55e" radius={[3,3,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="acumulado" name="Acumulado" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full min-w-[600px]">
              <thead><tr><th>OP</th><th>Produto</th><th>Pedido</th><th>Entrega Prevista</th><th>Status Prazo</th><th className="text-right">Valor</th></tr></thead>
              <tbody>
                {pedidosAnalise.sort((a, b) => new Date(a.previsaoEntrega) - new Date(b.previsaoEntrega)).map((op) => (
                  <tr key={op.id}>
                    <td className="font-mono font-bold text-primary">{op.id}</td>
                    <td>{op.produto}</td>
                    <td className="font-mono text-muted-foreground">{op.pedido}</td>
                    <td className={op.atrasado ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>{fmtD(op.previsaoEntrega)}</td>
                    <td><span className={`px-1.5 py-0.5 rounded text-[10px] ${op.atrasado ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{op.atrasado ? `Atraso +${op.diasAtraso}d` : `Adiantado -${op.diasAdiantado}d`}</span></td>
                    <td className="text-right font-bold text-green-600">R$ {op.valor.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
                <tr className="bg-muted/20 font-bold border-t-2 border-border">
                  <td colSpan={5} className="px-4 py-2 text-right text-xs">Total</td>
                  <td className="px-4 py-2 text-right text-green-600">R$ {totalFaturamento.toLocaleString('pt-BR')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
