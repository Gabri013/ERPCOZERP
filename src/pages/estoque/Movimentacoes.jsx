import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import ModalMovimentacao from '@/components/estoque/ModalMovimentacao';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { movimentacoesServiceApi } from '@/services/movimentacoesServiceApi';

export default function Movimentacoes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const rows = await movimentacoesServiceApi.getAll();
      setData(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (form) => {
    await movimentacoesServiceApi.create(form);
    await load();
  };

  const filtered = useMemo(() => {
    return data.filter(m => {
      const s = search.toLowerCase();
      return (!s || m.produto_descricao?.toLowerCase().includes(s) || m.numero?.includes(s))
        && (!filters.tipo || m.tipo === filters.tipo);
    });
  }, [data, search, filters.tipo]);

  const tipoCor = { Entrada:'bg-green-100 text-green-700', Saída:'bg-red-100 text-red-700', Transferência:'bg-blue-100 text-blue-700', Ajuste:'bg-yellow-100 text-yellow-700' };

  const columns = [
    { key:'numero', label:'Número', width:90 },
    { key:'tipo', label:'Tipo', width:100, render:v=>(
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${tipoCor[v]||'bg-gray-100 text-gray-600'}`}>
        {v==='Entrada'?<TrendingUp size={10}/>:v==='Saída'?<TrendingDown size={10}/>:null}{v}
      </span>
    )},
    { key:'produto_descricao', label:'Produto' },
    { key:'quantidade', label:'Qtd', width:60 },
    { key:'unidade', label:'UN', width:50 },
    { key:'custo_unitario', label:'Custo Unit.', width:100, render:v=>`R$ ${Number(v).toFixed(2).replace('.',',')}` },
    { key:'custo_total', label:'Total', width:100, render:v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
    { key:'data', label:'Data', width:90, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
    { key:'origem', label:'Origem', width:100 },
    { key:'responsavel', label:'Responsável', width:100 },
  ];

  return (
    <div>
      <PageHeader title="Movimentações de Estoque" breadcrumbs={['Início','Estoque','Movimentações']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Movimentação</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[{key:'tipo',label:'Tipo',options:['Entrada','Saída','Transferência','Ajuste'].map(s=>({value:s,label:s}))}]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} loading={loading}/>
      </div>
      {showModal && <ModalMovimentacao onClose={()=>setShowModal(false)} onSave={handleSave}/>}
    </div>
  );
}