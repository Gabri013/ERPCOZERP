import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { Plus, Tag } from 'lucide-react';
import { tabelaPrecosServiceApi } from '@/services/tabelaPrecosServiceApi';

const UNIDADES = ['UN','KG','MT','PC','CX','L'];
const GRUPOS = ['Eixos','Rolamentos','Flanges','Fixadores','Redutores','Transmissão','Serviços'];

const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const calcMargem = (custo, venda) => custo > 0 ? (((venda - custo) / custo) * 100).toFixed(1) : '0.0';

export default function TabelaPrecos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [showReajuste, setShowReajuste] = useState(false);
  const [pctReajuste, setPctReajuste] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ codigo:'', descricao:'', grupo:'', unidade:'UN', preco_custo:0, preco_venda:0 });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  async function load() {
    setLoading(true);
    try {
      const rows = await tabelaPrecosServiceApi.getAll({ search: '', grupo: '' });
      setData(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const openEdit = (row) => {
    setEditando(row);
    setForm(row);
    setShowModal(true);
  };

  const handleSave = async () => {
    if(!form.descricao) return alert('Informe a descrição');
    setSaving(true);
    try {
      if (editando?.id) {
        await tabelaPrecosServiceApi.update(editando.id, { ...form, id: editando.id });
      } else {
        await tabelaPrecosServiceApi.create(form);
      }
      await load();
    } finally {
      setSaving(false);
    }
    setSaving(false);
    setShowModal(false); setEditando(null);
    setForm({ codigo:'', descricao:'', grupo:'', unidade:'UN', preco_custo:0, preco_venda:0 });
  };

  const aplicarReajuste = async () => {
    const pct = Number(pctReajuste);
    if(!pct) return alert('Informe o percentual');
    setSaving(true);
    try {
      await Promise.all(
        data.map((p) =>
          tabelaPrecosServiceApi.update(p.id, {
            ...p,
            preco_venda: +(Number(p.preco_venda || 0) * (1 + pct / 100)).toFixed(2),
          })
        )
      );
      await load();
    } finally {
      setSaving(false);
    }
    setPctReajuste(''); setShowReajuste(false);
  };

  const grupos = useMemo(() => [...new Set(data.map(m=>m.grupo).filter(Boolean))], [data]);
  const filtered = useMemo(() => {
    return data.filter(p=>{
      const s=search.toLowerCase();
      return (!s||p.codigo?.toLowerCase().includes(s)||p.descricao?.toLowerCase().includes(s))
        &&(!filters.grupo||p.grupo===filters.grupo);
    });
  }, [data, search, filters.grupo]);

  const columns = [
    { key:'codigo', label:'Código', width:80 },
    { key:'descricao', label:'Descrição', render:(v,row)=><button className="text-primary hover:underline text-left" onClick={e=>{e.stopPropagation();openEdit(row);}}>{v}</button> },
    { key:'grupo', label:'Grupo', width:110 },
    { key:'unidade', label:'UN', width:50 },
    { key:'preco_custo', label:'Custo', width:110, render:fmtR },
    { key:'preco_venda', label:'Venda', width:110, render:fmtR },
    { key:'preco_venda', label:'Margem %', width:90, render:(v,row)=>{
      const m=Number(calcMargem(row.preco_custo,v));
      return <span className={`font-medium ${m>80?'text-success':m>50?'text-warning':'text-destructive'}`}>{m.toFixed(1)}%</span>;
    }},
  ];

  return (
    <div>
      <PageHeader title="Tabela de Preços" breadcrumbs={['Início','Vendas','Tabela de Preços']}
        actions={<div className="flex gap-2">
          <button onClick={()=>setShowReajuste(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Tag size={13}/> Reajuste em Lote</button>
          <button onClick={()=>{setEditando(null);setForm({ codigo:'', descricao:'', grupo:'', unidade:'UN', preco_custo:0, preco_venda:0 });setShowModal(true);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Item</button>
        </div>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[{key:'grupo',label:'Grupo',options:grupos.map(g=>({value:g,label:g}))}]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>openEdit(row)} loading={loading}/>
      </div>

      {showModal && (
        <FormModal title={editando?`Editar — ${editando.descricao}`:'Novo Item'} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Código</label><input className={inp} value={form.codigo} onChange={e=>upd('codigo',e.target.value)}/></div>
              <div><label className={lbl}>Unidade</label><select className={inp} value={form.unidade} onChange={e=>upd('unidade',e.target.value)}>{UNIDADES.map(u=><option key={u}>{u}</option>)}</select></div>
            </div>
            <div><label className={lbl}>Descrição {req}</label><input className={inp} value={form.descricao} onChange={e=>upd('descricao',e.target.value)}/></div>
            <div><label className={lbl}>Grupo</label><select className={inp} value={form.grupo} onChange={e=>upd('grupo',e.target.value)}><option value="">Selecionar...</option>{GRUPOS.map(g=><option key={g}>{g}</option>)}</select></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Custo (R$)</label><input type="number" min="0" step="0.01" className={inp} value={form.preco_custo} onChange={e=>upd('preco_custo',Number(e.target.value))}/></div>
              <div><label className={lbl}>Venda (R$)</label><input type="number" min="0" step="0.01" className={inp} value={form.preco_venda} onChange={e=>upd('preco_venda',Number(e.target.value))}/></div>
              <div><label className={lbl}>Margem</label><input className={`${inp} bg-muted`} readOnly value={`${calcMargem(form.preco_custo,form.preco_venda)}%`}/></div>
            </div>
          </div>
        </FormModal>
      )}

      {showReajuste && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Tag size={14}/> Reajuste em Lote</h3>
            <p className="text-xs text-muted-foreground mb-3">Aplica o percentual ao preço de venda de todos os itens.</p>
            <div className="flex items-center gap-2 mb-4">
              <input type="number" step="0.1" className={`${inp} flex-1`} value={pctReajuste} onChange={e=>setPctReajuste(e.target.value)} placeholder="Ex: 5 para +5% ou -3 para -3%"/>
              <span className="text-sm font-medium">%</span>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setShowReajuste(false)} className="px-4 py-1.5 text-xs border border-border rounded hover:bg-muted">Cancelar</button>
              <button onClick={aplicarReajuste} className="px-4 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">Aplicar Reajuste</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}