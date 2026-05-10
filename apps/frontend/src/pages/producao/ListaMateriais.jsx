import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, ChevronRight, Copy, Trash2, Save, Settings, XCircle, Info, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const TIPO_COMP = {
  normal:       { label: 'Normal',       cor: 'bg-gray-100 text-gray-600' },
  preferencial: { label: 'Preferencial', cor: 'bg-blue-100 text-blue-700' },
  alternativo:  { label: 'Alternativo',  cor: 'bg-yellow-100 text-yellow-700' },
  opcional:     { label: 'Opcional',     cor: 'bg-teal-100 text-teal-700' },
  co_produto:   { label: 'Co-produto',   cor: 'bg-purple-100 text-purple-700' },
  subproduto:   { label: 'Subproduto',   cor: 'bg-orange-100 text-orange-700' },
  fantasma:     { label: 'Fantasma',     cor: 'bg-pink-100 text-pink-700' },
};


function TipoBadge({ tipo }) {
  const t = TIPO_COMP[tipo] || TIPO_COMP.normal;
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${t.cor}`}>{t.label}</span>;
}

function ComponenteRow({ comp, onEdit, onRemove, expanded, onToggle }) {
  const hasChildren = comp.filhos?.length > 0;
  return (
    <tr className={`border-b border-border/40 hover:bg-muted/20 ${comp.tipo === 'subproduto' || comp.tipo === 'co_produto' ? 'bg-purple-50/30' : ''} ${comp.tipo === 'alternativo' ? 'bg-yellow-50/30' : ''} ${comp.tipo === 'fantasma' ? 'bg-pink-50/30' : ''}`}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1" style={{ paddingLeft: `${(comp.nivel - 1) * 16}px` }}>
          {hasChildren
            ? <button type="button" onClick={onToggle} className="p-0.5"><ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} /></button>
            : <span className="w-4" />}
          <span className="font-mono text-xs">{comp.codigo}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-xs">{comp.descricao}</td>
      <td className="px-3 py-2 text-right text-xs font-medium">{comp.qtd}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{comp.unidade}</td>
      <td className="px-3 py-2 text-xs text-right text-muted-foreground">{comp.perda > 0 ? `+${comp.perda}%` : '—'}</td>
      <td className="px-3 py-2"><TipoBadge tipo={comp.tipo} /></td>
      <td className="px-3 py-2">
        <div className="flex gap-1 justify-end">
          <button type="button" onClick={() => onEdit(comp)} className="p-1 hover:bg-muted rounded"><Edit2 size={11} className="text-muted-foreground" /></button>
          <button type="button" onClick={() => onRemove(comp.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 size={11} className="text-red-400" /></button>
        </div>
      </td>
    </tr>
  );
}

export default function ListaMateriais() {
  const [produtos, setProdutos] = useState([]);

  const loadProdutos = useCallback(async () => {
    try {
      const res = await api.get('/api/production/bom');
      setProdutos(res.data?.data ?? res.data ?? []);
    } catch {
      setProdutos([]);
    }
  }, []);

  useEffect(() => { loadProdutos(); }, [loadProdutos]);
  const [busca, setBusca] = useState('');
  const [produtoSel, setProdutoSel] = useState(null);
  const [bomSel, setBomSel] = useState(null);
  const [showAddComp, setShowAddComp] = useState(false);
  const [showCopiarBOM, setShowCopiarBOM] = useState(false);
  const [editComp, setEditComp] = useState(null);
  const [novoComp, setNovoComp] = useState({ codigo: '', descricao: '', qtd: 1, unidade: 'kg', tipo: 'normal', perda: 0 });
  const [expandidos, setExpandidos] = useState({});

  const produtosFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    return produtos.filter((p) => p.codigo.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q));
  }, [produtos, busca]);

  const selecionarProduto = (p) => {
    setProdutoSel(p);
    const ativa = p.boms.find((b) => b.id === p.bomAtiva) || p.boms[0];
    setBomSel(ativa || null);
  };

  const ativarBOM = (bomId) => {
    const upd = produtos.map((p) => p.id === produtoSel.id ? { ...p, bomAtiva: bomId } : p);
    setProdutos(upd);
    setProdutoSel({ ...produtoSel, bomAtiva: bomId });
    toast.success('BOM ativada!');
  };

  const adicionarComponente = () => {
    if (!bomSel) return;
    const upd = {
      ...bomSel,
      componentes: [...(bomSel.componentes || []), { id: Date.now(), ...novoComp, nivel: 1 }],
    };
    setBomSel(upd);
    setShowAddComp(false);
    setNovoComp({ codigo: '', descricao: '', qtd: 1, unidade: 'kg', tipo: 'normal', perda: 0 });
    toast.success('Componente adicionado!');
  };

  const removerComponente = (compId) => {
    setBomSel({ ...bomSel, componentes: bomSel.componentes.filter((c) => c.id !== compId) });
    toast.success('Componente removido.');
  };

  const copiarBOM = () => {
    if (!bomSel || !produtoSel) return;
    const novaRev = String.fromCharCode(65 + produtoSel.boms.length);
    const novaBOM = { ...bomSel, id: Date.now(), rev: novaRev, descricao: `Cópia de ${bomSel.descricao}`, status: 'Inativa', data: new Date().toISOString().split('T')[0] };
    const updP = { ...produtoSel, boms: [...produtoSel.boms, novaBOM] };
    setProdutoSel(updP);
    setProdutos(produtos.map((p) => p.id === updP.id ? updP : p));
    setBomSel(novaBOM);
    setShowCopiarBOM(false);
    toast.success(`BOM duplicada — Revisão ${novaRev}!`);
  };

  const totais = useMemo(() => {
    if (!bomSel?.componentes) return {};
    const por_unidade = {};
    bomSel.componentes.filter((c) => c.tipo !== 'subproduto' && c.tipo !== 'co_produto').forEach((c) => {
      por_unidade[c.unidade] = (por_unidade[c.unidade] || 0) + c.qtd;
    });
    return por_unidade;
  }, [bomSel]);

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-3">
      {/* Painel esquerdo — lista de produtos */}
      <div className="w-72 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-base">Lista de Materiais</h1>
          <button type="button" onClick={() => toast.info('Novo produto')} className="erp-btn-primary text-xs px-2 py-1 flex items-center gap-1"><Plus size={12} /> Produto</button>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="erp-input pl-7 text-xs w-full" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="overflow-y-auto flex-1 space-y-1 pr-1">
          {produtosFiltrados.map((p) => (
            <button key={p.id} type="button" onClick={() => selecionarProduto(p)}
              className={`w-full text-left p-2.5 rounded-lg border transition-colors ${produtoSel?.id === p.id ? 'bg-primary/10 border-primary' : 'bg-white border-border hover:bg-muted/30'}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-primary">{p.codigo}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p.boms.length} BOM{p.boms.length > 1 ? 's' : ''}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{p.descricao}</p>
            </button>
          ))}
          {!produtosFiltrados.length && <p className="text-xs text-muted-foreground text-center py-4">Nenhum produto</p>}
        </div>
      </div>

      {/* Painel direito — BOM */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!produtoSel && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center"><div className="text-4xl mb-2">📋</div><p>Selecione um produto para visualizar sua Lista de Materiais</p></div>
          </div>
        )}
        {produtoSel && (
          <>
            {/* Header produto */}
            <div className="bg-white border border-border rounded-lg p-3 flex items-start justify-between gap-3 mb-2 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{produtoSel.codigo}</span>
                  <span className="text-muted-foreground text-sm">—</span>
                  <span className="text-sm font-medium">{produtoSel.descricao}</span>
                </div>
                <div className="flex gap-2 mt-1.5">
                  {produtoSel.boms.map((b) => (
                    <button key={b.id} type="button" onClick={() => setBomSel(b)}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${bomSel?.id === b.id ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted-foreground hover:bg-muted/50'}`}>
                      Rev. {b.rev}
                      {b.id === produtoSel.bomAtiva && <span className="ml-1 text-green-400">●</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {bomSel && bomSel.id !== produtoSel.bomAtiva && (
                  <button type="button" onClick={() => ativarBOM(bomSel.id)} className="erp-btn-ghost text-xs flex items-center gap-1"><Settings size={12} /> Ativar BOM</button>
                )}
                <button type="button" onClick={() => setShowCopiarBOM(true)} className="erp-btn-ghost text-xs flex items-center gap-1"><Copy size={12} /> Duplicar</button>
                <button type="button" onClick={() => setShowAddComp(true)} className="erp-btn-primary text-xs flex items-center gap-1"><Plus size={12} /> Componente</button>
              </div>
            </div>

            {/* Info BOM selecionada */}
            {bomSel && (
              <div className="bg-white border border-border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="px-4 py-2 bg-muted/20 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold">Revisão {bomSel.rev} — {bomSel.descricao}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${bomSel.status === 'Ativa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{bomSel.status}</span>
                    <span className="text-[10px] text-muted-foreground">{bomSel.data}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {Object.entries(totais).map(([un, total]) => (
                      <span key={un} className="bg-primary/5 px-2 py-0.5 rounded">Total {un}: <strong>{total}</strong></span>
                    ))}
                  </div>
                </div>

                {/* Legenda tipos */}
                <div className="px-4 py-1.5 bg-muted/10 border-b border-border flex flex-wrap gap-1.5 shrink-0">
                  {Object.entries(TIPO_COMP).map(([k, v]) => (
                    <span key={k} className={`px-1.5 py-0.5 rounded text-[10px] ${v.cor}`}>{v.label}</span>
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-2 flex items-center gap-0.5"><Info size={9} /> Tipos de componente</span>
                </div>

                {/* Tabela de componentes */}
                <div className="overflow-auto flex-1">
                  <table className="w-full text-xs min-w-[700px]">
                    <thead className="sticky top-0 bg-primary text-white">
                      <tr>
                        <th className="text-left px-3 py-2">Código</th>
                        <th className="text-left px-3 py-2">Descrição</th>
                        <th className="text-right px-3 py-2">Qtd</th>
                        <th className="text-left px-3 py-2">UN</th>
                        <th className="text-right px-3 py-2">% Perda</th>
                        <th className="text-left px-3 py-2">Tipo</th>
                        <th className="text-right px-3 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bomSel.componentes || []).map((comp) => (
                        <ComponenteRow
                          key={comp.id}
                          comp={comp}
                          expanded={expandidos[comp.id]}
                          onToggle={() => setExpandidos((e) => ({ ...e, [comp.id]: !e[comp.id] }))}
                          onEdit={(c) => setEditComp(c)}
                          onRemove={removerComponente}
                        />
                      ))}
                      {(!bomSel.componentes || bomSel.componentes.length === 0) && (
                        <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum componente cadastrado. Clique em "Componente" para adicionar.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal adicionar componente */}
      {showAddComp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Adicionar Componente</h2>
              <button type="button" onClick={() => setShowAddComp(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <label className="erp-label">Código do Material *</label>
                <input className="erp-input w-full font-mono" placeholder="Ex: MP-CHAPA-316L-3MM" value={novoComp.codigo} onChange={(e) => setNovoComp({ ...novoComp, codigo: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="erp-label">Descrição *</label>
                <input className="erp-input w-full" value={novoComp.descricao} onChange={(e) => setNovoComp({ ...novoComp, descricao: e.target.value })} />
              </div>
              <div>
                <label className="erp-label">Quantidade</label>
                <input type="number" step="0.001" className="erp-input w-full" value={novoComp.qtd} onChange={(e) => setNovoComp({ ...novoComp, qtd: Number(e.target.value) })} />
              </div>
              <div>
                <label className="erp-label">Unidade</label>
                <select className="erp-input w-full" value={novoComp.unidade} onChange={(e) => setNovoComp({ ...novoComp, unidade: e.target.value })}>
                  {['kg', 'pc', 'm', 'm²', 'm³', 'L', 'cj', 'rolo', 'cx'].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">% Perda / Refugo</label>
                <input type="number" step="0.1" min="0" className="erp-input w-full" value={novoComp.perda} onChange={(e) => setNovoComp({ ...novoComp, perda: Number(e.target.value) })} />
              </div>
              <div>
                <label className="erp-label">Tipo</label>
                <select className="erp-input w-full" value={novoComp.tipo} onChange={(e) => setNovoComp({ ...novoComp, tipo: e.target.value })}>
                  {Object.entries(TIPO_COMP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAddComp(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={adicionarComponente} className="erp-btn-primary text-xs flex items-center gap-1"><Save size={12} /> Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal duplicar BOM */}
      {showCopiarBOM && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Duplicar Lista de Materiais</h2>
              <button type="button" onClick={() => setShowCopiarBOM(false)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 text-sm text-muted-foreground">
              Será criada uma cópia da BOM <strong>Rev. {bomSel?.rev}</strong> com nova revisão. Os componentes serão copiados e você poderá editá-los.
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCopiarBOM(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={copiarBOM} className="erp-btn-primary text-xs flex items-center gap-1"><Copy size={12} /> Duplicar BOM</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar componente */}
      {editComp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Editar Componente — {editComp.codigo}</h2>
              <button type="button" onClick={() => setEditComp(null)}><XCircle size={16} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="erp-label">Quantidade</label>
                <input type="number" step="0.001" className="erp-input w-full" value={editComp.qtd}
                  onChange={(e) => setEditComp({ ...editComp, qtd: Number(e.target.value) })} />
              </div>
              <div>
                <label className="erp-label">% Perda</label>
                <input type="number" step="0.1" className="erp-input w-full" value={editComp.perda}
                  onChange={(e) => setEditComp({ ...editComp, perda: Number(e.target.value) })} />
              </div>
              <div>
                <label className="erp-label">Tipo</label>
                <select className="erp-input w-full" value={editComp.tipo}
                  onChange={(e) => setEditComp({ ...editComp, tipo: e.target.value })}>
                  {Object.entries(TIPO_COMP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Unidade</label>
                <select className="erp-input w-full" value={editComp.unidade}
                  onChange={(e) => setEditComp({ ...editComp, unidade: e.target.value })}>
                  {['kg', 'pc', 'm', 'm²', 'L', 'cj'].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={() => setEditComp(null)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button type="button" onClick={() => {
                setBomSel({ ...bomSel, componentes: bomSel.componentes.map((c) => c.id === editComp.id ? editComp : c) });
                setEditComp(null); toast.success('Componente atualizado!');
              }} className="erp-btn-primary text-xs flex items-center gap-1"><Save size={12} /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
