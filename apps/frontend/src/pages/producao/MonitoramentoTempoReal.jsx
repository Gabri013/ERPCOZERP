import { useState, useEffect, useCallback } from 'react';
import { Activity, Cpu, User, AlertTriangle, CheckCircle, Clock, Pause, Wrench, Search, RefreshCw, Eye, QrCode, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

const AGORA = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const STATUS_MAQUINA = {
  'Produzindo':    { cor: 'border-green-400 bg-green-50',  dot: 'bg-green-500',  icone: Activity,  label: 'Produzindo' },
  'Setup':         { cor: 'border-yellow-400 bg-yellow-50',dot: 'bg-yellow-500', icone: Clock,     label: 'Setup' },
  'Parada':        { cor: 'border-red-400 bg-red-50',      dot: 'bg-red-500',    icone: Pause,     label: 'Parada' },
  'Manutenção':    { cor: 'border-orange-400 bg-orange-50',dot: 'bg-orange-500', icone: Wrench,    label: 'Manutenção' },
  'Disponível':    { cor: 'border-gray-300 bg-gray-50',    dot: 'bg-gray-400',   icone: CheckCircle,label: 'Disponível' },
};

const SETORES = ['Todos', 'Corte', 'Dobra', 'Soldagem', 'Acabamento', 'Montagem'];

const MOCK_MAQUINAS = [
  { id: 1, codigo: 'CNC-01', nome: 'Plasma CNC 3m',    setor: 'Corte',      status: 'Produzindo', op: 'OP-2025-001', produto: 'Chapa Tanque 500L', operador: 'Carlos S.', inicio: '08:12', oee: 82, pct_op: 65, motivo_parada: null, anexos: 3 },
  { id: 2, codigo: 'DOBR-01',nome: 'Dobradeira CNC',   setor: 'Dobra',      status: 'Setup',      op: 'OP-2025-002', produto: 'Flange Reator',     operador: 'Ana M.',    inicio: '09:45', oee: 71, pct_op: 0,  motivo_parada: null, anexos: 1 },
  { id: 3, codigo: 'SOLD-01',nome: 'Solda MIG 01',     setor: 'Soldagem',   status: 'Produzindo', op: 'OP-2025-001', produto: 'Corpo Tanque',      operador: 'Pedro R.',  inicio: '07:30', oee: 91, pct_op: 80, motivo_parada: null, anexos: 2 },
  { id: 4, codigo: 'SOLD-02',nome: 'Solda TIG 01',     setor: 'Soldagem',   status: 'Parada',     op: null,          produto: null,                operador: null,        inicio: null,    oee: 45, pct_op: 0,  motivo_parada: 'Espera por matéria prima', anexos: 0 },
  { id: 5, codigo: 'POLL-01',nome: 'Politriz Angular', setor: 'Acabamento', status: 'Produzindo', op: 'OP-2025-003', produto: 'Reator 200L',       operador: 'Maria L.',  inicio: '08:00', oee: 78, pct_op: 55, motivo_parada: null, anexos: 4 },
  { id: 6, codigo: 'MONT-01',nome: 'Bancada Montagem', setor: 'Montagem',   status: 'Manutenção', op: null,          produto: null,                operador: 'Técnico J.',inicio: '10:00', oee: 0,  pct_op: 0,  motivo_parada: 'Manutenção preventiva', anexos: 0 },
  { id: 7, codigo: 'TORN-01',nome: 'Torno CNC',        setor: 'Corte',      status: 'Disponível', op: null,          produto: null,                operador: null,        inicio: null,    oee: 65, pct_op: 0,  motivo_parada: null, anexos: 0 },
  { id: 8, codigo: 'CNC-02', nome: 'Plasma CNC 2m',    setor: 'Corte',      status: 'Produzindo', op: 'OP-2025-004', produto: 'Condensador 50m²',  operador: 'Rafa C.',   inicio: '08:45', oee: 87, pct_op: 40, motivo_parada: null, anexos: 1 },
];

const MOCK_OPERADORES = [
  { id: 1, nome: 'Carlos S.', foto: 'CS', setor: 'Corte',     status: 'Trabalhando', op: 'OP-2025-001', operacao: 'Corte Plasma',   inicio: '08:12', eficiencia: 94 },
  { id: 2, nome: 'Ana M.',    foto: 'AM', setor: 'Dobra',     status: 'Setup',       op: 'OP-2025-002', operacao: 'Setup Dobra',    inicio: '09:45', eficiencia: 87 },
  { id: 3, nome: 'Pedro R.',  foto: 'PR', setor: 'Soldagem',  status: 'Trabalhando', op: 'OP-2025-001', operacao: 'Soldagem MIG',   inicio: '07:30', eficiencia: 98 },
  { id: 4, nome: 'Maria L.',  foto: 'ML', setor: 'Acabamento',status: 'Trabalhando', op: 'OP-2025-003', operacao: 'Polimento',      inicio: '08:00', eficiencia: 82 },
  { id: 5, nome: 'Rafa C.',   foto: 'RC', setor: 'Corte',     status: 'Trabalhando', op: 'OP-2025-004', operacao: 'Corte Plasma',   inicio: '08:45', eficiencia: 90 },
  { id: 6, nome: 'João T.',   foto: 'JT', setor: 'Manutenção',status: 'Manutenção',  op: null,          operacao: 'Prev. Bancada',  inicio: '10:00', eficiencia: null },
  { id: 7, nome: 'Luiz P.',   foto: 'LP', setor: 'Soldagem',  status: 'Intervalo',   op: null,          operacao: null,             inicio: '10:15', eficiencia: null },
];

const MOCK_OPS_FLOOR = [
  { id: 'OP-2025-001', produto: 'Tanque Inox 316L 500L',    qtd: 2, operacao_atual: 'Corte Chapa',   setor: 'Corte',      pct: 65, status: 'Em Andamento', pedido: 'PV-2025-020', prazo: '2026-05-10', urgente: false },
  { id: 'OP-2025-002', produto: 'Reator Inox 316L 200L',    qtd: 1, operacao_atual: 'Dobra Flanges', setor: 'Dobra',      pct: 30, status: 'Em Andamento', pedido: 'PV-2025-021', prazo: '2026-05-08', urgente: true  },
  { id: 'OP-2025-003', produto: 'Condensador Tubular 50m²', qtd: 1, operacao_atual: 'Acabamento',    setor: 'Acabamento', pct: 80, status: 'Em Andamento', pedido: 'PV-2025-019', prazo: '2026-05-12', urgente: false },
  { id: 'OP-2025-004', produto: 'Condensador Tubular 50m²', qtd: 2, operacao_atual: 'Corte Tubos',   setor: 'Corte',      pct: 40, status: 'Em Andamento', pedido: 'PV-2025-022', prazo: '2026-05-15', urgente: false },
];

const INSPECOES_PENDENTES = [
  { id: 1, op: 'OP-2025-001', produto: 'Tanque Inox 316L 500L', tipo: 'Inspeção Dimensional', setor: 'Soldagem', responsavel: 'Inspetor A.' },
  { id: 2, op: 'OP-2025-003', produto: 'Condensador 50m²', tipo: 'Inspeção Final',            setor: 'Acabamento', responsavel: 'Inspetor B.' },
];

export default function MonitoramentoTempoReal() {
  const [aba, setAba] = useState('maquinas');
  const [setor, setSetor] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [hora, setHora] = useState(AGORA());
  const [maquinaSel, setMaquinaSel] = useState(null);
  const [pulsando, setPulsando] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setHora(AGORA());
      setPulsando((p) => !p);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const maquinasFiltradas = MOCK_MAQUINAS.filter((m) => {
    const okSetor = setor === 'Todos' || m.setor === setor;
    const okBusca = !busca || m.codigo.toLowerCase().includes(busca.toLowerCase()) || m.nome.toLowerCase().includes(busca.toLowerCase()) || m.op?.toLowerCase().includes(busca.toLowerCase()) || m.operador?.toLowerCase().includes(busca.toLowerCase());
    return okSetor && okBusca;
  });

  const kpis = {
    produzindo: MOCK_MAQUINAS.filter((m) => m.status === 'Produzindo').length,
    paradas: MOCK_MAQUINAS.filter((m) => m.status === 'Parada').length,
    manut: MOCK_MAQUINAS.filter((m) => m.status === 'Manutenção').length,
    disponiveis: MOCK_MAQUINAS.filter((m) => m.status === 'Disponível').length,
    setup: MOCK_MAQUINAS.filter((m) => m.status === 'Setup').length,
    oee_medio: Math.round(MOCK_MAQUINAS.filter((m) => m.oee > 0).reduce((s, m) => s + m.oee, 0) / MOCK_MAQUINAS.filter((m) => m.oee > 0).length),
    operadores_ativos: MOCK_OPERADORES.filter((o) => o.status === 'Trabalhando').length,
    ops_ativas: MOCK_OPS_FLOOR.length,
  };

  const ABAS = [
    { id: 'maquinas',   label: 'Máquinas',   qtd: MOCK_MAQUINAS.length },
    { id: 'operadores', label: 'Operadores', qtd: MOCK_OPERADORES.length },
    { id: 'ordens',     label: 'Ordens em Andamento', qtd: MOCK_OPS_FLOOR.length },
    { id: 'inspecoes',  label: 'Inspeções Pendentes', qtd: INSPECOES_PENDENTES.length },
  ];

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Activity size={20} className="text-green-500" /> Monitoramento em Tempo Real</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Chão de fábrica — visão ao vivo de máquinas, operadores e ordens</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full bg-green-500 ${pulsando ? 'opacity-100' : 'opacity-50'} transition-opacity`} />
            <span className="text-xs font-mono text-green-700 font-semibold">{hora}</span>
          </div>
          <button type="button" onClick={() => toast.info('Dados atualizados')} className="erp-btn-ghost text-xs flex items-center gap-1.5"><RefreshCw size={13} /> Atualizar</button>
        </div>
      </div>

      {/* KPIs dashboard */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {[
          { label: 'Produzindo',   value: kpis.produzindo,       color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
          { label: 'Setup',        value: kpis.setup,            color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
          { label: 'Paradas',      value: kpis.paradas,          color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
          { label: 'Manutenção',   value: kpis.manut,            color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: 'Disponível',   value: kpis.disponiveis,      color: 'text-gray-500',   bg: 'bg-gray-50',   border: 'border-gray-200' },
          { label: 'OEE Médio',    value: `${kpis.oee_medio}%`,  color: 'text-primary',    bg: 'bg-primary/5', border: 'border-primary/20' },
          { label: 'Operadores',   value: `${kpis.operadores_ativos}/${MOCK_OPERADORES.length}`, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
          { label: 'OPs Ativas',   value: kpis.ops_ativas,       color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
        ].map((k) => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-lg px-2 py-2 text-center`}>
            <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[9px] text-muted-foreground leading-tight">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar máquina, OP, operador..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {SETORES.map((s) => (
            <button key={s} type="button" onClick={() => setSetor(s)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${setor === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0">
        {ABAS.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${aba === a.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{a.qtd}</span>
          </button>
        ))}
      </div>

      {/* ── MÁQUINAS ────────────────────────────────────────────────────────── */}
      {aba === 'maquinas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {maquinasFiltradas.map((maq) => {
            const st = STATUS_MAQUINA[maq.status] || STATUS_MAQUINA['Disponível'];
            const Icone = st.icone;
            return (
              <div key={maq.id} className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${st.cor} ${maquinaSel?.id === maq.id ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                onClick={() => setMaquinaSel(maq.id === maquinaSel?.id ? null : maq)}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${st.dot} ${maq.status === 'Produzindo' ? 'animate-pulse' : ''}`} />
                    <span className="font-mono font-bold text-sm">{maq.codigo}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {maq.anexos > 0 && <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground"><Paperclip size={9} />{maq.anexos}</span>}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium`} style={{ background: 'rgba(255,255,255,0.7)' }}>{maq.status}</span>
                  </div>
                </div>
                <p className="text-xs font-medium mb-2">{maq.nome}</p>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  {maq.op && <p>OP: <strong className="text-foreground">{maq.op}</strong></p>}
                  {maq.produto && <p className="truncate">Prod: {maq.produto}</p>}
                  {maq.operador && <p>Oper: <strong className="text-foreground">{maq.operador}</strong></p>}
                  {maq.inicio && <p>Início: {maq.inicio}</p>}
                  {maq.motivo_parada && <p className="text-red-600 font-medium">{maq.motivo_parada}</p>}
                </div>
                {/* OEE / progresso */}
                {maq.oee > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[9px] mb-0.5"><span>OEE</span><span className="font-bold">{maq.oee}%</span></div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${maq.oee >= 85 ? 'bg-green-500' : maq.oee >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${maq.oee}%` }} />
                    </div>
                  </div>
                )}
                {maq.pct_op > 0 && (
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[9px] mb-0.5"><span>Progresso OP</span><span className="font-bold">{maq.pct_op}%</span></div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${maq.pct_op}%` }} />
                    </div>
                  </div>
                )}
                {/* Botões rápidos */}
                {maquinaSel?.id === maq.id && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    <button type="button" onClick={(e) => { e.stopPropagation(); toast.info(`Apontamento: ${maq.codigo}`); }} className="text-[10px] bg-primary text-white px-2 py-0.5 rounded hover:opacity-80">Apontar</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toast.info(`Parada registrada: ${maq.codigo}`); }} className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded hover:opacity-80">Registrar Parada</button>
                    {maq.anexos > 0 && <button type="button" onClick={(e) => { e.stopPropagation(); toast.info(`${maq.anexos} anexo(s) da OP`); }} className="text-[10px] bg-gray-500 text-white px-2 py-0.5 rounded hover:opacity-80 flex items-center gap-0.5"><Paperclip size={9} />Anexos</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── OPERADORES ──────────────────────────────────────────────────────── */}
      {aba === 'operadores' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MOCK_OPERADORES.map((op) => {
            const statusCor = op.status === 'Trabalhando' ? 'bg-green-500' : op.status === 'Setup' ? 'bg-yellow-500' : op.status === 'Intervalo' ? 'bg-blue-400' : 'bg-orange-500';
            const statusBg = op.status === 'Trabalhando' ? 'border-green-300 bg-green-50' : op.status === 'Setup' ? 'border-yellow-300 bg-yellow-50' : op.status === 'Intervalo' ? 'border-blue-300 bg-blue-50' : 'border-orange-300 bg-orange-50';
            return (
              <div key={op.id} className={`border-2 rounded-lg p-3 ${statusBg}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{op.foto}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{op.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{op.setor}</p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusCor} ${op.status === 'Trabalhando' ? 'animate-pulse' : ''}`} />
                </div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <p>Status: <strong className="text-foreground">{op.status}</strong></p>
                  {op.op && <p>OP: <strong className="text-foreground">{op.op}</strong></p>}
                  {op.operacao && <p>Operação: {op.operacao}</p>}
                  {op.inicio && <p>Desde: {op.inicio}</p>}
                </div>
                {op.eficiencia != null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[9px] mb-0.5"><span>Eficiência</span><span className="font-bold">{op.eficiencia}%</span></div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${op.eficiencia >= 90 ? 'bg-green-500' : op.eficiencia >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${op.eficiencia}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ORDENS ──────────────────────────────────────────────────────────── */}
      {aba === 'ordens' && (
        <div className="space-y-2">
          {MOCK_OPS_FLOOR.map((op) => (
            <div key={op.id} className={`erp-card p-4 ${op.urgente ? 'border-red-300' : ''}`}>
              <div className="flex items-start gap-3 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-primary">{op.id}</span>
                    {op.urgente && <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded"><AlertTriangle size={9} />URGENTE</span>}
                    <span className="text-sm font-medium">{op.produto}</span>
                    <span className="text-xs text-muted-foreground">— {op.qtd} pc</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Operação atual: <strong className="text-foreground">{op.operacao_atual}</strong></span>
                    <span>Setor: <strong className="text-foreground">{op.setor}</strong></span>
                    <span>Pedido: <strong className="text-primary">{op.pedido}</strong></span>
                    <span>Prazo: <strong className={op.urgente ? 'text-red-600' : 'text-foreground'}>{new Date(op.prazo).toLocaleDateString('pt-BR')}</strong></span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-primary">{op.pct}%</div>
                  <div className="text-[10px] text-muted-foreground">concluído</div>
                </div>
              </div>
              <div className="mt-2.5">
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${op.pct >= 80 ? 'bg-green-500' : op.pct >= 40 ? 'bg-blue-500' : 'bg-orange-400'}`} style={{ width: `${op.pct}%` }} />
                </div>
              </div>
              {/* Etapas do roteiro visual */}
              <div className="mt-2 flex gap-1 flex-wrap">
                {['Corte', 'Dobra', 'Soldagem', 'Acabamento', 'Montagem', 'Inspeção', 'Expedição'].map((etapa) => {
                  const idx = ['Corte','Dobra','Soldagem','Acabamento','Montagem','Inspeção','Expedição'].indexOf(op.setor);
                  const etapaIdx = ['Corte','Dobra','Soldagem','Acabamento','Montagem','Inspeção','Expedição'].indexOf(etapa);
                  const done = etapaIdx < idx;
                  const current = etapaIdx === idx;
                  return (
                    <div key={etapa} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${done ? 'bg-green-100 text-green-700' : current ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-400' : 'bg-gray-100 text-gray-400'}`}>
                      {done ? <CheckCircle size={8} /> : current ? <Activity size={8} className="animate-pulse" /> : <Clock size={8} />}
                      {etapa}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── INSPEÇÕES ───────────────────────────────────────────────────────── */}
      {aba === 'inspecoes' && (
        <div className="space-y-2">
          {INSPECOES_PENDENTES.map((insp) => (
            <div key={insp.id} className="erp-card p-4 border-yellow-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><span className="font-mono font-bold text-primary">{insp.op}</span><span className="font-medium">{insp.produto}</span></div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Tipo: <strong className="text-foreground">{insp.tipo}</strong></span>
                    <span>Setor: <strong className="text-foreground">{insp.setor}</strong></span>
                    <span>Responsável: <strong className="text-foreground">{insp.responsavel}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => toast.info(`Registrando inspeção: ${insp.op}`)} className="erp-btn-primary text-xs flex items-center gap-1"><CheckCircle size={11} />Registrar</button>
                  <button type="button" className="erp-btn-ghost text-xs flex items-center gap-1"><Paperclip size={11} />Anexos</button>
                </div>
              </div>
            </div>
          ))}
          {!INSPECOES_PENDENTES.length && <div className="erp-card p-8 text-center text-muted-foreground">Nenhuma inspeção pendente</div>}
        </div>
      )}
    </div>
  );
}
