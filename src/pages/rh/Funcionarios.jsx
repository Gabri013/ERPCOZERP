import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalFuncionario from '@/components/rh/ModalFuncionario';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus } from 'lucide-react';
import { storage } from '@/services/storage';

const MOCK_INICIAL = [
  { id:'1', matricula:'MAT-001', nome:'João Melo', cargo:'Operador CNC', departamento:'Produção', tipo_contrato:'CLT', salario:3200, data_admissao:'2021-03-15', status:'Ativo', email:'joao@empresa.com', telefone:'(11) 99999-0001' },
  { id:'2', matricula:'MAT-002', nome:'Pedro Alves', cargo:'Torneiro Mecânico', departamento:'Produção', tipo_contrato:'CLT', salario:3800, data_admissao:'2019-07-22', status:'Ativo', email:'pedro@empresa.com', telefone:'(11) 99999-0002' },
  { id:'3', matricula:'MAT-003', nome:'Maria Lima', cargo:'Analista de Qualidade', departamento:'Qualidade', tipo_contrato:'CLT', salario:4500, data_admissao:'2020-11-05', status:'Ativo', email:'maria@empresa.com', telefone:'(11) 99999-0003' },
  { id:'4', matricula:'MAT-004', nome:'Carlos Santos', cargo:'Gerente de Vendas', departamento:'Vendas', tipo_contrato:'CLT', salario:7200, data_admissao:'2018-01-10', status:'Ativo', email:'carlos@empresa.com', telefone:'(11) 99999-0004' },
  { id:'5', matricula:'MAT-005', nome:'Ana Paula', cargo:'Analista Financeiro', departamento:'Financeiro', tipo_contrato:'CLT', salario:5100, data_admissao:'2022-06-18', status:'Ativo', email:'ana@empresa.com', telefone:'(11) 99999-0005' },
  { id:'6', matricula:'MAT-006', nome:'Rafael Costa', cargo:'Vendedor Externo', departamento:'Vendas', tipo_contrato:'CLT', salario:3000, data_admissao:'2023-02-01', status:'Ativo', email:'rafael@empresa.com', telefone:'(11) 99999-0006' },
  { id:'7', matricula:'MAT-007', nome:'Fernanda Souza', cargo:'Analista de RH', departamento:'RH', tipo_contrato:'CLT', salario:4200, data_admissao:'2021-09-12', status:'Férias', email:'fernanda@empresa.com', telefone:'(11) 99999-0007' },
];

if (!localStorage.getItem('nomus_erp_funcionarios')) storage.set('funcionarios', MOCK_INICIAL);
const getData = () => storage.get('funcionarios', MOCK_INICIAL);
const saveData = d => storage.set('funcionarios', d);
const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR')}`;
const fmtD = v => v ? new Date(v+'T00:00').toLocaleDateString('pt-BR') : '—';

export default function Funcionarios() {
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
      const matricula = `MAT-${String(all.length + 8).padStart(3,'0')}`;
      saveData([{...form, id:Date.now().toString(), matricula}, ...all]);
    }
    reload();
    setEditando(null);
  };

  const filtered = data.filter(f => {
    const s = search.toLowerCase();
    return (!s || f.nome?.toLowerCase().includes(s) || f.cargo?.toLowerCase().includes(s))
      && (!filters.departamento || f.departamento === filters.departamento)
      && (!filters.status || f.status === filters.status);
  });

  const deptos = [...new Set(MOCK_INICIAL.map(m => m.departamento))];

  const columns = [
    { key:'matricula', label:'Matrícula', width:90 },
    { key:'nome', label:'Nome', render:(v,row)=><button className="text-primary hover:underline text-left font-medium" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'cargo', label:'Cargo', width:150 },
    { key:'departamento', label:'Depto.', width:110 },
    { key:'tipo_contrato', label:'Contrato', width:80 },
    { key:'salario', label:'Salário', width:100, render:fmtR },
    { key:'data_admissao', label:'Admissão', width:90, render:fmtD },
    { key:'status', label:'Status', width:80, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Funcionários" breadcrumbs={['Início','RH','Funcionários']}
        actions={<button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Funcionário</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[
            {key:'departamento',label:'Departamento',options:deptos.map(d=>({value:d,label:d}))},
            {key:'status',label:'Status',options:['Ativo','Inativo','Férias','Afastado'].map(s=>({value:s,label:s}))},
          ]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)}/>
      </div>

      {(showModal || editando) && (
        <ModalFuncionario funcionario={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={detalhe.nome} subtitle={`${detalhe.matricula} · ${detalhe.cargo}`} onClose={()=>setDetalhe(null)}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Departamento',detalhe.departamento],['Cargo',detalhe.cargo],['Contrato',detalhe.tipo_contrato],['Salário',fmtR(detalhe.salario)],['Admissão',fmtD(detalhe.data_admissao)],['Status',detalhe.status],['E-mail',detalhe.email||'—'],['Telefone',detalhe.telefone||'—']].map(([k,v])=>(
              <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="mt-3 flex justify-end"><button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">Editar</button></div>
        </DetalheModal>
      )}
    </div>
  );
}