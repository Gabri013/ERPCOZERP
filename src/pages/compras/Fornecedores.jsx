import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalFornecedor from '@/components/compras/ModalFornecedor';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus } from 'lucide-react';
import { fornecedoresService } from '@/services/fornecedoresService';

export default function Fornecedores() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = async (opts = {}) => {
    setLoading(true);
    try {
      const rows = await fornecedoresService.getAll({ search: opts.search ?? search });
      setData(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (form) => {
    if (editando?.id) {
      await fornecedoresService.update(editando.id, { ...editando, ...form });
    } else {
      await fornecedoresService.create(form);
    }
    await reload({ search });
    setEditando(null);
  };

  const filtered = useMemo(() => data.filter(f => {
    const s = search.toLowerCase();
    return (!s || f.razao_social?.toLowerCase().includes(s) || f.cnpj_cpf?.includes(s))
      && (!filters.status || f.status === filters.status);
  }), [data, search, filters]);

  const columns = [
    { key:'codigo', label:'Código', width:80 },
    { key:'razao_social', label:'Razão Social', render:(v,row)=><button className="text-primary hover:underline text-left font-medium" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'cnpj_cpf', label:'CNPJ', width:150 },
    { key:'cidade', label:'Cidade', width:110 },
    { key:'estado', label:'UF', width:50 },
    { key:'telefone', label:'Telefone', width:120 },
    { key:'contato', label:'Contato', width:110 },
    { key:'prazo_entrega', label:'Prazo (dias)', width:100, render:v=>v?`${v} dias`:'—' },
    { key:'status', label:'Status', width:80, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Fornecedores" breadcrumbs={['Início','Compras','Fornecedores']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Fornecedor</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[{key:'status',label:'Status',options:['Ativo','Inativo'].map(s=>({value:s,label:s}))}]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({}); reload({ search: '' });}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)} loading={loading}/>
      </div>

      {(showModal || editando) && (
        <ModalFornecedor fornecedor={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={detalhe.razao_social} subtitle={`Código: ${detalhe.codigo}`} onClose={()=>setDetalhe(null)}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['CNPJ/CPF',detalhe.cnpj_cpf],['Telefone',detalhe.telefone],['E-mail',detalhe.email||'—'],['Contato',detalhe.contato],['Prazo Entrega',`${detalhe.prazo_entrega} dias`],['Cidade/UF',`${detalhe.cidade}/${detalhe.estado}`],['Status',detalhe.status]].map(([k,v])=>(
              <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={async () => {
                if (!confirm('Excluir este fornecedor?')) return;
                await fornecedoresService.delete(detalhe.id);
                setDetalhe(null);
                await reload({ search });
              }}
              className="px-3 py-1.5 text-xs bg-destructive text-white rounded hover:opacity-90"
            >
              Excluir
            </button>
            <button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">Editar</button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}