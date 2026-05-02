import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Save, XCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const CFOPS_ENTRADA = [
  { cfop: '1101', desc: 'Compra para industrialização ou produção rural' },
  { cfop: '1102', desc: 'Compra para comercialização' },
  { cfop: '1201', desc: 'Devolução de venda de produção do estabelecimento' },
  { cfop: '1301', desc: 'Aquisição de serviço de comunicação' },
  { cfop: '1352', desc: 'Aquisição de serviço de transporte por contribuinte' },
  { cfop: '1408', desc: 'Compra de combustível ou lubrificante para industrialização' },
  { cfop: '2101', desc: 'Compra para industrialização — Interestadual' },
  { cfop: '2102', desc: 'Compra para comercialização — Interestadual' },
  { cfop: '3101', desc: 'Compra para industrialização — Exterior' },
];

const TIPOS_ICMS = ['Tributado integralmente (00)', 'Tributado e com cobrança por ST (10)', 'Isento ou não tributado (40)', 'Diferimento (51)', 'Substituição tributária (60)', 'Outros (90)'];
const TIPOS_PIS_COFINS = ['Alíquota básica (01)', 'Alíquota zero (07)', 'Monofásico (04)', 'ST (05)', 'Não tributado (99)'];
const TIPOS_IPI = ['Tributado por alíquota (50)', 'Saída tributada (99)', 'Isento (53)'];

const EMPTY = { cfop: '', desc_cfop: '', icms_cst: '00', icms_aliq: 12, ipi_cst: '50', ipi_aliq: 0, pis_cst: '01', pis_aliq: 1.65, cofins_cst: '01', cofins_aliq: 7.6, ativo: true };

export default function RegrasTributacao() {
  const [regras, setRegras] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/api/purchases/tax-rules');
      setRegras(res.data ?? []);
    } catch {
      toast.error('Erro ao carregar regras de tributação');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const lista = regras.filter((r) => !busca || r.cfop.includes(busca) || r.desc_cfop.toLowerCase().includes(busca.toLowerCase()));

  const salvar = () => {
    if (!form.cfop) return toast.error('Informe o CFOP');
    if (editando) {
      setRegras(regras.map((r) => r.id === editando ? { ...form, id: editando } : r));
      toast.success('Regra atualizada!');
    } else {
      setRegras([...regras, { ...form, id: Date.now() }]);
      toast.success('Regra criada!');
    }
    setShowForm(false); setEditando(null); setForm(EMPTY);
  };

  const deletar = (id) => { setRegras(regras.filter((r) => r.id !== id)); toast.success('Regra removida!'); };
  const toggleAtivo = (id) => setRegras(regras.map((r) => r.id === id ? { ...r, ativo: !r.ativo } : r));

  const editarRegra = (r) => { setEditando(r.id); setForm({ ...r }); setShowForm(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Regras de Tributação</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configuração de ICMS, IPI, PIS e COFINS por CFOP</p>
        </div>
        <button type="button" onClick={() => { setEditando(null); setForm(EMPTY); setShowForm(true); }} className="erp-btn-primary flex items-center gap-2">
          <Plus size={14} /> Nova Regra
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Regras cadastradas</p><p className="text-lg font-bold">{regras.length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">Ativas</p><p className="text-lg font-bold text-green-600">{regras.filter((r) => r.ativo).length}</p></div>
        <div className="erp-card p-3"><p className="text-[10px] text-muted-foreground">CFOPs cobertos</p><p className="text-lg font-bold text-primary">{new Set(regras.map((r) => r.cfop)).size}</p></div>
      </div>

      {/* Filtro */}
      <div className="erp-card p-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="CFOP ou descrição..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {/* Tabela de regras */}
      <div className="erp-card overflow-x-auto">
        <table className="erp-table w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-primary text-white">
              <th className="text-left">CFOP</th>
              <th className="text-left">Descrição</th>
              <th className="text-center">ICMS CST</th><th className="text-right">ICMS %</th>
              <th className="text-center">IPI CST</th><th className="text-right">IPI %</th>
              <th className="text-center">PIS CST</th><th className="text-right">PIS %</th>
              <th className="text-center">COFINS CST</th><th className="text-right">COFINS %</th>
              <th className="text-center">Ativo</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id} className={`hover:bg-muted/30 ${!r.ativo ? 'opacity-50' : ''}`}>
                <td className="font-mono font-semibold text-primary">{r.cfop}</td>
                <td className="max-w-[180px] truncate">{r.desc_cfop}</td>
                <td className="text-center text-muted-foreground">{r.icms_cst}</td>
                <td className="text-right font-medium">{r.icms_aliq}%</td>
                <td className="text-center text-muted-foreground">{r.ipi_cst}</td>
                <td className="text-right font-medium">{r.ipi_aliq}%</td>
                <td className="text-center text-muted-foreground">{r.pis_cst}</td>
                <td className="text-right font-medium">{r.pis_aliq}%</td>
                <td className="text-center text-muted-foreground">{r.cofins_cst}</td>
                <td className="text-right font-medium">{r.cofins_aliq}%</td>
                <td className="text-center">
                  <button type="button" onClick={() => toggleAtivo(r.id)}>
                    {r.ativo
                      ? <CheckCircle size={14} className="text-green-500 mx-auto" />
                      : <XCircle size={14} className="text-gray-400 mx-auto" />}
                  </button>
                </td>
                <td>
                  <div className="flex gap-1 justify-center">
                    <button type="button" onClick={() => editarRegra(r)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Edit2 size={12} /></button>
                    <button type="button" onClick={() => deletar(r.id)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={12} className="text-center py-6 text-muted-foreground">Nenhuma regra encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Explicação */}
      <div className="erp-card p-4 text-sm">
        <h3 className="font-semibold mb-2 text-muted-foreground text-xs uppercase tracking-wide">Como funcionam as regras de tributação</h3>
        <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
          <li>As regras são aplicadas automaticamente ao criar documentos de entrada com o CFOP correspondente</li>
          <li><strong>ICMS:</strong> Imposto sobre Circulação de Mercadorias e Serviços — define CST e alíquota de crédito</li>
          <li><strong>IPI:</strong> Imposto sobre Produtos Industrializados — define CST e alíquota de crédito</li>
          <li><strong>PIS/COFINS:</strong> Contribuições sobre faturamento — define CST e alíquota de crédito</li>
          <li>O CST (Código de Situação Tributária) determina como o imposto é tratado na operação</li>
        </ul>
      </div>

      {/* Modal de formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">{editando ? 'Editar Regra' : 'Nova Regra de Tributação'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><XCircle size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* CFOP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">CFOP *</label>
                  <input className="erp-input w-full" list="cfop-list" value={form.cfop} onChange={(e) => { const found = CFOPS_ENTRADA.find((c) => c.cfop === e.target.value); setForm({ ...form, cfop: e.target.value, desc_cfop: found?.desc || form.desc_cfop }); }} />
                  <datalist id="cfop-list">{CFOPS_ENTRADA.map((c) => <option key={c.cfop} value={c.cfop}>{c.desc}</option>)}</datalist>
                </div>
                <div>
                  <label className="erp-label">Descrição</label>
                  <input className="erp-input w-full" value={form.desc_cfop} onChange={(e) => setForm({ ...form, desc_cfop: e.target.value })} />
                </div>
              </div>

              {/* Tributos */}
              {[
                { key: 'icms', label: 'ICMS', tipos: TIPOS_ICMS },
                { key: 'ipi', label: 'IPI', tipos: TIPOS_IPI },
                { key: 'pis', label: 'PIS', tipos: TIPOS_PIS_COFINS },
                { key: 'cofins', label: 'COFINS', tipos: TIPOS_PIS_COFINS },
              ].map((t) => (
                <div key={t.key} className="border border-border rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-primary mb-2">{t.label}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="erp-label">CST {t.label}</label>
                      <select className="erp-input w-full text-xs" value={form[`${t.key}_cst`]} onChange={(e) => setForm({ ...form, [`${t.key}_cst`]: e.target.value })}>
                        {t.tipos.map((tp) => <option key={tp} value={tp.split(' ')[0].replace('(', '').replace(')', '')}>{tp}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="erp-label">Alíquota % {t.label}</label>
                      <input type="number" step="0.01" min="0" max="100" className="erp-input w-full"
                        value={form[`${t.key}_aliq`]} onChange={(e) => setForm({ ...form, [`${t.key}_aliq`]: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="regra-ativa" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="rounded" />
                <label htmlFor="regra-ativa" className="text-sm">Regra ativa</label>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={salvar} className="erp-btn-primary flex items-center gap-1"><Save size={13} /> Salvar Regra</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
