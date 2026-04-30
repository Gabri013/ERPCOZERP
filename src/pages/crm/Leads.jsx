import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus } from 'lucide-react';

const MOCK = [
  { id:'1', nome:'Fabricio Nunes', empresa:'Mec. Nunes Ltda', cargo:'Diretor', email:'fabricio@nunes.com', telefone:'(11) 9 8765-4321', origem:'Site', qualificacao:'Quente', responsavel:'Carlos Silva' },
  { id:'2', nome:'Lúcia Barros', empresa:'Ind. Barros', cargo:'Gerente Compras', email:'lucia@barros.com', telefone:'(13) 9 7654-3210', origem:'Indicação', qualificacao:'Morno', responsavel:'Ana Paula' },
  { id:'3', nome:'Henrique Dias', empresa:'Dias Usinagem', cargo:'Sócio', email:'henrique@dias.com', telefone:'(11) 9 6543-2109', origem:'Feira', qualificacao:'Frio', responsavel:'Rafael Costa' },
  { id:'4', nome:'Patrícia Souza', empresa:'Souza Metalúrgica', cargo:'Compradora', email:'patricia@souza.com', telefone:'(19) 9 5432-1098', origem:'LinkedIn', qualificacao:'Quente', responsavel:'Carlos Silva' },
];

const qualificacaoCor = { 'Quente':'bg-red-100 text-red-700', 'Morno':'bg-yellow-100 text-yellow-700', 'Frio':'bg-blue-100 text-blue-700' };

const columns = [
  { key:'nome', label:'Nome' },
  { key:'empresa', label:'Empresa', width:150 },
  { key:'cargo', label:'Cargo', width:130 },
  { key:'email', label:'E-mail', width:180 },
  { key:'telefone', label:'Telefone', width:130 },
  { key:'origem', label:'Origem', width:90 },
  { key:'qualificacao', label:'Temperatura', width:100, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${qualificacaoCor[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
  { key:'responsavel', label:'Responsável', width:110 },
];

export default function Leads() {
  return (
    <div>
      <PageHeader title="Leads" breadcrumbs={['Início','CRM','Leads']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Lead</button>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={MOCK} />
      </div>
    </div>
  );
}