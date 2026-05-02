import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Send, CheckCircle, XCircle, Star, ChevronDown, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';

const STATUS_COR = {
  'Rascunho':          'bg-gray-100 text-gray-600',
  'Enviada':           'bg-blue-100 text-blue-700',
  'Aguardando':        'bg-yellow-100 text-yellow-700',
  'Proposta Recebida': 'bg-teal-100 text-teal-700',
  'Aprovada':          'bg-green-100 text-green-700',
  'Convertida em PC':  'bg-purple-100 text-purple-700',
  'Cancelada':         'bg-red-100 text-red-700',
};

export default function CotacoesCompra() {
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/purchases/quotes');
      setCotacoes(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar cotações de compra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  const [aba, setAba] = useState('Todas');
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const totais = useMemo(() => ({
    Todas: cotacoes.length,
    'Aguardando': cotacoes.filter((c) => ['Enviada', 'Aguardando'].includes(c.status)).length,
    'Com Proposta': cotacoes.filter((c) => c.status === 'Proposta Recebida').length,
    'Aprovadas': cotacoes.filter((c) => c.status === 'Aprovada').length,
  }), [cotacoes]);

  const lista = useMemo(() => {
    let d = cotacoes;
    if (aba === 'Aguardando') d = d.filter((c) => ['Enviada', 'Aguardando'].includes(c.status));
    else if (aba === 'Com Proposta') d = d.filter((c) => c.status === 'Proposta Recebida');
    else if (aba === 'Aprovadas') d = d.filter((c) => c.status === 'Aprovada');
    if (busca) { const q = busca.toLowerCase(); d = d.filter((c) => c.id.toLowerCase().includes(q) || c.descricao.toLowerCase().includes(q)); }
    return d;
  }, [cotacoes, aba, busca]);

  const kpis = useMemo(() => ({
    total: cotacoes.length,
    respondidas: cotacoes.filter((c) => c.status === 'Proposta Recebida').length,
    economia: cotacoes.filter((c) => c.status === 'Aprovada').reduce((s, c) => {
      const respostas = c.fornecedores.filter((f) => f.valor_unit);
      if (respostas.length < 2) return s;
      const min = Math.min(...respostas.map((f) => f.valor_unit));
      const max = Math.max(...respostas.map((f) => f.valor_unit));
      return s + (max - min) * (c.itens[0]?.quantidade || 1);
    }, 0),
  }), [cotacoes]);

  const aprovarFornecedor = (cotId, fornNome) => {
    setCotacoes(cotacoes.map((c) => c.id === cotId
      ? { ...c, status: 'Aprovada', fornecedores: c.fornecedores.map((f) => ({ ...f, melhor: f.nome === fornNome })) }
      : c));
    setDetalhe(null);
    toast.success(`Fornecedor ${fornNome} aprovado! Pedido de compra pode ser gerado.`);
  };

  const enviarCotacao = (cot) => {
    setCotacoes(cotacoes.map((c) => c.id === cot.id ? { ...c, status: 'Enviada' } : c));
    setDetalhe({ ...detalhe, status: 'Enviada' });
    toast.success(`Cotação enviada para ${cot.fornecedores.length} fornecedor(es)!`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Cotações de Compra</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comparativo de preços entre fornecedores</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => toast.info('Abrindo portal de cotações...')} className="erp-btn-ghost flex items-center gap-1.5 text-xs">
            <ExternalLink size={13} /> Portal do Fornecedor
          </button>
          <button type="button" onClick={() => setShowForm(true)} className="erp-btn-primary flex items-center gap-2">
            <Plus size={14} /> Nova Cotação
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Total de cotações</p><p className="text-lg font-bold">{kpis.total}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Com propostas recebidas</p><p className="text-lg font-bold text-teal-600">{kpis.respondidas}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Economia identificada</p><p className="text-lg font-bold text-green-600">{fmtBRL(kpis.economia)}</p></div>
      </div>

      {/* Filtros */}
      <div className="erp-card p-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Código, descrição..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <button type="button" className="erp-btn-primary text-xs px-4">Pesquisar</button>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0">
        {['Todas', 'Aguardando', 'Com Proposta', 'Aprovadas'].map((a) => (
          <button key={a} type="button" onClick={() => setAba(a)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap ${aba === a ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a} <span className="ml-1 text-[10px] bg-muted px-1.5 rounded-full">{totais[a] || 0}</span>
          </button>
        ))}
      </div>

      {/* Cards de cotação */}
      <div className="space-y-3">
        {lista.map((cot) => {
          const respondidos = cot.fornecedores.filter((f) => f.valor_unit !== null);
          const melhorPreco = respondidos.length > 0 ? Math.min(...respondidos.map((f) => f.valor_unit)) : null;
          return (
            <div key={cot.id} className="erp-card p-0 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between bg-muted/20 border-b border-border">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-mono font-semibold text-primary text-sm">{cot.id}</span>
                    <span className="mx-2 text-muted-foreground">—</span>
                    <span className="font-medium">{cot.descricao}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COR[cot.status] || 'bg-muted'}`}>{cot.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Validade: {fmtD(cot.validade)}</span>
                  <button type="button" onClick={() => setDetalhe(cot)} className="erp-btn-ghost text-xs px-2 py-1">Ver detalhes</button>
                  {cot.status === 'Rascunho' && (
                    <button type="button" onClick={() => enviarCotacao(cot)} className="erp-btn-primary text-xs px-2 py-1 flex items-center gap-1"><Send size={11} /> Enviar</button>
                  )}
                </div>
              </div>

              {/* Comparativo de fornecedores */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-border">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground w-40">Fornecedor</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Contato</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Preço unit.</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Total</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Prazo</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Cond. Pag.</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cot.fornecedores.map((f) => {
                      const isBest = f.valor_unit !== null && f.valor_unit === melhorPreco;
                      const total = f.valor_unit ? f.valor_unit * (cot.itens[0]?.quantidade || 1) : null;
                      return (
                        <tr key={f.nome} className={`border-b border-border/40 ${isBest ? 'bg-green-50/50' : 'hover:bg-muted/20'}`}>
                          <td className="px-4 py-2.5 font-medium">
                            {isBest && <Star size={11} className="inline mr-1 text-yellow-500 fill-yellow-400" />}
                            {f.nome}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{f.contato}</td>
                          <td className={`px-3 py-2.5 text-right font-medium ${isBest ? 'text-green-700' : ''}`}>
                            {f.valor_unit ? fmtBRL(f.valor_unit) : <span className="text-muted-foreground italic">Aguardando</span>}
                          </td>
                          <td className={`px-3 py-2.5 text-right font-semibold ${isBest ? 'text-green-700' : ''}`}>
                            {total ? fmtBRL(total) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground">
                            {f.prazo_entrega ? `${f.prazo_entrega}d` : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{f.cond_pag || '—'}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${f.status === 'Respondida' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{f.status}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {cot.status === 'Proposta Recebida' && f.valor_unit && (
                              <button type="button" onClick={() => aprovarFornecedor(cot.id, f.nome)}
                                className="text-xs text-green-600 hover:underline flex items-center gap-0.5 mx-auto">
                                <CheckCircle size={11} /> Aprovar
                              </button>
                            )}
                            {cot.status === 'Aprovada' && f.melhor && (
                              <span className="text-[10px] text-green-700 font-semibold flex items-center gap-0.5 mx-auto justify-center">
                                <Star size={11} className="fill-yellow-400 text-yellow-500" /> Aprovado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer da cotação */}
              {respondidos.length >= 2 && melhorPreco && (
                <div className="px-4 py-2 bg-green-50/60 border-t border-green-100 text-xs text-green-700 flex items-center gap-2">
                  <Star size={11} className="fill-yellow-400 text-yellow-500" />
                  Melhor preço: <strong>{fmtBRL(melhorPreco * (cot.itens[0]?.quantidade || 1))}</strong>
                  {respondidos.length > 1 && <span className="text-muted-foreground">— Economia vs. maior preço: {fmtBRL((Math.max(...respondidos.map((f) => f.valor_unit)) - melhorPreco) * (cot.itens[0]?.quantidade || 1))}</span>}
                </div>
              )}
            </div>
          );
        })}
        {!lista.length && (
          <div className="erp-card p-8 text-center text-muted-foreground">Nenhuma cotação encontrada</div>
        )}
      </div>

      {/* Detalhe modal */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{detalhe.id}</h2>
                <p className="text-sm text-muted-foreground">{detalhe.descricao}</p>
              </div>
              <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-muted-foreground">Status</span><p><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COR[detalhe.status]}`}>{detalhe.status}</span></p></div>
              <div><span className="text-xs text-muted-foreground">Solicitação</span><p className="font-medium text-primary">{detalhe.solicitacao}</p></div>
              <div><span className="text-xs text-muted-foreground">Criada em</span><p>{fmtD(detalhe.data_criacao)}</p></div>
              <div><span className="text-xs text-muted-foreground">Validade</span><p>{fmtD(detalhe.validade)}</p></div>
              <div className="col-span-2"><span className="text-xs text-muted-foreground">Fornecedores</span><p>{detalhe.fornecedores.map((f) => f.nome).join(', ')}</p></div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 flex-wrap">
              {detalhe.status === 'Rascunho' && (
                <button type="button" onClick={() => enviarCotacao(detalhe)} className="erp-btn-primary text-xs flex items-center gap-1"><Send size={12} /> Enviar Cotação</button>
              )}
              {detalhe.status === 'Aprovada' && (
                <button type="button" onClick={() => toast.success('Pedido de compra gerado!')} className="erp-btn-primary text-xs flex items-center gap-1">
                  <FileText size={12} /> Gerar Pedido de Compra
                </button>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs ml-auto">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
