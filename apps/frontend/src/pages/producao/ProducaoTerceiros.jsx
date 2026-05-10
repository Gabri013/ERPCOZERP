import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, CheckCircle, XCircle, AlertTriangle, Truck, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_COR = {
  'Aberta':               'bg-blue-100 text-blue-700',
  'Mat. Remetidos':       'bg-teal-100 text-teal-700',
  'Em Produção':          'bg-orange-100 text-orange-700',
  'Produção Concluída':   'bg-purple-100 text-purple-700',
  'NF-e Recebida':        'bg-green-100 text-green-700',
  'Encerrada':            'bg-gray-100 text-gray-500',
  'Cancelada':            'bg-red-100 text-red-700',
};

const PASSOS = ['Aberta', 'Mat. Remetidos', 'Em Produção', 'Produção Concluída', 'NF-e Recebida', 'Encerrada'];


export default function ProducaoTerceiros() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState([]);
  const [matTerceiros, setMatTerceiros] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [aba, setAba] = useState('ordens');
  const [showForm, setShowForm] = useState(false);

  const loadOrdens = useCallback(async () => {
    try {
      const res = await api.get('/api/production/outsourced');
      const d = res.data?.data ?? res.data ?? {};
      setOrdens(Array.isArray(d) ? d : (d.ordens ?? []));
      setMatTerceiros(Array.isArray(d) ? [] : (d.materiais_terceiros ?? []));
    } catch { setOrdens([]); setMatTerceiros([]); }
  }, []);

  useEffect(() => { loadOrdens(); }, [loadOrdens]);

  const lista = useMemo(() => {
    let d = ordens;
    if (filtroStatus !== 'Todos') d = d.filter((o) => o.status === filtroStatus);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((o) => o.id.toLowerCase().includes(q) || o.fornecedor.toLowerCase().includes(q) || o.produto.toLowerCase().includes(q)); }
    return d;
  }, [ordens, filtroStatus, busca]);

  const kpis = useMemo(() => ({
    abertas: ordens.filter((o) => !['Encerrada', 'Cancelada'].includes(o.status)).length,
    em_producao: ordens.filter((o) => o.status === 'Em Produção').length,
    atrasadas: ordens.filter((o) => o.prazo < hoje && !['Encerrada', 'Cancelada'].includes(o.status)).length,
    valor_materiais: matTerceiros.reduce((s, m) => s + (m.valor_total || 0), 0),
  }), [ordens]);

  const avancarStatus = (id) => {
    setOrdens(ordens.map((o) => {
      if (o.id !== id) return o;
      const idx = PASSOS.indexOf(o.status);
      return { ...o, status: idx < PASSOS.length - 1 ? PASSOS[idx + 1] : o.status };
    }));
    toast.success('Status atualizado!');
  };

  const StatusChip = ({ s }) => <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COR[s] || 'bg-muted'}`}>{s}</span>;

  const ProgressBar = ({ status }) => {
    const idx = PASSOS.indexOf(status);
    return (
      <div className="flex items-center gap-0.5">
        {PASSOS.slice(0, -1).map((s, i) => (
          <div key={s} className="flex items-center gap-0.5">
            <div className={`w-2 h-2 rounded-full border ${i <= idx ? 'bg-primary border-primary' : 'bg-white border-border'}`} title={s} />
            {i < PASSOS.length - 2 && <div className={`h-0.5 w-5 ${i < idx ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Truck size={20} className="text-primary" /> Produção em Terceiros</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controle ordens, remessas, produções e devoluções de materiais em poder de terceiros</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Nova OPT
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ordens em aberto',            value: kpis.abertas,           color: 'text-primary' },
          { label: 'Em produção no fornecedor',    value: kpis.em_producao,       color: 'text-orange-600' },
          { label: 'Ordens atrasadas',             value: kpis.atrasadas,         color: kpis.atrasadas > 0 ? 'text-red-600' : '' },
          { label: 'Mat. em poder de terceiros',   value: fmtBRL(kpis.valor_materiais), color: 'text-primary' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {[
          { id: 'ordens', label: 'Ordens de Produção' },
          { id: 'materiais', label: 'Mat. em Poder de Terceiros' },
        ].map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA ORDENS */}
      {aba === 'ordens' && (
        <div className="space-y-3">
          {/* Filtros */}
          <div className="erp-card p-2 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="erp-input pl-7 text-xs w-full" placeholder="OPT, fornecedor, produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['Todos', 'Em Produção', 'Mat. Remetidos', 'Produção Concluída'].map((s) => (
                <button key={s} type="button" onClick={() => setFiltroStatus(s)}
                  className={`px-2.5 py-1 rounded text-xs ${filtroStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Cards de ordens */}
          <div className="space-y-3">
            {lista.map((opt) => {
              const atrasada = opt.prazo < hoje && !['Encerrada', 'Cancelada'].includes(opt.status);
              const custo_total = opt.valor_servico + opt.custo_materiais;
              const pct_idx = PASSOS.indexOf(opt.status);
              return (
                <div key={opt.id} className={`erp-card p-0 overflow-hidden ${atrasada ? 'border-red-300' : ''}`}>
                  <div className="p-4 flex items-start gap-4 justify-between border-b border-border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold text-primary">{opt.id}</span>
                        <StatusChip s={opt.status} />
                        {atrasada && <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium"><AlertTriangle size={10} /> Atrasada</span>}
                      </div>
                      <p className="font-medium mt-0.5">{opt.produto}</p>
                      <p className="text-xs text-muted-foreground">{opt.fornecedor}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>Abertura: <strong>{fmtD(opt.data_abertura)}</strong></span>
                        <span className={atrasada ? 'text-red-600 font-bold' : ''}>Prazo: <strong>{fmtD(opt.prazo)}</strong></span>
                        {opt.pedido_venda && <span>PV: <strong>{opt.pedido_venda}</strong></span>}
                        {opt.pedido_compra && <span>PC: <strong>{opt.pedido_compra}</strong></span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Custo total</p>
                      <p className="font-bold text-primary">{fmtBRL(custo_total)}</p>
                      <p className="text-[10px] text-muted-foreground">Serviço: {fmtBRL(opt.valor_servico)}</p>
                    </div>
                  </div>

                  {/* Barra progresso */}
                  <div className="px-4 py-2.5 bg-muted/10 border-b border-border/40 flex items-center justify-between">
                    <ProgressBar status={opt.status} />
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{opt.nfe_remessa.length} NF-e remessa</span>
                      <span>{opt.nfe_retorno.length} NF-e retorno</span>
                      <span>{opt.producao.length} reporte(s)</span>
                    </div>
                  </div>

                  {/* Materiais resumo */}
                  <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-border/30">
                    {opt.materiais.map((m, i) => (
                      <div key={i} className="flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded text-[11px]">
                        <Package size={9} className="text-muted-foreground" />
                        <span className="font-mono">{m.codigo}</span>
                        <span className="text-muted-foreground">{m.qtd_remetida} {m.unidade}</span>
                        {m.qtd_sobra > 0 && <span className="text-orange-600">↩ {m.qtd_sobra} sobra</span>}
                      </div>
                    ))}
                  </div>

                  {/* Ações */}
                  <div className="px-4 py-2.5 flex items-center gap-2">
                    <button type="button" onClick={() => navigate(`/producao/terceiros/${opt.id}`, { state: { opt } })}
                      className="erp-btn-primary text-xs flex items-center gap-1.5">
                      <Eye size={12} /> Abrir Ordem
                    </button>
                    {!['Encerrada', 'Cancelada'].includes(opt.status) && (
                      <button type="button" onClick={() => avancarStatus(opt.id)} className="erp-btn-ghost text-xs flex items-center gap-1.5">
                        <CheckCircle size={12} /> Avançar Status
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!lista.length && <div className="erp-card p-8 text-center text-muted-foreground">Nenhuma ordem encontrada</div>}
          </div>
        </div>
      )}

      {/* ABA MATERIAIS EM PODER DE TERCEIROS */}
      {aba === 'materiais' && (
        <div className="space-y-3">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700 flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>Materiais remetidos para fornecedores que ainda não retornaram. Controle o saldo em poder de terceiros integrado ao faturamento.</span>
          </div>

          <div className="erp-card overflow-x-auto">
            <div className="px-4 py-2 bg-muted/20 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold">Estoque em Poder de Terceiros</span>
              <span className="text-xs text-muted-foreground">Total: {fmtBRL(matTerceiros.reduce((s, m) => s + (m.valor_total || 0), 0))}</span>
            </div>
            <table className="erp-table w-full min-w-[700px]">
              <thead>
                <tr>
                  <th>Fornecedor</th><th>Material</th><th>Descrição</th>
                  <th>OPT</th><th>Remessa</th><th>Dias</th>
                  <th className="text-right">Qtd</th><th className="text-right">Valor Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {matTerceiros.map((m, i) => (
                  <tr key={i} className={m.dias_posse > 30 ? 'bg-red-50/40' : ''}>
                    <td className="font-medium text-xs">{m.fornecedor}</td>
                    <td className="font-mono text-xs">{m.codigo}</td>
                    <td>{m.descricao}</td>
                    <td className="text-primary font-semibold">{m.opt}</td>
                    <td className="text-muted-foreground">{fmtD(m.data_remessa)}</td>
                    <td className={`text-center font-medium ${m.dias_posse > 30 ? 'text-red-600' : m.dias_posse > 15 ? 'text-orange-600' : ''}`}>{m.dias_posse}d</td>
                    <td className="text-right font-medium">{m.qtd} {m.unidade}</td>
                    <td className="text-right font-bold text-primary">{fmtBRL(m.valor_total)}</td>
                    <td>
                      <button type="button" onClick={() => navigate(`/producao/terceiros/${m.opt}`)} className="text-xs text-primary hover:underline">Ver OPT</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={7} className="px-3 py-2 text-xs">Total em poder de terceiros</td>
                  <td className="px-3 py-2 text-right text-primary">{fmtBRL(matTerceiros.reduce((s, m) => s + (m.valor_total || 0), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nova OPT */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Nova Ordem de Produção em Terceiros</h2>
              <button type="button" onClick={() => setShowForm(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <label className="erp-label">Fornecedor / Terceiro *</label>
                <input className="erp-input w-full" placeholder="Selecione ou digite o fornecedor" />
              </div>
              <div className="col-span-2">
                <label className="erp-label">Produto / Serviço *</label>
                <input className="erp-input w-full" placeholder="Ex: Chapas cortadas a laser" />
              </div>
              <div>
                <label className="erp-label">Pedido de Compra (Serviço)</label>
                <input className="erp-input w-full font-mono" placeholder="PC-2025-..." />
              </div>
              <div>
                <label className="erp-label">Pedido de Venda vinculado</label>
                <input className="erp-input w-full font-mono" placeholder="PV-2025-..." />
              </div>
              <div>
                <label className="erp-label">Valor do Serviço (R$)</label>
                <input type="number" step="0.01" className="erp-input w-full" />
              </div>
              <div>
                <label className="erp-label">Prazo</label>
                <input type="date" className="erp-input w-full" />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={() => { setShowForm(false); toast.success('OPT criada!'); }} className="erp-btn-primary">Criar OPT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
