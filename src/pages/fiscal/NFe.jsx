import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus, FileText } from 'lucide-react';

const MOCK = [
  { id:'1', numero:'000.001.245', serie:'1', destinatario:'Metalúrgica ABC Ltda', cnpj:'11.222.333/0001-44', data_emissao:'2026-04-18', valor:45200, chave:'35260412345678901234550010002450011', status:'Autorizada' },
  { id:'2', numero:'000.001.244', serie:'1', destinatario:'Ind. XYZ S/A', cnpj:'22.333.444/0001-55', data_emissao:'2026-04-16', valor:12800, chave:'35260412345678901234550010002440012', status:'Autorizada' },
  { id:'3', numero:'000.001.243', serie:'1', destinatario:'Comércio Beta', cnpj:'33.444.555/0001-66', data_emissao:'2026-04-14', valor:8900, chave:'35260412345678901234550010002430013', status:'Cancelada' },
  { id:'4', numero:'000.001.246', serie:'1', destinatario:'SiderTech S/A', cnpj:'44.555.666/0001-77', data_emissao:'2026-04-20', valor:18700, chave:null, status:'Em Digitação' },
];

const statusCor = {'Autorizada':'bg-green-100 text-green-700','Cancelada':'bg-red-100 text-red-700','Em Digitação':'bg-yellow-100 text-yellow-700','Rejeitada':'bg-orange-100 text-orange-700'};

const columns = [
  { key:'numero', label:'Número', width:120 },
  { key:'serie', label:'Série', width:50 },
  { key:'destinatario', label:'Destinatário' },
  { key:'cnpj', label:'CNPJ', width:150 },
  { key:'data_emissao', label:'Emissão', width:90, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'valor', label:'Valor', width:110, render:v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
  { key:'status', label:'Status', width:110, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusCor[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
];

export default function NFe() {
  return (
    <div>
      <PageHeader title="Emissão de NF-e" breadcrumbs={['Início','Fiscal','NF-e Emissão']}
        actions={<div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><FileText size={13}/> Importar XML</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova NF-e</button>
        </div>}
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={MOCK} />
      </div>
    </div>
  );
}