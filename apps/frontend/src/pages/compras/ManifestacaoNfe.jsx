import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, RefreshCw, CheckCircle, XCircle, AlertCircle, Eye, ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';

const STATUS_MANIFES = {
  'Pendente':                  { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  'Ciência da Operação':       { color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  'Confirmado':                { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  'Desconhecido':              { color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400' },
  'Op. Não Realizada':         { color: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
};

export default function ManifestacaoNfe() {
  const [nfes, setNfes] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/api/purchases/manifestation');
      setNfes(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar manifestações NF-e');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(false);

  const lista = useMemo(() => {
    let d = nfes;
    if (filtroStatus !== 'Todos') d = d.filter((n) => n.status === filtroStatus);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((n) => n.fornecedor.toLowerCase().includes(q) || n.nfe_num.includes(q) || n.chave.includes(q)); }
    return d;
  }, [nfes, filtroStatus, busca]);

  const kpis = useMemo(() => ({
    pendentes: nfes.filter((n) => n.status === 'Pendente').length,
    confirmadas: nfes.filter((n) => n.status === 'Confirmado').length,
    total: nfes.length,
    valor_pendente: nfes.filter((n) => n.status === 'Pendente').reduce((s, n) => s + n.valor, 0),
  }), [nfes]);

  const manifestar = (id, acao) => {
    setNfes(nfes.map((n) => n.id === id ? { ...n, status: acao } : n));
    setDetalhe((p) => p?.id === id ? { ...p, status: acao } : p);
    toast.success(`Manifestação registrada: ${acao}`);
  };

  const sincronizar = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); toast.success('NF-es sincronizadas com a SEFAZ!'); }, 2000);
  };

  const Chip = ({ status }) => {
    const c = STATUS_MANIFES[status] || STATUS_MANIFES['Pendente'];
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${c.color}`}>{status}</span>;
  };

  const ACOES_MANIFES = [
    { label: 'Ciência da Operação', status: 'Ciência da Operação', desc: 'Declara que tomou ciência da emissão da NF-e', color: 'text-blue-600 hover:bg-blue-50' },
    { label: 'Confirmar Operação', status: 'Confirmado', desc: 'Confirma que a operação comercial foi realizada', color: 'text-green-600 hover:bg-green-50' },
    { label: 'Operação Desconhecida', status: 'Desconhecido', desc: 'Declara que não reconhece esta operação', color: 'text-gray-600 hover:bg-gray-50' },
    { label: 'Operação Não Realizada', status: 'Op. Não Realizada', desc: 'Declara que a operação não foi realizada', color: 'text-red-600 hover:bg-red-50' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Manifestação de NF-e (Notas Destinadas)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Notas fiscais emitidas por terceiros contra sua empresa</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={sincronizar} disabled={loading}
            className="erp-btn-ghost flex items-center gap-1.5 text-xs" title="Sincronizar com SEFAZ">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {loading ? 'Sincronizando...' : 'Sincronizar SEFAZ'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total recebidas', value: kpis.total },
          { label: 'Pendentes de manifestação', value: kpis.pendentes, color: kpis.pendentes > 0 ? 'text-yellow-600' : '' },
          { label: 'Confirmadas', value: kpis.confirmadas, color: 'text-green-600' },
          { label: 'Valor pendente', value: fmtBRL(kpis.valor_pendente), color: 'text-primary' },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3">
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
            <p className={`text-base font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {kpis.pendentes > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-700">
          <AlertCircle size={15} /><span><strong>{kpis.pendentes} NF-e(s)</strong> aguardando manifestação na SEFAZ.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="erp-card p-3 flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Fornecedor, NF-e, chave de acesso..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['Todos', 'Pendente', 'Confirmado', 'Ciência da Operação', 'Desconhecido'].map((s) => (
            <button key={s} type="button" onClick={() => setFiltroStatus(s)}
              className={`px-2.5 py-1 rounded text-xs ${filtroStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full text-xs min-w-[900px]">
          <thead>
            <tr>
              <th>Fornecedor</th><th>CNPJ Emit.</th><th>NF-e</th><th>Emissão</th>
              <th>Valor</th><th>Status Manifestação</th><th>Doc. Entrada</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((n) => (
              <tr key={n.id} className={`hover:bg-muted/30 ${n.status === 'Pendente' ? 'bg-yellow-50/30' : ''}`}>
                <td className="font-medium">{n.fornecedor}</td>
                <td className="font-mono text-muted-foreground text-[10px]">{n.cnpj_emit}</td>
                <td className="font-mono text-muted-foreground">Nº {n.nfe_num} / Série {n.serie}</td>
                <td className="text-muted-foreground">{fmtD(n.data_emissao)}</td>
                <td className="font-medium">{fmtBRL(n.valor)}</td>
                <td><Chip status={n.status} /></td>
                <td>
                  {n.doc_entrada
                    ? <span className="text-primary font-medium">{n.doc_entrada}</span>
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    <button type="button" onClick={() => setDetalhe(n)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={12} /></button>
                    {n.status === 'Pendente' && (
                      <>
                        <button type="button" onClick={() => manifestar(n.id, 'Ciência da Operação')}
                          className="text-[10px] text-blue-600 hover:underline">Ciência</button>
                        <button type="button" onClick={() => manifestar(n.id, 'Confirmado')}
                          className="text-[10px] text-green-600 hover:underline">Confirmar</button>
                      </>
                    )}
                    {n.status === 'Confirmado' && !n.doc_entrada && (
                      <button type="button" onClick={() => { setNfes(nfes.map((x) => x.id === n.id ? { ...x, doc_entrada: `DE-2025-${String(Date.now()).slice(-4)}` } : x)); toast.success('Documento de entrada gerado!'); }}
                        className="text-[10px] text-teal-600 hover:underline">Gerar Doc.</button>
                    )}
                    <button type="button" onClick={() => toast.info('Baixando XML...')} className="p-1 rounded hover:bg-muted text-muted-foreground"><Download size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={8} className="text-center py-6 text-muted-foreground">Nenhuma NF-e encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal detalhe e manifestação */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">NF-e {detalhe.nfe_num}</h2>
                <p className="text-sm text-muted-foreground">{detalhe.fornecedor}</p>
              </div>
              <div className="flex items-center gap-2">
                <Chip status={detalhe.status} />
                <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} /></button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Fornecedor', value: detalhe.fornecedor },
                { label: 'CNPJ Emitente', value: detalhe.cnpj_emit },
                { label: 'Número NF-e', value: detalhe.nfe_num },
                { label: 'Série', value: detalhe.serie },
                { label: 'Data Emissão', value: fmtD(detalhe.data_emissao) },
                { label: 'Valor Total', value: fmtBRL(detalhe.valor) },
              ].map((f) => (
                <div key={f.label}><span className="text-xs text-muted-foreground">{f.label}</span><p className="font-medium">{f.value}</p></div>
              ))}
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">Chave de Acesso</span>
                <p className="font-mono text-[10px] break-all bg-muted/30 p-2 rounded mt-1">{detalhe.chave}</p>
              </div>
            </div>

            {/* Ações de manifestação */}
            {detalhe.status === 'Pendente' && (
              <div className="px-4 pb-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Manifestar Destinatário</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ACOES_MANIFES.map((a) => (
                    <button key={a.label} type="button"
                      onClick={() => { manifestar(detalhe.id, a.status); setDetalhe(null); }}
                      className={`text-xs p-2 rounded-lg border border-border text-left hover:border-transparent transition-colors ${a.color}`}>
                      <p className="font-medium">{a.label}</p>
                      <p className="text-[10px] opacity-75 mt-0.5">{a.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => toast.info('Baixando XML...')} className="erp-btn-ghost flex items-center gap-1 text-xs"><Download size={12} /> Baixar XML</button>
              {detalhe.status === 'Confirmado' && !detalhe.doc_entrada && (
                <button type="button" onClick={() => { setNfes(nfes.map((n) => n.id === detalhe.id ? { ...n, doc_entrada: `DE-${Date.now()}` } : n)); setDetalhe(null); toast.success('Documento de entrada gerado!'); }}
                  className="erp-btn-primary text-xs">Gerar Documento de Entrada</button>
              )}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
