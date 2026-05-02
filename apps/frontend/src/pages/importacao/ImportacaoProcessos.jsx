import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, CheckCircle, XCircle, AlertTriangle, Globe, Ship, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtUSD = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const STATUS_COR = {
  'Pedido Realizado':     'bg-blue-100 text-blue-700',
  'Em Trânsito':          'bg-teal-100 text-teal-700',
  'Chegou ao Porto':      'bg-yellow-100 text-yellow-700',
  'DI Registrada':        'bg-orange-100 text-orange-700',
  'DI Desembaraçada':     'bg-purple-100 text-purple-700',
  'NF-e Emitida':         'bg-green-100 text-green-700',
  'Concluído':            'bg-gray-100 text-gray-500',
  'Cancelado':            'bg-red-100 text-red-700',
};

const PASSOS_FLOW = ['Pedido Realizado', 'Em Trânsito', 'Chegou ao Porto', 'DI Registrada', 'DI Desembaraçada', 'NF-e Emitida', 'Concluído'];

export default function ImportacaoProcessos() {
  const navigate = useNavigate();
  const [processos, setProcessos] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/api/purchases/import');
      setProcessos(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar processos de importação');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [detalhe, setDetalhe] = useState(null);

  const lista = useMemo(() => {
    let d = processos;
    if (filtroStatus !== 'Todos') d = d.filter((p) => p.status === filtroStatus);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((p) => p.id.toLowerCase().includes(q) || p.fornecedor_ext.toLowerCase().includes(q) || p.num_di?.includes(q)); }
    return d;
  }, [processos, filtroStatus, busca]);

  const kpis = useMemo(() => ({
    em_aberto: processos.filter((p) => !['NF-e Emitida', 'Concluído', 'Cancelado'].includes(p.status)).length,
    valor_aberto_usd: processos.filter((p) => !['NF-e Emitida', 'Concluído', 'Cancelado'].includes(p.status)).reduce((s, p) => s + p.valor_fob_usd, 0),
    aguardando_di: processos.filter((p) => p.status === 'Chegou ao Porto').length,
    em_transito: processos.filter((p) => p.status === 'Em Trânsito').length,
  }), [processos]);

  const avancar = (id) => {
    setProcessos(processos.map((p) => {
      if (p.id !== id) return p;
      const idx = PASSOS_FLOW.indexOf(p.status);
      const novoStatus = idx < PASSOS_FLOW.length - 1 ? PASSOS_FLOW[idx + 1] : p.status;
      return { ...p, status: novoStatus };
    }));
    toast.success('Status do processo atualizado!');
  };

  const StatusChip = ({ status }) => (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COR[status] || 'bg-muted'}`}>{status}</span>
  );

  const ProgressFlow = ({ status }) => {
    const idx = PASSOS_FLOW.indexOf(status);
    return (
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {PASSOS_FLOW.slice(0, -1).map((s, i) => (
          <div key={s} className="flex items-center gap-0.5 shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${i <= idx ? 'bg-primary border-primary' : 'bg-white border-border'}`} title={s} />
            {i < PASSOS_FLOW.length - 2 && <div className={`h-0.5 w-4 ${i < idx ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Globe size={20} className="text-primary" /> Importação de Produtos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controle total do processo de importação — DI, rateio e NF-e de entrada</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Novo Processo
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Processos em aberto', value: kpis.em_aberto, color: 'text-primary' },
          { label: 'Em trânsito', value: kpis.em_transito, color: 'text-teal-600' },
          { label: 'Aguardando DI', value: kpis.aguardando_di, color: kpis.aguardando_di > 0 ? 'text-orange-600' : '' },
          { label: 'Valor em aberto (FOB)', value: fmtUSD(kpis.valor_aberto_usd), color: 'text-primary' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="erp-card p-3 flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Processo, fornecedor, DI..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['Todos', 'Em Trânsito', 'Chegou ao Porto', 'DI Registrada', 'DI Desembaraçada'].map((s) => (
            <button key={s} type="button" onClick={() => setFiltroStatus(s)}
              className={`px-2.5 py-1 rounded text-xs ${filtroStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Processos em cards */}
      <div className="space-y-3">
        {lista.map((p) => {
          const valorBRL = (p.valor_fob_usd + p.valor_frete_usd + p.valor_seguro_usd) * p.taxa_cambio;
          return (
            <div key={p.id} className="erp-card p-0 overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-4 border-b border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-primary">{p.id}</span>
                    <StatusChip status={p.status} />
                    <span className="text-xs text-muted-foreground">{p.incoterm}</span>
                  </div>
                  <p className="font-medium mt-0.5">{p.fornecedor_ext}</p>
                  <p className="text-xs text-muted-foreground">{p.pais_origem} · {p.produtos.length} produto(s)</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Valor FOB</p>
                  <p className="font-bold text-primary">{fmtUSD(p.valor_fob_usd)}</p>
                  <p className="text-xs text-muted-foreground">≈ {fmtBRL(valorBRL)}</p>
                </div>
              </div>

              {/* Linha de progresso */}
              <div className="px-4 py-3 flex items-center justify-between gap-3 bg-muted/10">
                <ProgressFlow status={p.status} />
                <div className="flex gap-2 shrink-0">
                  {p.num_di && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">{p.num_di}</span>}
                  {p.num_nfe && <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded">NF-e {p.num_nfe}</span>}
                </div>
              </div>

              {/* Datas */}
              <div className="px-4 py-2.5 flex items-center gap-4 text-xs border-t border-border/40">
                <span className="text-muted-foreground">Pedido: <strong>{fmtD(p.data_pedido)}</strong></span>
                <span className="text-muted-foreground">Embarque: <strong>{fmtD(p.data_embarque)}</strong></span>
                <span className={`${p.data_chegada_prevista < hoje && !['NF-e Emitida', 'Concluído'].includes(p.status) ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                  Chegada prev.: <strong>{fmtD(p.data_chegada_prevista)}</strong>
                </span>
                {p.data_di_registro && <span className="text-muted-foreground">DI: <strong>{fmtD(p.data_di_registro)}</strong></span>}
              </div>

              {/* Ações */}
              <div className="px-4 py-2.5 flex items-center gap-2 border-t border-border/40">
                <button type="button" onClick={() => navigate(`/importacao/di/${p.id}`, { state: { processo: p } })}
                  className="erp-btn-primary text-xs flex items-center gap-1.5">
                  <FileText size={12} /> Abrir Processo
                </button>
                {PASSOS_FLOW.indexOf(p.status) < PASSOS_FLOW.length - 1 && (
                  <button type="button" onClick={() => avancar(p.id)} className="erp-btn-ghost text-xs flex items-center gap-1">
                    <CheckCircle size={12} /> Avançar Status
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!lista.length && <div className="erp-card p-8 text-center text-muted-foreground">Nenhum processo de importação encontrado</div>}
      </div>

      {/* Modal novo processo */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Novo Processo de Importação</h2>
              <button type="button" onClick={() => setShowForm(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2"><label className="erp-label">Fornecedor Exterior *</label><input className="erp-input w-full" placeholder="Nome do fornecedor" /></div>
              <div><label className="erp-label">País de Origem</label><input className="erp-input w-full" placeholder="Ex: Alemanha" /></div>
              <div><label className="erp-label">Moeda</label><select className="erp-input w-full"><option>USD</option><option>EUR</option><option>GBP</option><option>JPY</option><option>CNY</option></select></div>
              <div><label className="erp-label">Incoterm</label><select className="erp-input w-full"><option>FOB</option><option>CIF</option><option>CFR</option><option>EXW</option><option>DDP</option></select></div>
              <div><label className="erp-label">Pedido de Compra</label><input className="erp-input w-full" placeholder="PC-2025-..." /></div>
              <div><label className="erp-label">Data do Pedido</label><input type="date" className="erp-input w-full" defaultValue={hoje} /></div>
              <div><label className="erp-label">Chegada Prevista</label><input type="date" className="erp-input w-full" /></div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={() => { setShowForm(false); toast.success('Processo de importação criado!'); }} className="erp-btn-primary">Criar Processo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
