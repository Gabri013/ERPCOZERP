import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, XCircle, CheckCircle, AlertCircle, Percent, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const CATEGORIAS = ['Manutenção', 'Instalação', 'Consultoria', 'Projeto', 'Reforma', 'Treinamento', 'Inspeção', 'Suporte'];
const UNIDADES = ['H', 'Hora', 'Diária', 'Serviço', 'Visita', 'Contrato', 'M²', 'Metro', 'Unidade'];

export default function TabelaPrecosServicos() {
  const [tabelas, setTabelas] = useState([]);
  const [itens, setItens] = useState([]);
  const [tabelaSel, setTabelaSel] = useState(null);
  const [aba, setAba] = useState('itens');
  const [busca, setBusca] = useState('');
  const [filtroCateg, setFiltroCateg] = useState('Todas');
  const [editItem, setEditItem] = useState(null);
  const [showReajuste, setShowReajuste] = useState(false);
  const [pctReajuste, setPctReajuste] = useState('');
  const [reajusteCateg, setReajusteCateg] = useState('Todas');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sales/service-prices');
      const data = res?.data?.data ?? res?.data ?? {};
      const tabelasList = Array.isArray(data.tabelas) ? data.tabelas : Array.isArray(data) ? data : [];
      const itensList = Array.isArray(data.itens) ? data.itens : [];
      setTabelas(tabelasList);
      setItens(itensList);
      if (tabelasList.length > 0) setTabelaSel((prev) => prev ?? tabelasList[0]);
    } catch {
      toast.error('Erro ao carregar tabelas de preço');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const itensDaTabela = useMemo(() => {
    let d = itens.filter((i) => i.tabela_id === tabelaSel?.id);
    if (filtroCateg !== 'Todas') d = d.filter((i) => i.categoria === filtroCateg);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((i) => i.descricao.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q)); }
    return d;
  }, [itens, tabelaSel, filtroCateg, busca]);

  const margem = (item) => Math.round(((item.preco_venda - item.preco_custo) / item.preco_venda) * 100);
  const alertaMargem = (item) => margem(item) < item.margem_minima;

  const salvarItem = async (item) => {
    try {
      if (item.id) {
        await api.put(`/api/sales/service-prices/itens/${item.id}`, item);
        setItens((prev) => prev.map((i) => i.id === item.id ? item : i));
        toast.success('Item atualizado!');
      } else {
        const res = await api.post('/api/sales/service-prices/itens', { ...item, tabela_id: tabelaSel?.id });
        const novo = res?.data?.data ?? res?.data ?? { ...item, id: Date.now(), tabela_id: tabelaSel?.id };
        setItens((prev) => [...prev, novo]);
        toast.success('Item adicionado!');
      }
      setEditItem(null);
    } catch {
      toast.error('Erro ao salvar item');
    }
  };

  const aplicarReajuste = async () => {
    const pct = Number(pctReajuste);
    if (!pct) return toast.error('Informe o percentual');
    const updated = itens.map((i) => {
      if (i.tabela_id !== tabelaSel?.id) return i;
      if (reajusteCateg !== 'Todas' && i.categoria !== reajusteCateg) return i;
      const novoPreco = Number((i.preco_venda * (1 + pct / 100)).toFixed(2));
      return { ...i, preco_venda: novoPreco, markup: Math.round(((novoPreco - i.preco_custo) / i.preco_custo) * 100) };
    });
    setItens(updated);
    setShowReajuste(false); setPctReajuste(''); setReajusteCateg('Todas');
    toast.success(`Reajuste de ${pct}% aplicado!`);
    try {
      await api.post('/api/sales/service-prices/reajuste', { tabela_id: tabelaSel?.id, percentual: pct, categoria: reajusteCateg });
    } catch {
      toast.error('Erro ao persistir reajuste');
      load();
    }
  };

  const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const ItemForm = ({ item, onSave, onClose }) => {
    const [f, setF] = useState(item || { codigo: '', descricao: '', categoria: 'Manutenção', unidade: 'H', preco_custo: '', preco_venda: '', margem_minima: 40 });
    const mg = f.preco_venda && f.preco_custo ? Math.round(((Number(f.preco_venda) - Number(f.preco_custo)) / Number(f.preco_venda)) * 100) : 0;
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">{f.id ? 'Editar Item' : 'Novo Item de Serviço'}</h2>
            <button type="button" onClick={onClose}><XCircle size={18} className="text-muted-foreground" /></button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[{ label: 'Código', key: 'codigo' }, { label: 'Descrição', key: 'descricao', full: true }].map((fi) => (
              <div key={fi.key} className={fi.full ? 'col-span-2' : ''}>
                <label className="erp-label">{fi.label}</label>
                <input className="erp-input w-full" value={f[fi.key]} onChange={(e) => setF({ ...f, [fi.key]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="erp-label">Categoria</label>
              <select className="erp-input w-full" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Unidade</label>
              <select className="erp-input w-full" value={f.unidade} onChange={(e) => setF({ ...f, unidade: e.target.value })}>
                {UNIDADES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Preço de custo (R$)</label>
              <input type="number" step="0.01" className="erp-input w-full" value={f.preco_custo} onChange={(e) => setF({ ...f, preco_custo: e.target.value })} />
            </div>
            <div>
              <label className="erp-label">Preço de venda (R$)</label>
              <input type="number" step="0.01" className="erp-input w-full" value={f.preco_venda} onChange={(e) => setF({ ...f, preco_venda: e.target.value })} />
            </div>
            <div>
              <label className="erp-label">Margem mínima (%)</label>
              <input type="number" className="erp-input w-full" value={f.margem_minima} onChange={(e) => setF({ ...f, margem_minima: Number(e.target.value) })} />
            </div>
            <div className="flex flex-col justify-end">
              <div className={`p-2 rounded text-xs font-medium ${mg >= f.margem_minima ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                Margem atual: {mg}% {mg < f.margem_minima && `(mín. ${f.margem_minima}%)`}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-border flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="erp-btn-ghost">Cancelar</button>
            <button type="button" onClick={() => onSave({ ...f, preco_custo: Number(f.preco_custo), preco_venda: Number(f.preco_venda), markup: Math.round(((Number(f.preco_venda) - Number(f.preco_custo)) / Number(f.preco_custo)) * 100) })} className="erp-btn-primary">
              <Save size={13} /> Salvar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Tabelas de Preço — Serviços</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Preços integrados aos custos; regras de aplicação automática</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowReajuste(true)} className="erp-btn-ghost flex items-center gap-1.5 text-xs">
            <Percent size={13} /> Reajuste em Lote
          </button>
          <button type="button" onClick={() => setEditItem({})} className="erp-btn-primary flex items-center gap-2">
            <Plus size={14} /> Novo Serviço
          </button>
        </div>
      </div>

      {/* Seletor de tabela */}
      <div className="flex gap-2 flex-wrap">
        {tabelas.map((t) => (
          <button key={t.id} type="button" onClick={() => setTabelaSel(t)}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${tabelaSel?.id === t.id ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:bg-muted'}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${t.ativa ? 'bg-green-500' : 'bg-gray-400'}`} />
            {t.nome}
            <span className="ml-2 text-xs text-muted-foreground">({t.itens})</span>
          </button>
        ))}
      </div>

      {/* Info da tabela */}
      {tabelaSel && (
        <div className="erp-card p-3 flex items-start justify-between gap-4 text-sm">
          <div>
            <h3 className="font-semibold">{tabelaSel.nome}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{tabelaSel.descricao}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground shrink-0">
            <p>Vigência: {tabelaSel.vigencia_inicio} a {tabelaSel.vigencia_fim}</p>
            <p className="mt-0.5">Aplicação automática: <span className="text-foreground font-medium">{tabelaSel.auto_aplicar}</span></p>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="border-b border-border flex gap-1">
        {[{ id: 'itens', label: 'Itens de Serviço' }, { id: 'regras', label: 'Regras de Aplicação' }].map((t) => (
          <button key={t.id} type="button" onClick={() => setAba(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${aba === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'itens' && (
        <>
          <div className="erp-card p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar código, descrição..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['Todas', ...CATEGORIAS].map((c) => (
                <button key={c} type="button" onClick={() => setFiltroCateg(c)}
                  className={`px-2.5 py-1 rounded text-xs ${filtroCateg === c ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="erp-card overflow-x-auto">
            <table className="erp-table w-full text-xs">
              <thead>
                <tr>
                  <th>Código</th><th>Descrição do serviço</th><th>Categoria</th><th>Un.</th>
                  <th>Custo</th><th>Preço venda</th><th>Markup</th><th>Margem</th><th>Alerta</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensDaTabela.map((item) => {
                  const mg = margem(item);
                  const alert = alertaMargem(item);
                  return (
                    <tr key={item.id} className={`hover:bg-muted/40 ${alert ? 'bg-red-50/30' : ''}`}>
                      <td className="font-mono text-primary">{item.codigo}</td>
                      <td className="font-medium max-w-[220px]">{item.descricao}</td>
                      <td><span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{item.categoria}</span></td>
                      <td>{item.unidade}</td>
                      <td>{fmtBRL(item.preco_custo)}</td>
                      <td className="font-bold">{fmtBRL(item.preco_venda)}</td>
                      <td><span className="text-blue-600 font-medium">+{item.markup}%</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 bg-muted rounded-full">
                            <div className={`h-full rounded-full ${mg >= item.margem_minima ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(mg, 100)}%` }} />
                          </div>
                          <span className={`font-medium ${mg >= item.margem_minima ? 'text-green-600' : 'text-red-600'}`}>{mg}%</span>
                        </div>
                      </td>
                      <td>{alert ? <AlertCircle size={13} className="text-red-500" title={`Margem abaixo do mínimo (${item.margem_minima}%)`} /> : <CheckCircle size={13} className="text-green-500" />}</td>
                      <td>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setEditItem(item)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Edit2 size={12} /></button>
                          <button type="button" onClick={async () => { setItens((prev) => prev.filter((i) => i.id !== item.id)); toast.success('Item removido'); try { await api.delete(`/api/sales/service-prices/itens/${item.id}`); } catch { toast.error('Erro ao remover item'); load(); } }} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!itensDaTabela.length && (
                  <tr><td colSpan={10} className="text-center py-6 text-muted-foreground">Nenhum item encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === 'regras' && (
        <div className="erp-card p-5 space-y-4">
          <h3 className="font-semibold">Regras de Aplicação Automática</h3>
          <p className="text-sm text-muted-foreground">O sistema sugere automaticamente a tabela de preços mais adequada com base nas seguintes regras:</p>
          <div className="space-y-3">
            {[
              { cond: 'Cliente novo sem histórico', tabela: 'Tabela Padrão 2026', icon: '🆕' },
              { cond: 'Contrato recorrente com valor ≥ R$ 5.000/mês', tabela: 'Tabela Premium', icon: '⭐' },
              { cond: 'Tipo de cliente = Distribuidor', tabela: 'Tabela Distribuidor', icon: '🤝' },
              { cond: 'Cliente com mais de 12 meses de contrato', tabela: 'Tabela Fidelidade (a criar)', icon: '🏆' },
              { cond: 'Serviço emergencial fora de horário', tabela: 'Tabela + 50% emergencial', icon: '🚨' },
            ].map((r) => (
              <div key={r.cond} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <span className="text-xl">{r.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.cond}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">→ Aplica: <strong>{r.tabela}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal reajuste */}
      {showReajuste && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Reajuste em Lote</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Tabela: {tabelaSel?.nome}</p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="erp-label">Percentual de reajuste (%)</label>
                <input type="number" step="0.1" className="erp-input w-full" placeholder="Ex: 5 para +5%" value={pctReajuste} onChange={(e) => setPctReajuste(e.target.value)} />
              </div>
              <div>
                <label className="erp-label">Filtrar por categoria</label>
                <select className="erp-input w-full" value={reajusteCateg} onChange={(e) => setReajusteCateg(e.target.value)}>
                  <option>Todas</option>
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowReajuste(false)} className="erp-btn-ghost">Cancelar</button>
              <button type="button" onClick={aplicarReajuste} className="erp-btn-primary">Aplicar Reajuste</button>
            </div>
          </div>
        </div>
      )}

      {editItem !== null && <ItemForm item={editItem.id ? editItem : null} onSave={salvarItem} onClose={() => setEditItem(null)} />}
    </div>
  );
}
