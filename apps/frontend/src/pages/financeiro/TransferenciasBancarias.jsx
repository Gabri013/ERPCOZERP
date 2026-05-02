import { useState, useMemo } from 'react';
import { Plus, Search, Eye, ArrowRight, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtD = (v) => v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—';
const hoje = new Date().toISOString().split('T')[0];
const addDias = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const CONTAS = ['Banco do Brasil', 'SICOOB', 'Itaú', 'Bradesco'];
const EMPRESAS = ['COZINCA INOX LTDA', 'COZINCA INOX LTDA 2'];

const MOCK = [
  { id: 79, empresa_orig: 'COZINCA INOX LTDA', banco_orig: 'Banco do Brasil', empresa_dest: 'COZINCA INOX LTDA', banco_dest: 'Bradesco', data: addDias(hoje, -30), valor_orig: 14.64, valor_dest: 14.64, descricao: 'DÉBITO SERVIÇO COBRANÇA', pessoa: '000022 - Empresa Sucesso Ltda', classif: 'Transferência' },
  { id: 76, empresa_orig: 'COZINCA INOX LTDA', banco_orig: 'Bradesco', empresa_dest: 'COZINCA INOX LTDA 2', banco_dest: 'Itaú', data: addDias(hoje, -10), valor_orig: 150, valor_dest: 150, descricao: '—', pessoa: '000022 - Empresa Sucesso Ltda', classif: 'Transferência' },
  { id: 71, empresa_orig: 'COZINCA INOX LTDA', banco_orig: 'Bradesco', empresa_dest: 'COZINCA INOX LTDA 2', banco_dest: 'Itaú', data: addDias(hoje, -12), valor_orig: 2500, valor_dest: 2500, descricao: '—', pessoa: '000022 - Empresa Sucesso Ltda', classif: 'Transferência' },
  { id: 44, empresa_orig: 'COZINCA INOX LTDA', banco_orig: 'José Silva', empresa_dest: 'COZINCA INOX LTDA', banco_dest: 'Fátima Regina', data: addDias(hoje, -100), valor_orig: 500, valor_dest: 500, descricao: '—', pessoa: '000022 - Empresa Sucesso Ltda', classif: 'Transferência' },
  { id: 39, empresa_orig: 'COZINCA INOX LTDA', banco_orig: 'Banco do Brasil', empresa_dest: 'COZINCA INOX LTDA', banco_dest: 'Bradesco', data: addDias(hoje, -120), valor_orig: 2000, valor_dest: 2000, descricao: 'Transferência da conta E01 para Bradesco', pessoa: '000022 - Empresa Sucesso Ltda', classif: 'Transferência' },
];

const EMPTY = { empresa_orig: 'COZINCA INOX LTDA', banco_orig: '', empresa_dest: '', banco_dest: '', data: hoje, valor_orig: '', descricao: '', pessoa: '' };

export default function TransferenciasBancarias() {
  const [dados, setDados] = useState(MOCK);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState(null);

  const lista = useMemo(() => {
    if (!busca) return dados;
    const q = busca.toLowerCase();
    return dados.filter((d) => d.descricao?.toLowerCase().includes(q) || d.banco_orig.toLowerCase().includes(q) || d.banco_dest.toLowerCase().includes(q));
  }, [dados, busca]);

  const salvar = () => {
    if (!form.banco_orig || !form.banco_dest || !form.valor_orig) return toast.error('Preencha origem, destino e valor');
    const nova = { ...form, id: Date.now(), empresa_orig: form.empresa_orig || 'COZINCA INOX LTDA', empresa_dest: form.empresa_dest || 'COZINCA INOX LTDA', valor_dest: form.valor_orig, classif: 'Transferência' };
    setDados([nova, ...dados]);
    setShowForm(false);
    setForm(EMPTY);
    toast.success('Transferência registrada!');
  };

  const totalEntradas = dados.reduce((s, d) => s + Number(d.valor_orig || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Transferências Bancárias</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Controle de transferências entre contas</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Criar transferência
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Total registrado</p><p className="text-base font-bold text-primary">{fmtBRL(totalEntradas)}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Transferências</p><p className="text-base font-bold">{dados.length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">No mês atual</p><p className="text-base font-bold text-green-600">{dados.filter((d) => d.data?.startsWith(hoje.slice(0, 7))).length}</p></div>
      </div>

      {/* Pesquisa avançada */}
      <div className="erp-card p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { label: 'Empresa origem', type: 'select', opts: EMPRESAS },
            { label: 'Conta bancária origem', type: 'select', opts: CONTAS },
            { label: 'Empresa destino', type: 'select', opts: EMPRESAS },
            { label: 'Conta bancária destino', type: 'select', opts: CONTAS },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[10px] text-muted-foreground">{f.label}</label>
              <select className="erp-input text-xs w-full mt-0.5">
                <option>Selecione</option>
                {f.opts.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {['Data', 'Valor', 'Descrição do lançamento', 'Pessoa'].map((ph) => (
            <div key={ph}>
              <label className="text-[10px] text-muted-foreground">{ph}</label>
              <input className="erp-input text-xs w-full mt-0.5" placeholder={ph} value={ph === 'Descrição do lançamento' ? busca : ''} onChange={(e) => ph === 'Descrição do lançamento' && setBusca(e.target.value)} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" className="erp-btn-primary text-xs px-4">Pesquisar</button>
          <button type="button" onClick={() => setBusca('')} className="erp-btn-ghost text-xs">Exibir todos</button>
        </div>
      </div>

      {/* Tabela */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full text-xs">
          <thead>
            <tr>
              <th>Cód.</th><th>Empresa origem</th><th>Conta origem</th>
              <th></th>
              <th>Empresa destino</th><th>Conta destino</th>
              <th>Data</th><th>Valor origem</th><th>Valor destino</th>
              <th>Descrição</th><th>Pessoa</th><th>Classif.</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setDetalhe(r)}>
                <td className="font-mono font-medium text-primary">{r.id}</td>
                <td className="text-[10px] text-muted-foreground">{r.empresa_orig}</td>
                <td className="font-medium">{r.banco_orig}</td>
                <td className="text-primary"><ArrowRight size={13} /></td>
                <td className="text-[10px] text-muted-foreground">{r.empresa_dest}</td>
                <td className="font-medium">{r.banco_dest}</td>
                <td className="text-muted-foreground">{fmtD(r.data)}</td>
                <td className="font-medium">{fmtBRL(r.valor_orig)}</td>
                <td className="font-medium">{fmtBRL(r.valor_dest)}</td>
                <td className="text-muted-foreground max-w-[140px] truncate">{r.descricao}</td>
                <td className="text-muted-foreground text-[10px] max-w-[100px] truncate">{r.pessoa}</td>
                <td className="text-muted-foreground">{r.classif}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => setDetalhe(r)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye size={12} /></button>
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={13} className="text-center py-6 text-muted-foreground">Nenhuma transferência encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal nova transferência */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Nova Transferência</h2>
              <button type="button" onClick={() => setShowForm(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Origem</div>
              <div>
                <label className="erp-label">Empresa origem</label>
                <select className="erp-input w-full" value={form.empresa_orig} onChange={(e) => setForm({ ...form, empresa_orig: e.target.value })}>
                  {EMPRESAS.map((e) => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Conta bancária origem *</label>
                <select className="erp-input w-full" value={form.banco_orig} onChange={(e) => setForm({ ...form, banco_orig: e.target.value })}>
                  <option value="">Selecione...</option>
                  {CONTAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">Destino</div>
              <div>
                <label className="erp-label">Empresa destino</label>
                <select className="erp-input w-full" value={form.empresa_dest} onChange={(e) => setForm({ ...form, empresa_dest: e.target.value })}>
                  <option value="">Selecione...</option>
                  {EMPRESAS.map((e) => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Conta bancária destino *</label>
                <select className="erp-input w-full" value={form.banco_dest} onChange={(e) => setForm({ ...form, banco_dest: e.target.value })}>
                  <option value="">Selecione...</option>
                  {CONTAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Data *</label>
                <input type="date" className="erp-input w-full" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
              <div>
                <label className="erp-label">Valor *</label>
                <input type="number" step="0.01" className="erp-input w-full" value={form.valor_orig} onChange={(e) => setForm({ ...form, valor_orig: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="erp-label">Descrição do lançamento</label>
                <input className="erp-input w-full" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={salvar} className="erp-btn-primary">Salvar Transferência</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
