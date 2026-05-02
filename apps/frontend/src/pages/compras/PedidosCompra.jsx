import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Send, Package, CheckCircle, XCircle, ChevronDown, FileText, Clock, AlertTriangle, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_COR = {
  'Rascunho':              'bg-gray-100 text-gray-600',
  'Confirmado':            'bg-blue-100 text-blue-700',
  'Enviado ao Fornecedor': 'bg-teal-100 text-teal-700',
  'Parcialmente Recebido': 'bg-yellow-100 text-yellow-700',
  'Recebido':              'bg-green-100 text-green-700',
  'Cancelado':             'bg-red-100 text-red-700',
};

const STATUS_FLOW = {
  'Rascunho':              'Confirmado',
  'Confirmado':            'Enviado ao Fornecedor',
  'Enviado ao Fornecedor': 'Parcialmente Recebido',
  'Parcialmente Recebido': 'Recebido',
};

export default function PedidosCompra() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/purchases/orders');
      setPedidos(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar pedidos de compra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  const [aba, setAba] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [showEmail, setShowEmail] = useState(null);
  const [showConferencia, setShowConferencia] = useState(null);
  const [qtdsConf, setQtdsConf] = useState({});

  const totais = useMemo(() => ({
    Todos: pedidos.length,
    'Abertos': pedidos.filter((p) => ['Rascunho', 'Confirmado', 'Enviado ao Fornecedor', 'Parcialmente Recebido'].includes(p.status)).length,
    'Atrasados': pedidos.filter((p) => p.entrega_prevista < hoje && !['Recebido', 'Cancelado'].includes(p.status)).length,
    'Recebidos': pedidos.filter((p) => p.status === 'Recebido').length,
  }), [pedidos]);

  const lista = useMemo(() => {
    let d = pedidos;
    if (aba === 'Abertos') d = d.filter((p) => ['Rascunho', 'Confirmado', 'Enviado ao Fornecedor', 'Parcialmente Recebido'].includes(p.status));
    else if (aba === 'Atrasados') d = d.filter((p) => p.entrega_prevista < hoje && !['Recebido', 'Cancelado'].includes(p.status));
    else if (aba === 'Recebidos') d = d.filter((p) => p.status === 'Recebido');
    if (busca) { const q = busca.toLowerCase(); d = d.filter((p) => p.id.toLowerCase().includes(q) || p.fornecedor.toLowerCase().includes(q)); }
    return d;
  }, [pedidos, aba, busca]);

  const kpis = useMemo(() => ({
    valor_aberto: pedidos.filter((p) => !['Recebido', 'Cancelado'].includes(p.status)).reduce((s, p) => s + p.valor_total, 0),
    atrasados: pedidos.filter((p) => p.entrega_prevista < hoje && !['Recebido', 'Cancelado'].includes(p.status)).length,
    em_andamento: pedidos.filter((p) => ['Enviado ao Fornecedor', 'Parcialmente Recebido'].includes(p.status)).length,
    recebidos_mes: pedidos.filter((p) => p.status === 'Recebido' && p.data >= hoje.slice(0, 7) + '-01').reduce((s, p) => s + p.valor_total, 0),
  }), [pedidos]);

  const avancarStatus = (id, novoStatus) => {
    setPedidos(pedidos.map((p) => p.id === id ? { ...p, status: novoStatus, historico: [...p.historico, { data: hoje, evento: `Status atualizado para: ${novoStatus}`, usuario: 'Usuário' }] } : p));
    setDetalhe((prev) => prev?.id === id ? { ...prev, status: novoStatus } : prev);
    toast.success(`Pedido atualizado: ${novoStatus}`);
  };

  const confirmarRecebimento = (pedido) => {
    const qtds = qtdsConf;
    const todosRecebidos = pedido.itens.every((it) => Number(qtds[it.produto] || it.qtd_recebida) >= it.quantidade);
    const novoStatus = todosRecebidos ? 'Recebido' : 'Parcialmente Recebido';
    setPedidos(pedidos.map((p) => p.id === pedido.id
      ? { ...p, status: novoStatus, itens: p.itens.map((it) => ({ ...it, qtd_recebida: Number(qtds[it.produto] || it.qtd_recebida) })), historico: [...p.historico, { data: hoje, evento: `Recebimento registrado (${novoStatus})`, usuario: 'Almox' }] }
      : p));
    setShowConferencia(null);
    setQtdsConf({});
    toast.success(`Recebimento registrado: ${novoStatus}`);
  };

  const ProgBar = ({ itens }) => {
    const total = itens.reduce((s, i) => s + i.quantidade, 0);
    const receb = itens.reduce((s, i) => s + i.qtd_recebida, 0);
    const pct = total > 0 ? Math.round((receb / total) * 100) : 0;
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div>
        <span className="text-muted-foreground">{pct}% recebido</span>
      </div>
    );
  };

  const atrasadoCheck = (p) => p.entrega_prevista < hoje && !['Recebido', 'Cancelado'].includes(p.status);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Pedidos de Compra</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Acompanhamento de prazo e cumprimento de entregas</p>
        </div>
        <button type="button" onClick={() => toast.info('Novo pedido de compra')} className="erp-btn-primary flex items-center gap-2"><Plus size={14} /> Novo Pedido</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Valor em aberto', value: fmtBRL(kpis.valor_aberto), color: 'text-primary' },
          { label: 'Em andamento', value: kpis.em_andamento, color: 'text-blue-600' },
          { label: 'Atrasados', value: kpis.atrasados, color: kpis.atrasados > 0 ? 'text-red-600' : '' },
          { label: 'Recebido no mês', value: fmtBRL(kpis.recebidos_mes), color: 'text-green-600' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Alerta atraso */}
      {kpis.atrasados > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle size={15} /><span><strong>{kpis.atrasados} pedido(s)</strong> com entrega atrasada.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="erp-card p-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Número, fornecedor..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <input type="date" className="erp-input text-xs" />
        <input type="date" className="erp-input text-xs" />
        <button type="button" className="erp-btn-primary text-xs px-4">Pesquisar</button>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0">
        {['Todos', 'Abertos', 'Atrasados', 'Recebidos'].map((a) => (
          <button key={a} type="button" onClick={() => setAba(a)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap ${aba === a ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a} <span className="ml-1 text-[10px] bg-muted px-1.5 rounded-full">{totais[a] || 0}</span>
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full text-xs min-w-[900px]">
          <thead>
            <tr>
              <th>Número</th><th>Fornecedor</th><th>Data</th><th>Entrega Prevista</th>
              <th>Valor Total</th><th>Progresso</th><th>Status</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const atrasado = atrasadoCheck(p);
              return (
                <tr key={p.id} className={`cursor-pointer hover:bg-muted/30 ${atrasado ? 'bg-red-50/40' : ''}`} onClick={() => setDetalhe(p)}>
                  <td className="font-mono font-semibold text-primary">{p.id}</td>
                  <td className="font-medium">{p.fornecedor}</td>
                  <td className="text-muted-foreground">{fmtD(p.data)}</td>
                  <td className={atrasado ? 'text-red-600 font-bold' : 'text-muted-foreground'}>{fmtD(p.entrega_prevista)}{atrasado && ' ⚠'}</td>
                  <td className="font-medium">{fmtBRL(p.valor_total)}</td>
                  <td className="min-w-[120px]"><ProgBar itens={p.itens} /></td>
                  <td><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COR[p.status]}`}>{p.status}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setDetalhe(p)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={12} /></button>
                      {p.status === 'Confirmado' && (
                        <button type="button" onClick={() => { setShowEmail(p); }} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Enviar e-mail"><Send size={12} /></button>
                      )}
                      {['Enviado ao Fornecedor', 'Parcialmente Recebido'].includes(p.status) && (
                        <button type="button" onClick={() => { setShowConferencia(p); setQtdsConf(Object.fromEntries(p.itens.map((i) => [i.produto, i.qtd_recebida]))); }}
                          className="p-1 rounded hover:bg-green-50 text-green-600" title="Registrar recebimento"><Package size={12} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!lista.length && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{detalhe.id}</h2>
                <p className="text-sm text-muted-foreground">{detalhe.fornecedor}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COR[detalhe.status]}`}>{detalhe.status}</span>
                <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} /></button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3 text-sm border-b border-border">
              <div><span className="text-xs text-muted-foreground">Data do Pedido</span><p className="font-medium">{fmtD(detalhe.data)}</p></div>
              <div><span className="text-xs text-muted-foreground">Entrega Prevista</span><p className={`font-medium ${atrasadoCheck(detalhe) ? 'text-red-600' : ''}`}>{fmtD(detalhe.entrega_prevista)}</p></div>
              <div><span className="text-xs text-muted-foreground">Valor Total</span><p className="font-bold text-primary">{fmtBRL(detalhe.valor_total)}</p></div>
            </div>

            {/* Itens */}
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold mb-2">Itens do Pedido</h3>
              <table className="w-full text-xs">
                <thead><tr className="bg-muted"><th className="text-left p-2">Produto</th><th className="text-right p-2">Qtd.</th><th className="text-left p-2">Un.</th><th className="text-right p-2">Preço Unit.</th><th className="text-right p-2">Total</th><th className="text-right p-2">Recebido</th></tr></thead>
                <tbody>
                  {detalhe.itens.map((i) => (
                    <tr key={i.produto} className="border-b border-border/30">
                      <td className="p-2 font-medium">{i.produto}</td>
                      <td className="p-2 text-right">{i.quantidade}</td>
                      <td className="p-2">{i.unidade}</td>
                      <td className="p-2 text-right">{fmtBRL(i.valor_unit)}</td>
                      <td className="p-2 text-right font-medium">{fmtBRL(i.total)}</td>
                      <td className="p-2 text-right">{i.qtd_recebida}/{i.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Histórico */}
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold mb-2">Histórico</h3>
              <div className="space-y-1">
                {detalhe.historico.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground min-w-[80px]">{fmtD(h.data)}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="flex-1">{h.evento}</span>
                    <span className="text-muted-foreground">{h.usuario}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 flex flex-wrap gap-2">
              {STATUS_FLOW[detalhe.status] && (
                <button type="button" onClick={() => avancarStatus(detalhe.id, STATUS_FLOW[detalhe.status])} className="erp-btn-primary text-xs flex items-center gap-1">
                  <CheckCircle size={12} /> Avançar para {STATUS_FLOW[detalhe.status]}
                </button>
              )}
              {detalhe.status === 'Confirmado' && (
                <button type="button" onClick={() => setShowEmail(detalhe)} className="erp-btn-ghost text-xs flex items-center gap-1"><Send size={12} /> Enviar ao Fornecedor</button>
              )}
              <button type="button" onClick={() => toast.info('Imprimindo pedido...')} className="erp-btn-ghost text-xs flex items-center gap-1"><Printer size={12} /> Imprimir</button>
              {detalhe.status !== 'Recebido' && detalhe.status !== 'Cancelado' && (
                <button type="button" onClick={() => { avancarStatus(detalhe.id, 'Cancelado'); }} className="text-xs text-red-600 hover:underline">Cancelar pedido</button>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs ml-auto">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal envio de e-mail */}
      {showEmail && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Enviar Pedido por E-mail</h3>
              <button type="button" onClick={() => setShowEmail(null)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div><label className="erp-label">Destinatário</label><input className="erp-input w-full" defaultValue="compras@fornecedor.com" /></div>
              <div><label className="erp-label">Assunto</label><input className="erp-input w-full" defaultValue={`Pedido de Compra ${showEmail.id}`} /></div>
              <div><label className="erp-label">Mensagem</label><textarea rows={4} className="erp-input w-full resize-none" defaultValue={`Prezado fornecedor,\n\nSegue em anexo o pedido de compra ${showEmail.id}.\n\nAtenciosamente,\nEquipe de Compras - COZINCA INOX`} /></div>
              <div className="bg-muted/30 p-2 rounded text-xs flex items-center gap-2">
                <FileText size={12} className="text-muted-foreground" />
                <span>Pedido_{showEmail.id}.pdf será enviado como anexo</span>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowEmail(null)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={() => { avancarStatus(showEmail.id, 'Enviado ao Fornecedor'); setShowEmail(null); toast.success('E-mail enviado com sucesso!'); }}
                className="erp-btn-primary text-xs flex items-center gap-1"><Send size={12} /> Enviar E-mail</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal conferência e recebimento */}
      {showConferencia && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div><h3 className="font-semibold">Conferência e Recebimento</h3><p className="text-xs text-muted-foreground">{showConferencia.id} — {showConferencia.fornecedor}</p></div>
              <button type="button" onClick={() => setShowConferencia(null)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              {showConferencia.itens.map((item) => (
                <div key={item.produto} className="border border-border rounded-lg p-3">
                  <p className="text-sm font-medium">{item.produto}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Pedido</span><p className="font-bold">{item.quantidade} {item.unidade}</p></div>
                    <div><span className="text-muted-foreground">Já recebido</span><p className="font-bold text-green-600">{item.qtd_recebida} {item.unidade}</p></div>
                    <div>
                      <span className="text-muted-foreground">Conf. agora *</span>
                      <input type="number" min="0" max={item.quantidade} className="erp-input w-full text-xs mt-0.5"
                        value={qtdsConf[item.produto] ?? item.qtd_recebida}
                        onChange={(e) => setQtdsConf({ ...qtdsConf, [item.produto]: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full transition-all" style={{ width: `${Math.min(100, ((qtdsConf[item.produto] ?? item.qtd_recebida) / item.quantidade) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowConferencia(null)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={() => confirmarRecebimento(showConferencia)} className="erp-btn-primary text-xs flex items-center gap-1">
                <Package size={12} /> Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
