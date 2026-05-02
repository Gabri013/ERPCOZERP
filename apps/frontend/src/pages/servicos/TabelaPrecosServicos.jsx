import { useState, useMemo } from 'react';
import { Plus, Search, Eye, Edit2, XCircle, CheckCircle, AlertCircle, TrendingUp, Percent, DollarSign, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIAS = ['Manutenção', 'Instalação', 'Consultoria', 'Projeto', 'Reforma', 'Treinamento', 'Inspeção', 'Suporte'];
const UNIDADES = ['H', 'Hora', 'Diária', 'Serviço', 'Visita', 'Contrato', 'M²', 'Metro', 'Unidade'];

const MOCK_TABELAS = [
  { id: 1, nome: 'Tabela Padrão 2026', descricao: 'Preços padrão para todos os clientes', ativa: true, auto_aplicar: 'Padrão', vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31', itens: 8 },
  { id: 2, nome: 'Tabela Premium', descricao: 'Contratos acima de R$ 5.000/mês', ativa: true, auto_aplicar: 'Contrato Premium', vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31', itens: 6 },
  { id: 3, nome: 'Tabela Distribuidor', descricao: 'Revendedores e parceiros', ativa: false, auto_aplicar: 'Tipo cliente = Distribuidor', vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31', itens: 5 },
];

const MOCK_ITENS = [
  { id: 1, tabela_id: 1, codigo: 'SV-001', descricao: 'Mão de obra técnica — hora normal', categoria: 'Manutenção', unidade: 'H', preco_custo: 45, preco_venda: 120, margem_minima: 40, markup: 167 },
  { id: 2, tabela_id: 1, codigo: 'SV-002', descricao: 'Mão de obra técnica — hora extra', categoria: 'Manutenção', unidade: 'H', preco_custo: 67, preco_venda: 180, margem_minima: 40, markup: 169 },
  { id: 3, tabela_id: 1, codigo: 'SV-003', descricao: 'Diária de instalação (até 8h)', categoria: 'Instalação', unidade: 'Diária', preco_custo: 360, preco_venda: 800, margem_minima: 35, markup: 122 },
  { id: 4, tabela_id: 1, codigo: 'SV-004', descricao: 'Consultoria técnica presencial', categoria: 'Consultoria', unidade: 'Visita', preco_custo: 200, preco_venda: 600, margem_minima: 50, markup: 200 },
  { id: 5, tabela_id: 1, codigo: 'SV-005', descricao: 'Projeto personalizado (por hora)', categoria: 'Projeto', unidade: 'H', preco_custo: 80, preco_venda: 220, margem_minima: 45, markup: 175 },
  { id: 6, tabela_id: 1, codigo: 'SV-006', descricao: 'Treinamento operacional (por turma)', categoria: 'Treinamento', unidade: 'Contrato', preco_custo: 500, preco_venda: 1500, margem_minima: 50, markup: 200 },
  { id: 7, tabela_id: 1, codigo: 'SV-007', descricao: 'Inspeção técnica preventiva', categoria: 'Inspeção', unidade: 'Visita', preco_custo: 150, preco_venda: 380, margem_minima: 40, markup: 153 },
  { id: 8, tabela_id: 1, codigo: 'SV-008', descricao: 'Suporte remoto — por hora', categoria: 'Suporte', unidade: 'H', preco_custo: 30, preco_venda: 90, margem_minima: 50, markup: 200 },
];

export default function TabelaPrecosServicos() {
  const [tabelas, setTabelas] = useState(MOCK_TABELAS);
  const [itens, setItens] = useState(MOCK_ITENS);
  const [tabelaSel, setTabelaSel] = useState(MOCK_TABELAS[0]);
  const [aba, setAba] = useState('itens');
  const [busca, setBusca] = useState('');
  const [filtroCateg, setFiltroCateg] = useState('Todas');
  const [editItem, setEditItem] = useState(null);
  const [showReajuste, setShowReajuste] = useState(false);
  const [pctReajuste, setPctReajuste] = useState('');
  const [reajusteCateg, setReajusteCateg] = useState('Todas');

  const itensDaTabela = useMemo(() => {
    let d = itens.filter((i) => i.tabela_id === tabelaSel?.id);
    if (filtroCateg !== 'Todas') d = d.filter((i) => i.categoria === filtroCateg);
    if (busca) { const q = busca.toLowerCase(); d = d.filter((i) => i.descricao.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q)); }
    return d;
  }, [itens, tabelaSel, filtroCateg, busca]);

  const margem = (item) => Math.round(((item.preco_venda - item.preco_custo) / item.preco_venda) * 100);
  const alertaMargem = (item) => margem(item) < item.margem_minima;

  const salvarItem = (item) => {
    if (item.id) {
      setItens(itens.map((i) => i.id === item.id ? item : i));
      toast.success('Item atualizado!');
    } else {
      const novo = { ...item, id: Date.now(), tabela_id: tabelaSel.id };
      setItens([...itens, novo]);
      toast.success('Item adicionado!');
    }
    setEditItem(null);
  };

  const aplicarReajuste = () => {
    const pct = Number(pctReajuste);
    if (!pct) return toast.error('Informe o percentual');
    setItens(itens.map((i) => {
      if (i.tabela_id !== tabelaSel.id) return i;
      if (reajusteCateg !== 'Todas' && i.categoria !== reajusteCateg) return i;
      const novoPreco = Number((i.preco_venda * (1 + pct / 100)).toFixed(2));
      return { ...i, preco_venda: novoPreco, markup: Math.round(((novoPreco - i.preco_custo) / i.preco_custo) * 100) };
    }));
    setShowReajuste(false); setPctReajuste(''); setReajusteCateg('Todas');
    toast.success(`Reajuste de ${pct}% aplicado!`);
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
                          <button type="button" onClick={() => { setItens(itens.filter((i) => i.id !== item.id)); toast.success('Item removido'); }} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 size={12} /></button>
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
