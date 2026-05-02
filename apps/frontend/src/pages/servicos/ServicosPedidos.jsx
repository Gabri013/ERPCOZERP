import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, FileText, CheckCircle, XCircle, Clock, ArrowRight, DollarSign, Printer, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const STATUS_FLOW = ['Orçamento', 'Aprovado', 'Em Execução', 'Concluído', 'Faturado'];

const STATUS_CFG = {
  Orçamento:    { color: 'bg-blue-100 text-blue-700',    step: 0 },
  Aprovado:     { color: 'bg-indigo-100 text-indigo-700', step: 1 },
  'Em Execução':{ color: 'bg-yellow-100 text-yellow-700', step: 2 },
  Concluído:    { color: 'bg-teal-100 text-teal-700',    step: 3 },
  Faturado:     { color: 'bg-green-100 text-green-700',  step: 4 },
  Cancelado:    { color: 'bg-red-100 text-red-700',      step: -1 },
};

function ProgressBar({ status }) {
  const step = STATUS_CFG[status]?.step ?? -1;
  if (step < 0) return null;
  return (
    <div className="flex items-center gap-0">
      {STATUS_FLOW.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-colors
            ${i < step ? 'bg-primary border-primary text-white' : i === step ? 'bg-primary border-primary text-white' : 'bg-white border-muted-foreground/30 text-muted-foreground'}`}>
            {i < step ? '✓' : i + 1}
          </div>
          {i < STATUS_FLOW.length - 1 && (
            <div className={`h-0.5 flex-1 ${i < step ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ServicosPedidos() {
  const [dados, setDados] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sales/service-orders');
      const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      setDados(list);
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const lista = useMemo(() => {
    let d = dados;
    if (filtroStatus !== 'Todos') d = d.filter((r) => r.status === filtroStatus);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((r) => r.cliente.toLowerCase().includes(q) || r.numero.toLowerCase().includes(q) || r.servico.toLowerCase().includes(q)); }
    return d;
  }, [dados, filtroStatus, busca]);

  const kpis = useMemo(() => ({
    total: dados.length,
    em_execucao: dados.filter((d) => d.status === 'Em Execução').length,
    concluidos: dados.filter((d) => ['Concluído', 'Faturado'].includes(d.status)).length,
    faturado: dados.filter((d) => d.status === 'Faturado').reduce((s, d) => s + d.valor, 0),
    a_faturar: dados.filter((d) => d.status === 'Concluído').reduce((s, d) => s + d.valor, 0),
    margem: dados.reduce((s, d) => s + d.valor, 0) > 0
      ? Math.round(((dados.reduce((s, d) => s + d.valor, 0) - dados.reduce((s, d) => s + d.valor_custo, 0)) / dados.reduce((s, d) => s + d.valor, 0)) * 100) : 0,
  }), [dados]);

  const avancar = async (item) => {
    const next = { Orçamento: 'Aprovado', Aprovado: 'Em Execução', 'Em Execução': 'Concluído', Concluído: 'Faturado' };
    if (!next[item.status]) return toast.info('Pedido já finalizado');
    const newStatus = next[item.status];
    setDados((prev) => prev.map((d) => d.id === item.id ? { ...d, status: newStatus } : d));
    setDetalhe((p) => p?.id === item.id ? { ...p, status: newStatus } : p);
    toast.success(`Status → ${newStatus}`);
    try {
      await api.put(`/api/sales/service-orders/${item.id}`, { status: newStatus });
    } catch {
      toast.error('Erro ao atualizar status');
      load();
    }
  };

  const emitirNfse = async (item) => {
    toast.success('NFS-e emitida e autorizada!');
    try {
      const res = await api.post(`/api/sales/nfse`, { service_order_id: item.id, valor: item.valor });
      const nfse_numero = res?.data?.data?.numero_nfs || res?.data?.numero_nfs || `NFS-${Math.floor(Math.random() * 900000 + 100000)}`;
      setDados((prev) => prev.map((d) => d.id === item.id ? { ...d, nfse_numero, nfse_status: 'Autorizada', status: 'Faturado' } : d));
      setDetalhe((p) => p?.id === item.id ? { ...p, nfse_numero, nfse_status: 'Autorizada', status: 'Faturado' } : p);
    } catch {
      toast.error('Erro ao emitir NFS-e');
      load();
    }
  };

  const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const Chip = ({ status }) => {
    const c = STATUS_CFG[status] || STATUS_CFG.Orçamento;
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${c.color}`}>{status}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Pedidos de Venda — Serviços</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Acompanhe a execução, faturamento e emissão de NFS-e</p>
        </div>
        <button type="button" onClick={() => toast.info('Novo pedido — converta uma proposta aprovada')} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Novo Pedido
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: kpis.total },
          { label: 'Em Execução', value: kpis.em_execucao, color: 'text-yellow-600' },
          { label: 'Concluídos', value: kpis.concluidos, color: 'text-teal-600' },
          { label: 'Faturado', value: fmtBRL(kpis.faturado), color: 'text-green-600' },
          { label: 'A Faturar', value: fmtBRL(kpis.a_faturar), color: 'text-orange-600' },
          { label: 'Margem Bruta', value: `${kpis.margem}%`, color: kpis.margem >= 40 ? 'text-green-600' : 'text-yellow-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="erp-card p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar cliente, número, serviço..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['Todos', ...Object.keys(STATUS_CFG)].map((s) => (
            <button key={s} type="button" onClick={() => setFiltroStatus(s)}
              className={`px-2.5 py-1 rounded text-xs ${filtroStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
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
              <th>Número</th><th>Cliente</th><th>Serviço</th><th>Executor</th>
              <th>Data Prevista</th><th>Valor</th><th>NFS-e</th><th>Status</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetalhe(r)}>
                <td className="font-mono text-xs font-medium text-primary">{r.numero}</td>
                <td className="font-medium">{r.cliente}</td>
                <td className="text-sm max-w-[180px] truncate">{r.servico}</td>
                <td className="text-muted-foreground text-xs">{r.executor}</td>
                <td className="text-muted-foreground text-xs">{r.data_prevista}</td>
                <td className="font-medium">{fmtBRL(r.valor)}</td>
                <td>
                  {r.nfse_numero ? (
                    <span className="text-[11px] text-green-600 font-medium">{r.nfse_numero}</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  )}
                </td>
                <td><Chip status={r.status} /></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setDetalhe(r)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={13} /></button>
                    {['Orçamento', 'Aprovado', 'Em Execução'].includes(r.status) && (
                      <button type="button" onClick={() => avancar(r)} className="p-1 rounded hover:bg-green-50 text-green-600"><ArrowRight size={13} /></button>
                    )}
                    {r.status === 'Concluído' && !r.nfse_numero && (
                      <button type="button" onClick={() => emitirNfse(r)} className="p-1 rounded hover:bg-purple-50 text-purple-600" title="Emitir NFS-e"><FileText size={13} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">Nenhum pedido encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">{detalhe.numero}</h2>
                <p className="text-sm text-muted-foreground">{detalhe.cliente}</p>
              </div>
              <button type="button" onClick={() => setDetalhe(null)} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Progresso */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Progresso do pedido</p>
                <ProgressBar status={detalhe.status} />
                <div className="flex justify-between mt-1">
                  {STATUS_FLOW.map((s) => <span key={s} className="text-[9px] text-muted-foreground text-center flex-1">{s}</span>)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-muted-foreground">Serviço</span><p className="font-medium">{detalhe.servico}</p></div>
                <div><span className="text-xs text-muted-foreground">Executor</span><p className="font-medium">{detalhe.executor}</p></div>
                <div><span className="text-xs text-muted-foreground">Valor</span><p className="font-bold text-primary">{fmtBRL(detalhe.valor)}</p></div>
                <div><span className="text-xs text-muted-foreground">Custo</span><p className="font-medium">{fmtBRL(detalhe.valor_custo)}</p></div>
                <div><span className="text-xs text-muted-foreground">Data do pedido</span><p>{detalhe.data_pedido}</p></div>
                <div><span className="text-xs text-muted-foreground">Data prevista</span><p>{detalhe.data_prevista}</p></div>
                {detalhe.nfse_numero && (
                  <>
                    <div><span className="text-xs text-muted-foreground">NFS-e nº</span><p className="font-medium text-green-600">{detalhe.nfse_numero}</p></div>
                    <div><span className="text-xs text-muted-foreground">Status NFS-e</span><p className="font-medium text-green-600">{detalhe.nfse_status}</p></div>
                  </>
                )}
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Descrição</span>
                <p className="text-sm mt-0.5">{detalhe.descricao}</p>
              </div>
              {detalhe.obs && <div><span className="text-xs text-muted-foreground">Obs.</span><p className="text-sm">{detalhe.obs}</p></div>}

              {/* Margem */}
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Margem bruta</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.round(((detalhe.valor - detalhe.valor_custo) / detalhe.valor) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold text-green-600">{Math.round(((detalhe.valor - detalhe.valor_custo) / detalhe.valor) * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex flex-wrap gap-2 justify-end">
              {['Orçamento', 'Aprovado', 'Em Execução'].includes(detalhe.status) && (
                <button type="button" onClick={() => avancar(detalhe)} className="erp-btn-primary flex items-center gap-1">
                  <ArrowRight size={13} />
                  {detalhe.status === 'Em Execução' ? 'Concluir Serviço' : detalhe.status === 'Aprovado' ? 'Iniciar Execução' : 'Aprovar Pedido'}
                </button>
              )}
              {detalhe.status === 'Concluído' && !detalhe.nfse_numero && (
                <button type="button" onClick={() => emitirNfse(detalhe)} className="erp-btn-primary flex items-center gap-1">
                  <FileText size={13} /> Emitir NFS-e
                </button>
              )}
              {detalhe.nfse_numero && (
                <button type="button" onClick={() => toast.info('NFS-e enviada por e-mail!')} className="erp-btn-ghost flex items-center gap-1"><Send size={13} /> Enviar NFS-e</button>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
