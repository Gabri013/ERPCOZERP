import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import ModalMovimentacao from '@/components/estoque/ModalMovimentacao';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { storage } from '@/services/storage';

const MOCK_INICIAL = [
  { id:'1', numero:'MOV-001', tipo:'Entrada', produto_descricao:'Rolamento 6205-ZZ', quantidade:100, unidade:'UN', custo_unitario:8.20, custo_total:820.00, data:'2026-04-18', origem:'OC-00231', responsavel:'João M.' },
  { id:'2', numero:'MOV-002', tipo:'Saída', produto_descricao:'Eixo Transmissão 25mm', quantidade:10, unidade:'UN', custo_unitario:45.50, custo_total:455.00, data:'2026-04-17', origem:'OP-00542', responsavel:'Pedro A.' },
  { id:'3', numero:'MOV-003', tipo:'Entrada', produto_descricao:'Chapa Aço 3mm', quantidade:20, unidade:'PC', custo_unitario:320.00, custo_total:6400.00, data:'2026-04-16', origem:'OC-00230', responsavel:'João M.' },
  { id:'4', numero:'MOV-004', tipo:'Ajuste', produto_descricao:'Parafuso M8x30', quantidade:50, unidade:'CX', custo_unitario:12.50, custo_total:625.00, data:'2026-04-15', origem:'Inventário', responsavel:'Maria L.' },
  { id:'5', numero:'MOV-005', tipo:'Saída', produto_descricao:'Motor Elétrico 1CV', quantidade:2, unidade:'UN', custo_unitario:580.00, custo_total:1160.00, data:'2026-04-14', origem:'PV-00540', responsavel:'Pedro A.' },
];

if (!localStorage.getItem('nomus_erp_movimentacoes')) storage.set('movimentacoes', MOCK_INICIAL);
const getData = () => storage.get('movimentacoes', MOCK_INICIAL);
const saveData = d => storage.set('movimentacoes', d);

export default function Movimentacoes() {
  const [data, setData] = useState(getData());
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);

  const reload = () => setData([...getData()]);

  const handleSave = (form) => {
    const all = getData();
    const numero = `MOV-${String(all.length + 6).padStart(3,'0')}`;
    saveData([{...form, id:Date.now().toString(), numero}, ...all]);
    reload();
  };

  const filtered = data.filter(m => {
    const s = search.toLowerCase();
    return (!s || m.produto_descricao?.toLowerCase().includes(s) || m.numero?.includes(s))
      && (!filters.tipo || m.tipo === filters.tipo);
  });

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
        <DataTable columns={columns} data={filtered}/>
      </div>
      {showModal && <ModalMovimentacao onClose={()=>setShowModal(false)} onSave={handleSave}/>}
    </div>
  );
}