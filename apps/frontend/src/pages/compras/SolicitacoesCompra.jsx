import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, CheckCircle, XCircle, ChevronDown, Send, Package, AlertTriangle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_COLOR = {
  'Nova':               'bg-blue-100 text-blue-700',
  'Em Cotação':         'bg-yellow-100 text-yellow-700',
  'Cotação Aprovada':   'bg-teal-100 text-teal-700',
  'Pedido Gerado':      'bg-green-100 text-green-700',
  'Cancelada':          'bg-red-100 text-red-700',
};

const ORIGEM_COLOR = {
  'MRP': 'bg-purple-100 text-purple-700',
  'Manual': 'bg-gray-100 text-gray-600',
  'Plano de Produção': 'bg-orange-100 text-orange-700',
};

const PRODUTOS = ['Chapa Inox 304 2mm', 'Chapa Inox 316L 1.5mm', 'Tubo Inox 1" SCH10', 'Aço Carbono Barra', 'Válvula Borboleta 2"', 'Parafuso M8 Inox'];
const UNIDADES = ['kg', 'pç', 'barra', 'chapa', 'm', 'cx'];

const EMPTY_FORM = { produto: '', descricao: '', quantidade: '', unidade: 'kg', necessidade: addDias(hoje, 7), origem: 'Manual', prioridade: 'Normal', solicitante: '', observacoes: '' };

export default function SolicitacoesCompra() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('Todas');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/purchases/requests');
      setDados(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar solicitações de compra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  const [busca, setBusca] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detalhe, setDetalhe] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const totais = useMemo(() => ({
    Todas: dados.length,
    Novas: dados.filter((d) => d.status === 'Nova').length,
    'Em Cotação': dados.filter((d) => d.status === 'Em Cotação').length,
    'Pedido Gerado': dados.filter((d) => d.status === 'Pedido Gerado').length,
    Canceladas: dados.filter((d) => d.status === 'Cancelada').length,
  }), [dados]);

  const lista = useMemo(() => {
    let d = dados;
    if (aba !== 'Todas') {
      const map = { Novas: 'Nova', 'Em Cotação': 'Em Cotação', 'Pedido Gerado': 'Pedido Gerado', Canceladas: 'Cancelada' };
      d = d.filter((r) => r.status === map[aba]);
    }
    if (busca) { const q = busca.toLowerCase(); d = d.filter((r) => r.produto.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.solicitante?.toLowerCase().includes(q)); }
    return d;
  }, [dados, aba, busca]);

  const kpis = useMemo(() => ({
    abertas: dados.filter((d) => ['Nova', 'Em Cotação', 'Cotação Aprovada'].includes(d.status)).length,
    urgentes: dados.filter((d) => d.prioridade === 'Urgente' || d.prioridade === 'Alta').length,
    valor_total: dados.reduce((s, r) => s + Number(r.valor_estimado || 0), 0),
    atrasadas: dados.filter((d) => d.necessidade < hoje && d.status !== 'Pedido Gerado' && d.status !== 'Cancelada').length,
  }), [dados]);

  const avancar = (id, novoStatus) => {
    setDados(dados.map((d) => d.id === id ? { ...d, status: novoStatus } : d));
    setDetalhe(null);
    toast.success(`Status atualizado: ${novoStatus}`);
  };

  const salvar = () => {
    if (!form.produto || !form.quantidade) return toast.error('Preencha produto e quantidade');
    const novo = { ...form, id: `SC-2025-${String(dados.length + 1).padStart(3, '0')}`, status: 'Nova', quantidade: Number(form.quantidade), valor_estimado: 0 };
    setDados([novo, ...dados]);
    setShowForm(false); setForm(EMPTY_FORM);
    toast.success('Solicitação criada!');
  };

  const StatusChip = ({ status }) => (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
  );
  const OrigemChip = ({ origem }) => (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ORIGEM_COLOR[origem] || 'bg-gray-100 text-gray-500'}`}>{origem}</span>
  );
  const PrioChip = ({ p }) => (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p === 'Urgente' ? 'bg-red-100 text-red-700' : p === 'Alta' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{p}</span>
  );

  const ABAS = ['Todas', 'Novas', 'Em Cotação', 'Pedido Gerado', 'Canceladas'];
  const PROX_STATUS = { 'Nova': 'Em Cotação', 'Em Cotação': 'Cotação Aprovada', 'Cotação Aprovada': 'Pedido Gerado' };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Solicitações de Compra</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Integrado ao plano de produção e MRP</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => toast.info('Gerando sugestões do MRP...')} className="erp-btn-ghost flex items-center gap-1.5 text-xs">
            <Zap size={13} /> Sugestões MRP
          </button>
          <button type="button" onClick={() => setShowForm(true)} className="erp-btn-primary flex items-center gap-2">
            <Plus size={14} /> Nova Solicitação
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Abertas', value: kpis.abertas, color: 'text-primary' },
          { label: 'Alta Prioridade', value: kpis.urgentes, color: kpis.urgentes > 0 ? 'text-orange-600' : '' },
          { label: 'Atrasadas', value: kpis.atrasadas, color: kpis.atrasadas > 0 ? 'text-red-600' : '' },
          { label: 'Valor Estimado', value: fmtBRL(kpis.valor_total), color: 'text-primary' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Alerta de urgentes */}
      {kpis.atrasadas > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle size={15} />
          <span><strong>{kpis.atrasadas} solicitação(ões)</strong> com data de necessidade vencida.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="erp-card p-3 flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Produto, código, solicitante..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <input type="date" className="erp-input text-xs" placeholder="Necessidade até" />
        <button type="button" className="erp-btn-primary text-xs px-4">Pesquisar</button>
        <button type="button" onClick={() => setBusca('')} className="erp-btn-ghost text-xs">Exibir todos</button>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a} type="button" onClick={() => setAba(a)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a} <span className="ml-1 text-[10px] bg-muted px-1.5 rounded-full">{totais[a] || 0}</span>
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full text-xs min-w-[900px]">
          <thead>
            <tr>
              <th className="w-8"><input type="checkbox" /></th>
              <th>Código</th><th>Produto</th><th>Quantidade</th><th>Unidade</th>
              <th>Necessidade</th><th>Origem</th><th>Prioridade</th>
              <th>Solicitante</th><th>Status</th><th>Valor Est.</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => {
              const atrasada = r.necessidade < hoje && !['Pedido Gerado', 'Cancelada'].includes(r.status);
              return (
                <tr key={r.id} className={`cursor-pointer hover:bg-muted/30 ${atrasada ? 'bg-red-50/40' : ''}`} onClick={() => setDetalhe(r)}>
                  <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                  <td className="font-mono font-medium text-primary">{r.id}</td>
                  <td>
                    <div className="font-medium">{r.produto}</div>
                    {r.descricao && <div className="text-[10px] text-muted-foreground">{r.descricao}</div>}
                  </td>
                  <td className="font-medium text-right">{r.quantidade}</td>
                  <td className="text-muted-foreground">{r.unidade}</td>
                  <td className={atrasada ? 'font-bold text-red-600' : 'text-muted-foreground'}>{fmtD(r.necessidade)}</td>
                  <td><OrigemChip origem={r.origem} /></td>
                  <td><PrioChip p={r.prioridade} /></td>
                  <td className="text-muted-foreground">{r.solicitante}</td>
                  <td><StatusChip status={r.status} /></td>
                  <td className="font-medium">{r.valor_estimado ? fmtBRL(r.valor_estimado) : '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setDetalhe(r)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={12} /></button>
                      {PROX_STATUS[r.status] && (
                        <button type="button" onClick={() => avancar(r.id, PROX_STATUS[r.status])}
                          className="p-1 rounded hover:bg-green-50 text-green-600" title={`Avançar para: ${PROX_STATUS[r.status]}`}><CheckCircle size={12} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!lista.length && <tr><td colSpan={12} className="text-center py-8 text-muted-foreground">Nenhuma solicitação encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{detalhe.id}</h2>
                <StatusChip status={detalhe.status} />
              </div>
              <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Produto', value: detalhe.produto },
                { label: 'Quantidade', value: `${detalhe.quantidade} ${detalhe.unidade}` },
                { label: 'Necessidade', value: fmtD(detalhe.necessidade) },
                { label: 'Origem', value: detalhe.origem },
                { label: 'Prioridade', value: detalhe.prioridade },
                { label: 'Solicitante', value: detalhe.solicitante },
                { label: 'Valor Estimado', value: fmtBRL(detalhe.valor_estimado) },
              ].map((f) => (
                <div key={f.label}>
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                  <p className="font-medium">{f.value}</p>
                </div>
              ))}
              {detalhe.observacoes && (
                <div className="col-span-2"><span className="text-xs text-muted-foreground">Observações</span><p>{detalhe.observacoes}</p></div>
              )}
            </div>
            {/* Workflow */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-1 flex-wrap">
                {['Nova', 'Em Cotação', 'Cotação Aprovada', 'Pedido Gerado'].map((s, i, arr) => (
                  <div key={s} className="flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${detalhe.status === s ? STATUS_COLOR[s] : 'bg-muted text-muted-foreground'}`}>{s}</span>
                    {i < arr.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex flex-wrap gap-2">
              {PROX_STATUS[detalhe.status] && (
                <button type="button" onClick={() => avancar(detalhe.id, PROX_STATUS[detalhe.status])} className="erp-btn-primary flex items-center gap-1.5 text-xs">
                  <CheckCircle size={13} /> Avançar para {PROX_STATUS[detalhe.status]}
                </button>
              )}
              {detalhe.status === 'Em Cotação' && (
                <button type="button" onClick={() => toast.info('Criando cotação de compra...')} className="erp-btn-ghost flex items-center gap-1.5 text-xs">
                  <Send size={13} /> Criar Cotação
                </button>
              )}
              {['Nova', 'Em Cotação'].includes(detalhe.status) && (
                <button type="button" onClick={() => { avancar(detalhe.id, 'Cancelada'); }} className="text-xs text-red-600 hover:underline">Cancelar Solicitação</button>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs ml-auto">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nova solicitação */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Nova Solicitação de Compra</h2>
              <button type="button" onClick={() => setShowForm(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="erp-label">Produto *</label>
                <input className="erp-input w-full" list="produtos-list" value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} placeholder="Digite ou selecione o produto..." />
                <datalist id="produtos-list">{PRODUTOS.map((p) => <option key={p} value={p} />)}</datalist>
              </div>
              <div className="col-span-2">
                <label className="erp-label">Descrição</label>
                <input className="erp-input w-full" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <label className="erp-label">Quantidade *</label>
                <input type="number" min="0.01" step="0.01" className="erp-input w-full" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
              </div>
              <div>
                <label className="erp-label">Unidade</label>
                <select className="erp-input w-full" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}>
                  {UNIDADES.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Data de necessidade</label>
                <input type="date" className="erp-input w-full" value={form.necessidade} onChange={(e) => setForm({ ...form, necessidade: e.target.value })} />
              </div>
              <div>
                <label className="erp-label">Prioridade</label>
                <select className="erp-input w-full" value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}>
                  {['Normal', 'Alta', 'Urgente'].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Origem</label>
                <select className="erp-input w-full" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })}>
                  <option>Manual</option><option>MRP</option><option>Plano de Produção</option>
                </select>
              </div>
              <div>
                <label className="erp-label">Solicitante</label>
                <input className="erp-input w-full" value={form.solicitante} onChange={(e) => setForm({ ...form, solicitante: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="erp-label">Observações</label>
                <textarea rows={2} className="erp-input w-full resize-none" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={salvar} className="erp-btn-primary">Salvar Solicitação</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
