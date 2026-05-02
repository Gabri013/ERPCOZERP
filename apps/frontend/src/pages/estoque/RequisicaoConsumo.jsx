import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];


const STATUS_COR = {
  'Pendente':    'bg-yellow-100 text-yellow-700',
  'Aprovada':    'bg-blue-100 text-blue-700',
  'Atendida':    'bg-green-100 text-green-700',
  'Recusada':    'bg-red-100 text-red-700',
  'Parcial':     'bg-orange-100 text-orange-700',
};

const CENTROS_CUSTO = ['Administrativo', 'Comercial', 'Produção', 'Manutenção', 'P&D', 'Qualidade', 'Expedição'];

export default function RequisicaoConsumo() {
  const [requisicoes, setRequisicoes] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/api/stock/requisitions');
      setRequisicoes(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar requisições de consumo');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [form, setForm] = useState({ solicitante: '', centro_custo: 'Administrativo', obs: '', itens: [{ codigo: '', descricao: '', unidade: 'pc', qtd: 1 }] });

  const lista = useMemo(() => {
    let d = requisicoes;
    if (filtroStatus !== 'Todos') d = d.filter((r) => r.status === filtroStatus);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((r) => r.id.toLowerCase().includes(q) || r.solicitante.toLowerCase().includes(q) || r.centro_custo.toLowerCase().includes(q)); }
    return d;
  }, [requisicoes, filtroStatus, busca]);

  const kpis = useMemo(() => ({
    pendentes: requisicoes.filter((r) => r.status === 'Pendente').length,
    aprovadas: requisicoes.filter((r) => r.status === 'Aprovada').length,
    atendidas: requisicoes.filter((r) => r.status === 'Atendida').length,
  }), [requisicoes]);

  const aprovar = (id) => {
    setRequisicoes(requisicoes.map((r) => r.id === id ? { ...r, status: 'Aprovada', aprovador: 'Usuário Atual' } : r));
    toast.success('Requisição aprovada!');
  };
  const recusar = (id) => {
    setRequisicoes(requisicoes.map((r) => r.id === id ? { ...r, status: 'Recusada' } : r));
    toast.success('Requisição recusada.');
  };
  const atender = (id) => {
    setRequisicoes(requisicoes.map((r) => r.id === id ? { ...r, status: 'Atendida', itens: r.itens.map((i) => ({ ...i, qtd_atendida: i.qtd_solicitada })) } : r));
    toast.success('Requisição atendida! Estoque baixado.');
  };

  const criarRequisicao = () => {
    const nova = {
      id: `RC-2025-${String(requisicoes.length + 1).padStart(3, '0')}`,
      data: hoje, solicitante: form.solicitante || 'Usuário Atual',
      centro_custo: form.centro_custo, status: 'Pendente', aprovador: null, obs: form.obs,
      itens: form.itens.map((it, i) => ({ id: i + 1, ...it, qtd_solicitada: it.qtd, qtd_atendida: 0, lote: '', local: '' })),
    };
    setRequisicoes([nova, ...requisicoes]);
    setShowForm(false);
    setForm({ solicitante: '', centro_custo: 'Administrativo', obs: '', itens: [{ codigo: '', descricao: '', unidade: 'pc', qtd: 1 }] });
    toast.success('Requisição criada e aguardando aprovação!');
  };

  const StatusChip = ({ s }) => <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COR[s] || 'bg-muted'}`}>{s}</span>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Requisição de Materiais de Consumo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controle o consumo administrativo e operacional por centro de custo</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="erp-btn-primary flex items-center gap-2"><Plus size={14} /> Nova Requisição</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendentes aprovação', value: kpis.pendentes, color: 'text-yellow-600' },
          { label: 'Aprovadas (atender)', value: kpis.aprovadas, color: 'text-blue-600' },
          { label: 'Atendidas (mês)',     value: kpis.atendidas, color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="erp-card p-2 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar requisição, solicitante, centro de custo..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['Todos', 'Pendente', 'Aprovada', 'Atendida', 'Recusada'].map((s) => (
            <button key={s} type="button" onClick={() => setFiltroStatus(s)}
              className={`px-2.5 py-1 rounded text-xs ${filtroStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {lista.map((r) => (
          <div key={r.id} className="erp-card p-0 overflow-hidden">
            <div className="p-3 flex items-start gap-3 justify-between border-b border-border/40">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold text-primary">{r.id}</span>
                  <StatusChip s={r.status} />
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{r.centro_custo}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Solicitante: <strong>{r.solicitante}</strong> · {fmtD(r.data)}</p>
                {r.obs && <p className="text-xs text-muted-foreground">{r.obs}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {r.status === 'Pendente' && (
                  <>
                    <button type="button" onClick={() => aprovar(r.id)} className="erp-btn-primary text-xs flex items-center gap-1"><CheckCircle size={11} /> Aprovar</button>
                    <button type="button" onClick={() => recusar(r.id)} className="erp-btn-ghost text-xs text-red-600 flex items-center gap-1"><XCircle size={11} /> Recusar</button>
                  </>
                )}
                {r.status === 'Aprovada' && (
                  <button type="button" onClick={() => atender(r.id)} className="erp-btn-primary text-xs flex items-center gap-1"><Package size={11} /> Atender</button>
                )}
                <button type="button" onClick={() => setDetalhe(r)} className="erp-btn-ghost text-xs">Ver itens</button>
              </div>
            </div>
            <div className="p-2 flex flex-wrap gap-1.5">
              {r.itens.map((it) => (
                <div key={it.id} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${it.sem_estoque ? 'border-red-300 bg-red-50 text-red-700' : 'border-border/50 bg-muted/20'}`}>
                  {it.sem_estoque && <AlertTriangle size={9} />}
                  <span className="font-mono">{it.codigo}</span>
                  <span className="text-muted-foreground">{it.qtd_solicitada} {it.unidade}</span>
                  {it.qtd_atendida > 0 && it.qtd_atendida < it.qtd_solicitada && <span className="text-orange-600">↗ {it.qtd_atendida} atendido</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!lista.length && <div className="erp-card p-8 text-center text-muted-foreground">Nenhuma requisição encontrada</div>}
      </div>

      {/* Modal Nova Requisição */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Nova Requisição de Consumo</h2>
              <button type="button" onClick={() => setShowForm(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Solicitante</label><input className="erp-input w-full" value={form.solicitante} onChange={(e) => setForm({ ...form, solicitante: e.target.value })} placeholder="Nome do solicitante" /></div>
                <div><label className="erp-label">Centro de Custo *</label>
                  <select className="erp-input w-full" value={form.centro_custo} onChange={(e) => setForm({ ...form, centro_custo: e.target.value })}>
                    {CENTROS_CUSTO.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="erp-label">Observação</label><textarea className="erp-input w-full" rows={2} value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><p className="text-xs font-semibold">Itens</p>
                  <button type="button" onClick={() => setForm({ ...form, itens: [...form.itens, { codigo: '', descricao: '', unidade: 'pc', qtd: 1 }] })} className="text-xs text-primary hover:underline">+ Item</button>
                </div>
                {form.itens.map((it, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 mb-2 text-xs">
                    <div className="col-span-2"><input className="erp-input w-full" placeholder="Código" value={it.codigo} onChange={(e) => { const f = [...form.itens]; f[i].codigo = e.target.value; setForm({ ...form, itens: f }); }} /></div>
                    <div className="col-span-2"><input className="erp-input w-full" placeholder="Descrição" value={it.descricao} onChange={(e) => { const f = [...form.itens]; f[i].descricao = e.target.value; setForm({ ...form, itens: f }); }} /></div>
                    <div><input type="number" min="0" className="erp-input w-full" placeholder="Qtd" value={it.qtd} onChange={(e) => { const f = [...form.itens]; f[i].qtd = Number(e.target.value); setForm({ ...form, itens: f }); }} /></div>
                    <div className="flex gap-1">
                      <select className="erp-input flex-1" value={it.unidade} onChange={(e) => { const f = [...form.itens]; f[i].unidade = e.target.value; setForm({ ...form, itens: f }); }}>
                        {['pc', 'cx', 'kg', 'L', 'm', 'rolo'].map((u) => <option key={u}>{u}</option>)}
                      </select>
                      {form.itens.length > 1 && <button type="button" onClick={() => setForm({ ...form, itens: form.itens.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600"><XCircle size={14} /></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={criarRequisicao} className="erp-btn-primary text-xs">Criar Requisição</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div><h2 className="font-semibold">{detalhe.id}</h2><p className="text-xs text-muted-foreground">{detalhe.centro_custo} · {fmtD(detalhe.data)} · {detalhe.solicitante}</p></div>
              <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted"><th className="text-left p-2">Código</th><th className="text-left p-2">Descrição</th><th className="text-center p-2">UN</th><th className="text-right p-2">Solicitado</th><th className="text-right p-2">Atendido</th><th className="text-center p-2">Lote</th><th className="text-center p-2">Local</th></tr></thead>
                <tbody>
                  {detalhe.itens.map((it) => (
                    <tr key={it.id} className={`border-b border-border/30 ${it.sem_estoque ? 'bg-red-50/40' : ''}`}>
                      <td className="p-2 font-mono">{it.codigo}</td>
                      <td className="p-2">{it.descricao}</td>
                      <td className="p-2 text-center">{it.unidade}</td>
                      <td className="p-2 text-right font-medium">{it.qtd_solicitada}</td>
                      <td className="p-2 text-right">{it.qtd_atendida > 0 ? <span className="text-green-600 font-medium">{it.qtd_atendida}</span> : '—'}</td>
                      <td className="p-2 text-center text-muted-foreground">{it.lote || '—'}</td>
                      <td className="p-2 text-center text-muted-foreground">{it.local || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border flex justify-end"><button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs">Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
