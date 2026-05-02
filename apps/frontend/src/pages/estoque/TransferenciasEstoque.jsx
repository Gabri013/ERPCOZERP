import { useState, useMemo } from 'react';
import { Plus, Search, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const fmtDT = (v) => v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const SETORES = ['Almoxarifado Geral', 'Estoque Produção', 'Expedição', 'Qualidade', 'Manutenção', 'Mat. de Terceiros', 'Mat. em Poder Terc.'];

const MOCK = [
  {
    id: 'TE-2025-001', data: addDias(hoje, -5) + 'T09:30:00', origem: 'Almoxarifado Geral', destino: 'Estoque Produção',
    status: 'Concluída', responsavel: 'João S.', obs: 'Separação para OPs da semana',
    itens: [
      { id: 1, codigo: 'MP-CHAPA-316L-3MM', descricao: 'Chapa Inox 316L 3mm', qtd: 120, unidade: 'kg', lote: 'LT-2025-0042' },
      { id: 2, codigo: 'MP-TUBO-1.5',       descricao: 'Tubo Inox 1.5"',       qtd: 12,  unidade: 'm',  lote: 'LT-2025-0039' },
    ],
  },
  {
    id: 'TE-2025-002', data: addDias(hoje, -2) + 'T14:00:00', origem: 'Estoque Produção', destino: 'Qualidade',
    status: 'Concluída', responsavel: 'Maria L.', obs: 'Produtos para inspeção',
    itens: [
      { id: 1, codigo: 'TANK-500L', descricao: 'Tanque Inox 500L', qtd: 2, unidade: 'pc', lote: 'LT-2025-0051' },
    ],
  },
  {
    id: 'TE-2025-003', data: hoje + 'T08:00:00', origem: 'Qualidade', destino: 'Expedição',
    status: 'Pendente', responsavel: 'Ana P.', obs: 'Produtos aprovados na inspeção',
    itens: [
      { id: 1, codigo: 'TANK-500L', descricao: 'Tanque Inox 500L', qtd: 2, unidade: 'pc', lote: 'LT-2025-0051' },
    ],
  },
];

export default function TransferenciasEstoque() {
  const [transferencias, setTransferencias] = useState(MOCK);
  const [busca, setBusca] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [form, setForm] = useState({ origem: 'Almoxarifado Geral', destino: 'Estoque Produção', obs: '', itens: [{ codigo: '', descricao: '', qtd: 1, unidade: 'kg', lote: '' }] });

  const lista = useMemo(() => {
    if (!busca) return transferencias;
    const q = busca.toLowerCase();
    return transferencias.filter((t) => t.id.toLowerCase().includes(q) || t.origem.toLowerCase().includes(q) || t.destino.toLowerCase().includes(q));
  }, [transferencias, busca]);

  const confirmar = (id) => {
    setTransferencias(transferencias.map((t) => t.id === id ? { ...t, status: 'Concluída' } : t));
    toast.success('Transferência confirmada! Estoque atualizado.');
  };

  const criarTransferencia = () => {
    const nova = {
      id: `TE-2025-${String(transferencias.length + 1).padStart(3, '0')}`,
      data: new Date().toISOString(), origem: form.origem, destino: form.destino,
      status: 'Pendente', responsavel: 'Usuário Atual', obs: form.obs,
      itens: form.itens.map((it, i) => ({ id: i + 1, ...it })),
    };
    setTransferencias([nova, ...transferencias]);
    setShowForm(false);
    setForm({ origem: 'Almoxarifado Geral', destino: 'Estoque Produção', obs: '', itens: [{ codigo: '', descricao: '', qtd: 1, unidade: 'kg', lote: '' }] });
    toast.success('Transferência criada!');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Transferências entre Setores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Movimente materiais e produtos entre setores do estoque com rastreabilidade</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="erp-btn-primary flex items-center gap-2"><Plus size={14} /> Nova Transferência</button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Total este mês</p><p className="text-lg font-bold">{transferencias.length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Pendentes</p><p className="text-lg font-bold text-yellow-600">{transferencias.filter((t) => t.status === 'Pendente').length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Concluídas</p><p className="text-lg font-bold text-green-600">{transferencias.filter((t) => t.status === 'Concluída').length}</p></div>
      </div>

      {/* Busca */}
      <div className="erp-card p-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Transferência, setor origem ou destino..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {/* Tabela */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full min-w-[700px]">
          <thead><tr><th>Transferência</th><th>Data/Hora</th><th>Origem</th><th></th><th>Destino</th><th>Responsável</th><th>Itens</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {lista.map((t) => (
              <tr key={t.id}>
                <td className="font-mono font-semibold text-primary">{t.id}</td>
                <td className="text-muted-foreground">{fmtDT(t.data)}</td>
                <td className="font-medium">{t.origem}</td>
                <td className="text-center"><ArrowRight size={13} className="text-muted-foreground" /></td>
                <td className="font-medium">{t.destino}</td>
                <td>{t.responsavel}</td>
                <td className="text-center">{t.itens.length} item(ns)</td>
                <td><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${t.status === 'Concluída' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span></td>
                <td>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setDetalhe(t)} className="text-xs text-primary hover:underline">Ver</button>
                    {t.status === 'Pendente' && <button type="button" onClick={() => confirmar(t.id)} className="text-xs text-green-600 hover:underline">Confirmar</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Nova Transferência de Estoque</h2>
              <button type="button" onClick={() => setShowForm(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Setor Origem *</label>
                  <select className="erp-input w-full" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })}>
                    {SETORES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="erp-label">Setor Destino *</label>
                  <select className="erp-input w-full" value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })}>
                    {SETORES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="erp-label">Observação</label><input className="erp-input w-full" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold">Itens</p>
                  <button type="button" onClick={() => setForm({ ...form, itens: [...form.itens, { codigo: '', descricao: '', qtd: 1, unidade: 'kg', lote: '' }] })} className="text-xs text-primary hover:underline">+ Item</button>
                </div>
                {form.itens.map((it, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 mb-2 text-xs items-end">
                    <div><label className="erp-label">Código</label><input className="erp-input w-full font-mono" value={it.codigo} onChange={(e) => { const f = [...form.itens]; f[i].codigo = e.target.value; setForm({ ...form, itens: f }); }} /></div>
                    <div className="col-span-2"><label className="erp-label">Descrição</label><input className="erp-input w-full" value={it.descricao} onChange={(e) => { const f = [...form.itens]; f[i].descricao = e.target.value; setForm({ ...form, itens: f }); }} /></div>
                    <div><label className="erp-label">Qtd</label><input type="number" min="0" step="0.001" className="erp-input w-full" value={it.qtd} onChange={(e) => { const f = [...form.itens]; f[i].qtd = Number(e.target.value); setForm({ ...form, itens: f }); }} /></div>
                    <div className="flex gap-1">
                      <div className="flex-1"><label className="erp-label">Lote</label><input className="erp-input w-full font-mono text-[10px]" value={it.lote} onChange={(e) => { const f = [...form.itens]; f[i].lote = e.target.value; setForm({ ...form, itens: f }); }} /></div>
                      {form.itens.length > 1 && <button type="button" onClick={() => setForm({ ...form, itens: form.itens.filter((_, j) => j !== i) })} className="mt-4 text-red-400"><XCircle size={14} /></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={criarTransferencia} className="erp-btn-primary text-xs flex items-center gap-1.5"><ArrowRight size={12} /> Criar Transferência</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div><h2 className="font-semibold">{detalhe.id}</h2><p className="text-xs text-muted-foreground">{detalhe.origem} <ArrowRight size={10} className="inline" /> {detalhe.destino} · {fmtDT(detalhe.data)}</p></div>
              <button type="button" onClick={() => setDetalhe(null)}><XCircle size={18} /></button>
            </div>
            <div className="p-4">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted"><th className="p-2 text-left">Código</th><th className="p-2 text-left">Descrição</th><th className="p-2 text-right">Qtd</th><th className="p-2">UN</th><th className="p-2">Lote</th></tr></thead>
                <tbody>{detalhe.itens.map((it) => (
                  <tr key={it.id} className="border-b border-border/30">
                    <td className="p-2 font-mono">{it.codigo}</td>
                    <td className="p-2">{it.descricao}</td>
                    <td className="p-2 text-right font-medium">{it.qtd}</td>
                    <td className="p-2">{it.unidade}</td>
                    <td className="p-2 font-mono text-muted-foreground">{it.lote || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
              {detalhe.obs && <p className="text-xs text-muted-foreground mt-2">Obs: {detalhe.obs}</p>}
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              {detalhe.status === 'Pendente' && <button type="button" onClick={() => { confirmar(detalhe.id); setDetalhe({ ...detalhe, status: 'Concluída' }); }} className="erp-btn-primary text-xs flex items-center gap-1"><CheckCircle size={12} /> Confirmar</button>}
              <button type="button" onClick={() => setDetalhe(null)} className="erp-btn-ghost text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
