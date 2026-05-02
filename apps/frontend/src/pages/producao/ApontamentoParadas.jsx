import { useState, useMemo, useCallback, useEffect } from 'react';
import { Pause, Plus, CheckCircle, XCircle, Clock, Wrench, AlertTriangle, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtDT = (v) => v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMin = (v) => v >= 60 ? `${Math.floor(v/60)}h${String(v%60).padStart(2,'0')}` : `${v}min`;
const hoje = new Date().toISOString().split('T')[0];
const addH = (h) => new Date(Date.now() - h * 3600000).toISOString();

const MOTIVOS = [
  'Manutenção Corretiva', 'Manutenção Preventiva', 'Espera por Matéria Prima',
  'Espera por Documentação', 'Falta de Operador', 'Setup / Troca de Ferramenta',
  'Falta de Energia', 'Falha de Qualidade', 'Intervalo', 'Outro',
];

const TIPO_COR = {
  'Manutenção Corretiva':     { bg: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  'Manutenção Preventiva':    { bg: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  'Espera por Matéria Prima': { bg: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  'Espera por Documentação':  { bg: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  'Setup / Troca de Ferramenta':{ bg: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  'Falta de Operador':        { bg: 'bg-pink-100 text-pink-700',   dot: 'bg-pink-500' },
};

const MAQUINAS = ['CNC-01','CNC-02','SOLD-01','SOLD-02','DOBR-01','POLL-01','MONT-01','TORN-01'];

const PIE_COLORS = ['#ef4444','#f97316','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#6b7280'];

export default function ApontamentoParadas() {
  const [paradas, setParadas] = useState([]);

  const loadParadas = useCallback(async () => {
    try {
      const res = await api.get('/api/production/downtime');
      setParadas(res.data?.data ?? res.data ?? []);
    } catch {
      setParadas([]);
    }
  }, []);

  useEffect(() => { loadParadas(); }, [loadParadas]);
  const [busca, setBusca] = useState('');
  const [filtroMaq, setFiltroMaq] = useState('Todas');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ maquina: 'CNC-01', motivo: MOTIVOS[0], op: '', operador: '', obs: '' });

  const paradasFiltradas = useMemo(() => {
    let d = paradas;
    if (filtroMaq !== 'Todas') d = d.filter((p) => p.maquina === filtroMaq);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((p) => p.maquina.toLowerCase().includes(q) || p.motivo.toLowerCase().includes(q) || p.operador?.toLowerCase().includes(q)); }
    return d;
  }, [paradas, busca, filtroMaq]);

  const encerrarParada = (id) => {
    const agora = new Date().toISOString();
    setParadas(paradas.map((p) => {
      if (p.id !== id) return p;
      const dur = Math.round((new Date(agora) - new Date(p.inicio)) / 60000);
      return { ...p, fim: agora, duracao: dur };
    }));
    toast.success('Parada encerrada!');
  };

  const registrarParada = () => {
    const nova = { id: paradas.length + 1, ...form, inicio: new Date().toISOString(), fim: null, duracao: null };
    setParadas([nova, ...paradas]);
    setShowForm(false);
    setForm({ maquina: 'CNC-01', motivo: MOTIVOS[0], op: '', operador: '', obs: '' });
    toast.success('Parada registrada!');
  };

  // Agregação por motivo para charts
  const porMotivo = useMemo(() => {
    const map = {};
    paradas.forEach((p) => {
      const dur = p.duracao || Math.round((Date.now() - new Date(p.inicio)) / 60000);
      map[p.motivo] = (map[p.motivo] || 0) + dur;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [paradas]);

  const porMaquina = useMemo(() => {
    const map = {};
    paradas.forEach((p) => {
      const dur = p.duracao || Math.round((Date.now() - new Date(p.inicio)) / 60000);
      map[p.maquina] = (map[p.maquina] || 0) + dur;
    });
    return Object.entries(map).map(([maquina, minutos]) => ({ maquina, minutos })).sort((a, b) => b.minutos - a.minutos);
  }, [paradas]);

  const totalMin = useMemo(() => paradas.reduce((s, p) => s + (p.duracao || Math.round((Date.now() - new Date(p.inicio)) / 60000)), 0), [paradas]);
  const emAberto = paradas.filter((p) => !p.fim).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Pause size={20} className="text-red-500" /> Apontamento de Paradas e Esperas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registre e analise os motivos de parada de máquinas e operadores</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="erp-btn-primary flex items-center gap-2"><Plus size={14} /> Registrar Parada</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Em aberto agora', value: emAberto, color: 'text-red-600' },
          { label: 'Paradas hoje',    value: paradas.length, color: 'text-orange-600' },
          { label: 'Total de horas',  value: fmtMin(totalMin), color: 'text-primary' },
          { label: 'Maior ocorrência', value: porMotivo[0]?.name.split(' ').slice(0,2).join(' ') || '—', color: 'text-yellow-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-lg font-bold ${k.color} truncate`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="erp-card p-4" style={{ height: 220 }}>
          <p className="text-xs font-semibold mb-2">Paradas por Motivo (minutos)</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porMotivo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={130} />
              <Tooltip formatter={(v) => fmtMin(v)} />
              <Bar dataKey="value" name="Duração (min)" fill="#ef4444" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="erp-card p-4" style={{ height: 220 }}>
          <p className="text-xs font-semibold mb-2">Paradas por Máquina</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={porMaquina} dataKey="minutos" nameKey="maquina" cx="50%" cy="50%" outerRadius={70} label={({ maquina, percent }) => `${maquina} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {porMaquina.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtMin(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros */}
      <div className="erp-card p-2 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar máquina, motivo..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select className="erp-input text-xs" value={filtroMaq} onChange={(e) => setFiltroMaq(e.target.value)}>
          <option value="Todas">Todas as máquinas</option>
          {MAQUINAS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {paradasFiltradas.map((p) => {
          const aberto = !p.fim;
          const dur = p.duracao || Math.round((Date.now() - new Date(p.inicio)) / 60000);
          const tipoCor = TIPO_COR[p.motivo] || { bg: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
          return (
            <div key={p.id} className={`erp-card p-3 flex items-start gap-3 justify-between ${aberto ? 'border-red-200' : ''}`}>
              <div className="flex items-start gap-3 flex-1">
                <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${tipoCor.dot} ${aberto ? 'animate-pulse' : ''}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm">{p.maquina}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tipoCor.bg}`}>{p.motivo}</span>
                    {aberto && <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded animate-pulse"><AlertTriangle size={9} />Em aberto</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span>Início: {fmtDT(p.inicio)}</span>
                    {p.fim && <span>Fim: {fmtDT(p.fim)}</span>}
                    <span className={`font-medium ${aberto ? 'text-red-600' : 'text-foreground'}`}>Duração: {fmtMin(dur)}</span>
                    {p.op && <span>OP: <strong className="text-primary">{p.op}</strong></span>}
                    {p.operador && <span>Oper: {p.operador}</span>}
                    {p.obs && <span className="text-muted-foreground">· {p.obs}</span>}
                  </div>
                </div>
              </div>
              {aberto && (
                <button type="button" onClick={() => encerrarParada(p.id)} className="erp-btn-primary text-xs flex items-center gap-1 shrink-0"><CheckCircle size={11} /> Encerrar</button>
              )}
            </div>
          );
        })}
        {!paradasFiltradas.length && <div className="erp-card p-8 text-center text-muted-foreground">Nenhuma parada registrada</div>}
      </div>

      {/* Modal nova parada */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2"><Pause size={14} className="text-red-500" />Registrar Parada</h2>
              <button type="button" onClick={() => setShowForm(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Máquina *</label>
                  <select className="erp-input w-full" value={form.maquina} onChange={(e) => setForm({ ...form, maquina: e.target.value })}>
                    {MAQUINAS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><label className="erp-label">Motivo da Parada *</label>
                  <select className="erp-input w-full" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })}>
                    {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><label className="erp-label">Ordem de Produção</label>
                  <input className="erp-input w-full" value={form.op} onChange={(e) => setForm({ ...form, op: e.target.value })} placeholder="OP-2025-..." />
                </div>
                <div><label className="erp-label">Operador</label>
                  <input className="erp-input w-full" value={form.operador} onChange={(e) => setForm({ ...form, operador: e.target.value })} placeholder="Nome do operador" />
                </div>
                <div className="col-span-2"><label className="erp-label">Observação</label>
                  <textarea className="erp-input w-full" rows={2} value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={registrarParada} className="erp-btn-primary text-xs flex items-center gap-1.5"><Pause size={12} />Registrar Parada</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
