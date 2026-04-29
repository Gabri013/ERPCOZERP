import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalCliente from '@/components/vendas/ModalCliente';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download } from 'lucide-react';
import { storage } from '@/services/storage';
import { exportPdfReport } from '@/services/pdfExport';

const MOCK_INICIAL = [
  { id:'1', codigo:'CLI-001', razao_social:'Metalúrgica ABC Ltda', nome_fantasia:'Metalúrgica ABC', cnpj_cpf:'12.345.678/0001-90', cidade:'São Paulo', estado:'SP', telefone:'(11) 9999-0001', email:'contato@metalurgica.com', status:'Ativo', limite_credito:50000, contato:'Roberto A.' },
  { id:'2', codigo:'CLI-002', razao_social:'Ind. XYZ S/A', nome_fantasia:'XYZ Indústria', cnpj_cpf:'98.765.432/0001-11', cidade:'Campinas', estado:'SP', telefone:'(19) 9888-0002', email:'xyz@ind.com', status:'Ativo', limite_credito:80000, contato:'Sandra M.' },
  { id:'3', codigo:'CLI-003', razao_social:'Comércio Beta ME', nome_fantasia:'Beta', cnpj_cpf:'11.222.333/0001-44', cidade:'Santo André', estado:'SP', telefone:'(11) 9777-0003', email:'beta@comercio.com', status:'Ativo', limite_credito:20000, contato:'Paulo R.' },
  { id:'4', codigo:'CLI-004', razao_social:'Grupo Delta S/A', nome_fantasia:'Grupo Delta', cnpj_cpf:'55.666.777/0001-88', cidade:'Ribeirão Preto', estado:'SP', telefone:'(16) 9666-0004', email:'delta@grupo.com', status:'Ativo', limite_credito:120000, contato:'Luciana C.' },
  { id:'5', codigo:'CLI-005', razao_social:'TechParts Ltda', nome_fantasia:'TechParts', cnpj_cpf:'33.444.555/0001-22', cidade:'Sorocaba', estado:'SP', telefone:'(15) 9555-0005', email:'tech@parts.com', status:'Inativo', limite_credito:30000, contato:'Marcos F.' },
];

if (!localStorage.getItem('nomus_erp_clientes')) storage.set('clientes', MOCK_INICIAL);
const getData = () => storage.get('clientes', MOCK_INICIAL);
const saveData = d => storage.set('clientes', d);
const fmtR = v => v ? `R$ ${Number(v).toLocaleString('pt-BR')}` : '—';

export default function Clientes() {
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
      saveData(all.map(c => c.id === editando.id ? {...editando,...form} : c));
    } else {
      const codigo = `CLI-${String(all.length + 6).padStart(3,'0')}`;
      saveData([{...form, id:Date.now().toString(), codigo}, ...all]);
    }
    reload();
    setEditando(null);
  };

  const handleExportar = () => {
    exportPdfReport({
      title: 'Clientes',
      subtitle: 'Cadastro de clientes e limites comerciais',
      filename: 'clientes.pdf',
      table: {
        headers: ['Código', 'Razão Social', 'Fantasia', 'CNPJ/CPF', 'Cidade', 'UF', 'Telefone', 'Limite Crédito', 'Status'],
        rows: getData().map((cliente) => [
          cliente.codigo,
          cliente.razao_social,
          cliente.nome_fantasia,
          cliente.cnpj_cpf,
          cliente.cidade,
          cliente.estado,
          cliente.telefone,
          fmtR(cliente.limite_credito),
          cliente.status,
        ]),
      },
    });
  };

  const filtered = data.filter(c => {
    const s = search.toLowerCase();
    return (!s || c.razao_social?.toLowerCase().includes(s) || c.cnpj_cpf?.includes(s) || c.codigo?.includes(s))
      && (!filters.status || c.status === filters.status);
  });

  const columns = [
    { key:'codigo', label:'Código', width:80 },
    { key:'razao_social', label:'Razão Social', render:(v,row)=><button className="text-primary hover:underline text-left font-medium" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'nome_fantasia', label:'Fantasia', width:130 },
    { key:'cnpj_cpf', label:'CNPJ/CPF', width:150 },
    { key:'cidade', label:'Cidade', width:110 },
    { key:'estado', label:'UF', width:50 },
    { key:'telefone', label:'Telefone', width:120 },
    { key:'limite_credito', label:'Limite Crédito', width:120, render:fmtR },
    { key:'status', label:'Status', width:80, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Clientes" breadcrumbs={['Início','Vendas','Clientes']}
        actions={
          <div className="flex gap-2">
            <button onClick={handleExportar} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={13}/> Exportar PDF</button>
            <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Cliente</button>
          </div>
        }
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[{key:'status',label:'Status',options:['Ativo','Inativo','Bloqueado'].map(s=>({value:s,label:s}))}]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)}/>
      </div>

      {(showModal || editando) && (
        <ModalCliente cliente={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={detalhe.razao_social} subtitle={`Código: ${detalhe.codigo}`} onClose={()=>setDetalhe(null)}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {[['Razão Social',detalhe.razao_social],['Nome Fantasia',detalhe.nome_fantasia],['CNPJ/CPF',detalhe.cnpj_cpf],['Status',detalhe.status],['Cidade/UF',`${detalhe.cidade||'—'}/${detalhe.estado||'—'}`],['Telefone',detalhe.telefone],['E-mail',detalhe.email||'—'],['Contato',detalhe.contato||'—'],['Limite Crédito',fmtR(detalhe.limite_credito)]].map(([k,v])=>(
              <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90">Editar</button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}