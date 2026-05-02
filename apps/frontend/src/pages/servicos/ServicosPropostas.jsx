import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Mail, CheckCircle, XCircle, Clock, FileText, Send, ArrowRight, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const STATUS_CFG = {
  Rascunho:    { color: 'bg-gray-100 text-gray-600',    label: 'Rascunho' },
  Enviada:     { color: 'bg-blue-100 text-blue-700',    label: 'Enviada' },
  'Em Negociação': { color: 'bg-yellow-100 text-yellow-700', label: 'Em Negociação' },
  Aprovada:    { color: 'bg-green-100 text-green-700',  label: 'Aprovada' },
  Rejeitada:   { color: 'bg-red-100 text-red-700',      label: 'Rejeitada' },
  Expirada:    { color: 'bg-orange-100 text-orange-700',label: 'Expirada' },
};

const CAUSAS_REJEICAO = [
  'Preço acima do esperado', 'Prazo muito longo', 'Concorrente mais barato',
  'Cliente sem orçamento', 'Serviço não adequado', 'Outro',
];

export default function ServicosPropostas() {
  const [dados, setDados] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [detalhe, setDetalhe] = useState(null);
  const [showRejeicaoModal, setShowRejeicaoModal] = useState(null);
  const [causaRejeicao, setCausaRejeicao] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sales/service-proposals');
      const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      setDados(list);
    } catch {
      toast.error('Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const lista = useMemo(() => {
    let d = dados;
    if (filtroStatus !== 'Todos') d = d.filter((r) => r.status === filtroStatus);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((r) => r.cliente.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q)); }
    return d;
  }, [dados, filtroStatus, busca]);

  const kpis = useMemo(() => {
    const total = dados.length;
    const aprovadas = dados.filter((d) => d.status === 'Aprovada').length;
    const valorAprovado = dados.filter((d) => d.status === 'Aprovada').reduce((s, d) => s + d.valor, 0);
    const valorPipeline = dados.filter((d) => !['Rejeitada', 'Expirada'].includes(d.status)).reduce((s, d) => s + d.valor, 0);
    return { total, aprovadas, taxa: total ? Math.round((aprovadas / total) * 100) : 0, valorAprovado, valorPipeline };
  }, [dados]);

  const avancar = async (item) => {
    const map = { Rascunho: 'Enviada', Enviada: 'Em Negociação', 'Em Negociação': 'Aprovada' };
    if (!map[item.status]) return;
    const newStatus = map[item.status];
    const emailEnviado = newStatus === 'Enviada' ? true : item.email_enviado;
    setDados((prev) => prev.map((d) => d.id === item.id ? { ...d, status: newStatus, email_enviado: emailEnviado } : d));
    setDetalhe((p) => p?.id === item.id ? { ...p, status: newStatus } : p);
    toast.success(`Proposta → ${newStatus}`);
    try {
      await api.put(`/api/sales/service-proposals/${item.id}`, { status: newStatus, email_enviado: emailEnviado });
    } catch {
      toast.error('Erro ao atualizar proposta');
      load();
    }
  };

  const rejeitar = async (item, causa) => {
    setDados((prev) => prev.map((d) => d.id === item.id ? { ...d, status: 'Rejeitada', causa_rejeicao: causa } : d));
    setDetalhe((p) => p?.id === item.id ? { ...p, status: 'Rejeitada', causa_rejeicao: causa } : p);
    setShowRejeicaoModal(null); setCausaRejeicao('');
    toast.info('Proposta rejeitada. Causa registrada.');
    try {
      await api.put(`/api/sales/service-proposals/${item.id}`, { status: 'Rejeitada', causa_rejeicao: causa });
    } catch {
      toast.error('Erro ao rejeitar proposta');
      load();
    }
  };

  const Chip = ({ status }) => {
    const c = STATUS_CFG[status] || STATUS_CFG.Rascunho;
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${c.color}`}>{status}</span>;
  };

  const fmtBRL = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Propostas Comerciais — Serviços</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Geração, envio por e-mail e acompanhamento de aprovação</p>
        </div>
        <button type="button" onClick={() => toast.info('Nova proposta — integrada com Solicitações de Cotação')} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Nova Proposta
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: kpis.total },
          { label: 'Aprovadas', value: kpis.aprovadas, color: 'text-green-600' },
          { label: 'Taxa de Conv.', value: `${kpis.taxa}%`, color: kpis.taxa >= 50 ? 'text-green-600' : 'text-red-600' },
          { label: 'Valor Aprovado', value: fmtBRL(kpis.valorAprovado), color: 'text-green-600' },
          { label: 'Pipeline', value: fmtBRL(kpis.valorPipeline), color: 'text-primary' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="erp-card p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar cliente, código..." value={busca} onChange={(e) => setBusca(e.target.value)} />
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

      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full">
          <thead>
            <tr>
              <th>Código</th><th>Cliente</th><th>Serviço</th><th>Valor</th>
              <th>Validade</th><th>E-mail</th><th>Status</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetalhe(r)}>
                <td className="font-mono text-xs font-medium text-primary">{r.codigo}</td>
                <td className="font-medium">{r.cliente}</td>
                <td className="text-sm">{r.servico}</td>
                <td className="font-medium">{fmtBRL(r.valor)}</td>
                <td className="text-muted-foreground text-xs">{r.validade}</td>
                <td>
                  <span className={`inline-flex items-center gap-1 text-[11px] ${r.email_enviado ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <Mail size={11} />{r.email_enviado ? 'Enviado' : 'Pendente'}
                  </span>
                </td>
                <td><Chip status={r.status} /></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setDetalhe(r)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={13} /></button>
                    {!r.email_enviado && (
                      <button type="button" onClick={async () => { setDados((prev) => prev.map((d) => d.id === r.id ? { ...d, email_enviado: true } : d)); toast.success('Proposta enviada por e-mail!'); try { await api.put(`/api/sales/service-proposals/${r.id}`, { email_enviado: true }); } catch { load(); } }}
                        className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Enviar por e-mail"><Send size={13} /></button>
                    )}
                    {['Rascunho', 'Enviada', 'Em Negociação'].includes(r.status) && (
                      <button type="button" onClick={() => avancar(r)} className="p-1 rounded hover:bg-green-50 text-green-600"><ArrowRight size={13} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">Nenhuma proposta encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Causas de rejeição resumidas */}
      {dados.some((d) => d.status === 'Rejeitada' && d.causa_rejeicao) && (
        <div className="erp-card p-4">
          <h3 className="text-sm font-semibold mb-3">Análise de Rejeições</h3>
          <div className="space-y-2">
            {Object.entries(
              dados.filter((d) => d.causa_rejeicao).reduce((acc, d) => {
                acc[d.causa_rejeicao] = (acc[d.causa_rejeicao] || 0) + 1;
                return acc;
              }, {})
            ).map(([causa, qtd]) => (
              <div key={causa} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span>{causa}</span><span className="text-muted-foreground">{qtd}x</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full"><div className="h-full bg-red-400 rounded-full" style={{ width: `${(qtd / dados.filter((d) => d.causa_rejeicao).length) * 100}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalhe */}
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
                <div><span className="text-xs text-muted-foreground">Contato</span><p className="font-medium">{detalhe.contato}</p></div>
                <div><span className="text-xs text-muted-foreground">Valor</span><p className="font-medium text-primary">{fmtBRL(detalhe.valor)}</p></div>
                <div><span className="text-xs text-muted-foreground">Validade</span><p className="font-medium">{detalhe.validade}</p></div>
                <div><span className="text-xs text-muted-foreground">E-mail</span><p className={`font-medium ${detalhe.email_enviado ? 'text-green-600' : 'text-muted-foreground'}`}>{detalhe.email_enviado ? 'Enviado' : 'Não enviado'}</p></div>
              </div>
              <div><span className="text-xs text-muted-foreground">Serviço</span><p>{detalhe.servico}</p></div>
              {detalhe.causa_rejeicao && <div><span className="text-xs text-muted-foreground">Causa da rejeição</span><p className="text-red-600">{detalhe.causa_rejeicao}</p></div>}
            </div>
            <div className="p-4 border-t border-border flex flex-wrap gap-2 justify-end">
              {!detalhe.email_enviado && (
                <button type="button" onClick={async () => { setDados((prev) => prev.map((d) => d.id === detalhe.id ? { ...d, email_enviado: true } : d)); setDetalhe({ ...detalhe, email_enviado: true }); toast.success('Enviado por e-mail!'); try { await api.put(`/api/sales/service-proposals/${detalhe.id}`, { email_enviado: true }); } catch { load(); } }}
                  className="erp-btn-ghost flex items-center gap-1 text-blue-600"><Send size={13} /> Enviar E-mail</button>
              )}
              {['Rascunho', 'Enviada', 'Em Negociação'].includes(detalhe.status) && (
                <>
                  <button type="button" onClick={() => setShowRejeicaoModal(detalhe)} className="erp-btn-ghost text-red-600">Rejeitar</button>
                  <button type="button" onClick={() => avancar(detalhe)} className="erp-btn-primary flex items-center gap-1">
                    <ArrowRight size={13} />
                    {detalhe.status === 'Em Negociação' ? 'Aprovar Proposta' : detalhe.status === 'Enviada' ? 'Em Negociação' : 'Enviar'}
                  </button>
                </>
              )}
              {detalhe.status === 'Aprovada' && (
                <button type="button" onClick={() => { toast.success('Pedido de venda gerado!'); setDetalhe(null); }} className="erp-btn-primary flex items-center gap-1">
                  <FileText size={13} /> Gerar Pedido de Venda
                </button>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal causa de rejeição */}
      {showRejeicaoModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Registrar Causa da Rejeição</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Proposta: {showRejeicaoModal.codigo}</p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="erp-label">Causa da rejeição</label>
                <select className="erp-input w-full" value={causaRejeicao} onChange={(e) => setCausaRejeicao(e.target.value)}>
                  <option value="">Selecione...</option>
                  {CAUSAS_REJEICAO.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Observações adicionais</label>
                <textarea className="erp-input w-full h-20 resize-none" placeholder="Detalhe a causa da rejeição..." />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowRejeicaoModal(null)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={() => rejeitar(showRejeicaoModal, causaRejeicao || 'Não especificada')} className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600">Confirmar Rejeição</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
