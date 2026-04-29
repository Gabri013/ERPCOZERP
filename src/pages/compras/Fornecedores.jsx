import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalFornecedor from '@/components/compras/ModalFornecedor';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus } from 'lucide-react';
import { storage } from '@/services/storage';

const MOCK_INICIAL = [
  { id:'1', codigo:'FOR-001', razao_social:'Rolamentos Nacionais Ltda', cnpj_cpf:'11.222.333/0001-44', cidade:'São Paulo', estado:'SP', telefone:'(11) 3333-1111', contato:'Márcio Lima', email:'contato@rolamentos.com', prazo_entrega:7, status:'Ativo' },
  { id:'2', codigo:'FOR-002', razao_social:'AçoFlex Distribuidora', cnpj_cpf:'22.333.444/0001-55', cidade:'Mogi das Cruzes', estado:'SP', telefone:'(11) 4444-2222', contato:'Fernanda Reis', email:'acoflex@dist.com', prazo_entrega:5, status:'Ativo' },
  { id:'3', codigo:'FOR-003', razao_social:'Fixadores do Brasil S/A', cnpj_cpf:'33.444.555/0001-66', cidade:'Santo André', estado:'SP', telefone:'(11) 5555-3333', contato:'Roberto Silva', email:'roberto@fixadores.com', prazo_entrega:3, status:'Ativo' },
  { id:'4', codigo:'FOR-004', razao_social:'Motores Elite S/A', cnpj_cpf:'44.555.666/0001-77', cidade:'Indaiatuba', estado:'SP', telefone:'(19) 6666-4444', contato:'Cláudia M.', email:'claudia@motores.com', prazo_entrega:15, status:'Ativo' },
  { id:'5', codigo:'FOR-005', razao_social:'Correias e Polias Ltda', cnpj_cpf:'55.666.777/0001-88', cidade:'Jundiaí', estado:'SP', telefone:'(11) 7777-5555', contato:'Paulo C.', email:'paulo@correias.com', prazo_entrega:10, status:'Inativo' },
];

if (!localStorage.getItem('nomus_erp_fornecedores')) storage.set('fornecedores', MOCK_INICIAL);
const getData = () => storage.get('fornecedores', MOCK_INICIAL);
const saveData = d => storage.set('fornecedores', d);

export default function Fornecedores() {
  const [data, setData] = useState(getData());
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  const reload = () => setData([...getData()]);

  const handleSave = (form) => {
    const all = getData();
    if (editando) {
      saveData(all.map(f => f.id === editando.id ? {...editando,...form} : f));
    } else {
      const codigo = `FOR-${String(all.length + 6).padStart(3,'0')}`;
      saveData([{...form, id:Date.now().toString(), codigo}, ...all]);
    }
    reload();
    setEditando(null);
  };

  const filtered = data.filter(f => {
    const s = search.toLowerCase();
    return (!s || f.razao_social?.toLowerCase().includes(s) || f.cnpj_cpf?.includes(s))
      && (!filters.status || f.status === filters.status);
  });

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
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Fornecedor</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[{key:'status',label:'Status',options:['Ativo','Inativo'].map(s=>({value:s,label:s}))}]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)}/>
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
          <div className="mt-3 flex justify-end"><button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90">Editar</button></div>
        </DetalheModal>
      )}
    </div>
  );
}