import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Filter, Eye, FileText, CheckCircle, XCircle, Clock, ArrowRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const STATUS_CFG = {
  Nova:              { color: 'bg-blue-100 text-blue-700',    icon: Clock },
  'Em Análise':      { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  'Proposta Gerada': { color: 'bg-purple-100 text-purple-700', icon: FileText },
  Aprovada:          { color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  Rejeitada:         { color: 'bg-red-100 text-red-700',       icon: XCircle },
  Cancelada:         { color: 'bg-gray-100 text-gray-500',     icon: XCircle },
};

const SERVICOS_TIPOS = [
  'Manutenção preventiva', 'Manutenção corretiva', 'Instalação de equipamento',
  'Consultoria técnica', 'Treinamento', 'Projeto personalizado',
  'Reforma / Retrofit', 'Inspeção técnica', 'Limpeza industrial',
];

const EMPTY_FORM = { cliente: '', contato: '', servico: '', descricao: '', prazo: '', valor_estimado: '', responsavel: '', obs: '' };

export default function ServicosOrcamentos() {
  const [dados, setDados] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sales/service-quotes');
      const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      setDados(list);
    } catch {
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const lista = useMemo(() => {
    let d = dados;
    if (filtroStatus !== 'Todos') d = d.filter((r) => r.status === filtroStatus);
    if (busca) {
      const q = busca.toLowerCase();
      d = d.filter((r) => r.cliente.toLowerCase().includes(q) || r.servico.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q));
    }
    return d;
  }, [dados, filtroStatus, busca]);

  const kpis = useMemo(() => ({
    total: dados.length,
    novas: dados.filter((d) => d.status === 'Nova').length,
    em_analise: dados.filter((d) => d.status === 'Em Análise').length,
    aprovadas: dados.filter((d) => d.status === 'Aprovada').length,
    taxa: dados.length ? Math.round((dados.filter((d) => d.status === 'Aprovada').length / dados.length) * 100) : 0,
    valor_pipeline: dados.filter((d) => !['Rejeitada', 'Cancelada'].includes(d.status)).reduce((s, r) => s + Number(r.valor_estimado || 0), 0),
  }), [dados]);

  const salvar = async () => {
    if (!form.cliente || !form.servico) return toast.error('Preencha cliente e serviço');
    try {
      await api.post('/api/sales/service-quotes', {
        ...form,
        status: 'Nova',
        data: new Date().toISOString().split('T')[0],
        valor_estimado: Number(form.valor_estimado) || 0,
      });
      await load();
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success('Solicitação registrada!');
    } catch {
      toast.error('Erro ao registrar solicitação');
    }
  };

  const avancar = async (item) => {
    const next = { Nova: 'Em Análise', 'Em Análise': 'Proposta Gerada', 'Proposta Gerada': 'Aprovada' };
    if (!next[item.status]) return;
    const newStatus = next[item.status];
    setDados((prev) => prev.map((d) => d.id === item.id ? { ...d, status: newStatus } : d));
    setDetalhe((prev) => prev?.id === item.id ? { ...prev, status: newStatus } : prev);
    toast.success(`Status → ${newStatus}`);
    try {
      await api.put(`/api/sales/service-quotes/${item.id}`, { status: newStatus });
    } catch {
      toast.error('Erro ao atualizar status');
      load();
    }
  };

  const rejeitar = async (item) => {
    setDados((prev) => prev.map((d) => d.id === item.id ? { ...d, status: 'Rejeitada' } : d));
    setDetalhe((prev) => prev?.id === item.id ? { ...prev, status: 'Rejeitada' } : prev);
    toast.info('Solicitação rejeitada');
    try {
      await api.put(`/api/sales/service-quotes/${item.id}`, { status: 'Rejeitada' });
    } catch {
      toast.error('Erro ao rejeitar solicitação');
      load();
    }
  };

  const Chip = ({ status }) => {
    const c = STATUS_CFG[status] || STATUS_CFG.Nova;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.color}`}>{status}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Solicitações de Cotação — Serviços</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registre e analise solicitações; gere propostas comerciais de serviços</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Nova Solicitação
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: kpis.total, color: 'text-foreground' },
          { label: 'Novas', value: kpis.novas, color: 'text-blue-600' },
          { label: 'Em Análise', value: kpis.em_analise, color: 'text-yellow-600' },
          { label: 'Aprovadas', value: kpis.aprovadas, color: 'text-green-600' },
          { label: 'Taxa Aprovação', value: `${kpis.taxa}%`, color: kpis.taxa >= 50 ? 'text-green-600' : 'text-red-600' },
          { label: 'Pipeline (R$)', value: kpis.valor_pipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), color: 'text-primary' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="erp-card p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar cliente, serviço..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['Todos', ...Object.keys(STATUS_CFG)].map((s) => (
            <button key={s} type="button" onClick={() => setFiltroStatus(s)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${filtroStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full">
          <thead>
            <tr>
              <th>Código</th><th>Cliente</th><th>Contato</th><th>Serviço</th>
              <th>Data</th><th>Prazo</th><th>Valor Est.</th><th>Status</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetalhe(r)}>
                <td className="font-mono text-xs font-medium text-primary">{r.codigo}</td>
                <td className="font-medium">{r.cliente}</td>
                <td className="text-muted-foreground">{r.contato}</td>
                <td>{r.servico}</td>
                <td className="text-muted-foreground">{r.data}</td>
                <td className="text-muted-foreground">{r.prazo}</td>
                <td className="font-medium">{Number(r.valor_estimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</td>
                <td><Chip status={r.status} /></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setDetalhe(r)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Ver detalhes"><Eye size={13} /></button>
                    {['Nova', 'Em Análise', 'Proposta Gerada'].includes(r.status) && (
                      <button type="button" onClick={() => avancar(r)} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Avançar status"><ArrowRight size={13} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">Nenhuma solicitação encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Nova Solicitação de Cotação — Serviço</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Cliente *', key: 'cliente', full: true },
                { label: 'Contato', key: 'contato' },
                { label: 'Responsável', key: 'responsavel' },
                { label: 'Prazo solicitado', key: 'prazo', type: 'date' },
                { label: 'Valor estimado (R$)', key: 'valor_estimado', type: 'number' },
              ].map((f) => (
                <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                  <label className="erp-label">{f.label}</label>
                  <input type={f.type || 'text'} className="erp-input w-full" value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="erp-label">Tipo de Serviço *</label>
                <select className="erp-input w-full" value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })}>
                  <option value="">Selecione...</option>
                  {SERVICOS_TIPOS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="erp-label">Descrição detalhada</label>
                <textarea className="erp-input w-full h-20 resize-none" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="erp-label">Observações</label>
                <textarea className="erp-input w-full h-16 resize-none" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={salvar} className="erp-btn-primary">Registrar Solicitação</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{detalhe.codigo} — {detalhe.cliente}</h2>
                <div className="mt-1"><Chip status={detalhe.status} /></div>
              </div>
              <button type="button" onClick={() => setDetalhe(null)} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground text-xs">Contato:</span><p className="font-medium">{detalhe.contato}</p></div>
                <div><span className="text-muted-foreground text-xs">Responsável:</span><p className="font-medium">{detalhe.responsavel}</p></div>
                <div><span className="text-muted-foreground text-xs">Tipo de serviço:</span><p className="font-medium">{detalhe.servico}</p></div>
                <div><span className="text-muted-foreground text-xs">Valor estimado:</span><p className="font-medium text-primary">{Number(detalhe.valor_estimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                <div><span className="text-muted-foreground text-xs">Data:</span><p className="font-medium">{detalhe.data}</p></div>
                <div><span className="text-muted-foreground text-xs">Prazo:</span><p className="font-medium">{detalhe.prazo}</p></div>
              </div>
              <div><span className="text-muted-foreground text-xs">Descrição:</span><p className="mt-0.5 text-foreground">{detalhe.descricao}</p></div>
              {detalhe.obs && <div><span className="text-muted-foreground text-xs">Observações:</span><p className="mt-0.5">{detalhe.obs}</p></div>}
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              {['Nova', 'Em Análise', 'Proposta Gerada'].includes(detalhe.status) && (
                <>
                  <button type="button" onClick={() => rejeitar(detalhe)} className="erp-btn-ghost text-red-600 hover:bg-red-50">Rejeitar</button>
                  <button type="button" onClick={() => avancar(detalhe)} className="erp-btn-primary flex items-center gap-1">
                    <ArrowRight size={13} />
                    {detalhe.status === 'Proposta Gerada' ? 'Aprovar' : detalhe.status === 'Em Análise' ? 'Gerar Proposta' : 'Iniciar Análise'}
                  </button>
                </>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
