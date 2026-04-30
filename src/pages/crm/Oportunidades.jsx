import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Plus } from 'lucide-react';

const MOCK = [
  { id:'1', titulo:'Fornecimento anual rolamentos', empresa:'Metalúrgica ABC', contato:'Márcio Lima', valor:180000, estagio:'Proposta', probabilidade:70, fechamento:'2026-05-30', responsavel:'Carlos Silva' },
  { id:'2', titulo:'Projeto eixos transmissão lote', empresa:'SiderTech S/A', contato:'Ana Ramos', valor:95000, estagio:'Negociação', probabilidade:85, fechamento:'2026-04-30', responsavel:'Rafael Costa' },
  { id:'3', titulo:'Manutenção preventiva anual', empresa:'Grupo Delta', contato:'João Faria', valor:42000, estagio:'Qualificação', probabilidade:40, fechamento:'2026-06-15', responsavel:'Carlos Silva' },
  { id:'4', titulo:'Fornecimento flanges especiais', empresa:'TechParts Ltda', contato:'Sandra P.', valor:28500, estagio:'Contato Inicial', probabilidade:20, fechamento:'2026-07-01', responsavel:'Ana Paula' },
  { id:'5', titulo:'Contrato serviços usinagem', empresa:'Usinagem Precisa', contato:'Roberto A.', valor:65000, estagio:'Fechado Ganho', probabilidade:100, fechamento:'2026-04-15', responsavel:'Rafael Costa' },
];

const estagioColors = {'Contato Inicial':'bg-gray-100 text-gray-600','Qualificação':'bg-blue-100 text-blue-700','Proposta':'bg-yellow-100 text-yellow-700','Negociação':'bg-orange-100 text-orange-700','Fechado Ganho':'bg-green-100 text-green-700','Fechado Perdido':'bg-red-100 text-red-700'};

const columns = [
  { key:'titulo', label:'Oportunidade' },
  { key:'empresa', label:'Empresa', width:150 },
  { key:'contato', label:'Contato', width:120 },
  { key:'valor', label:'Valor', width:110, render:v=>`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
  { key:'estagio', label:'Estágio', width:130, render:v=><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${estagioColors[v]||'bg-gray-100 text-gray-600'}`}>{v}</span>, sortable:false },
  { key:'probabilidade', label:'%', width:60, render:v=><span className={`font-bold ${v>=80?'text-success':v>=50?'text-warning':'text-muted-foreground'}`}>{v}%</span> },
  { key:'fechamento', label:'Fechamento', width:100, render:v=>v?new Date(v+'T00:00').toLocaleDateString('pt-BR'):'—' },
  { key:'responsavel', label:'Responsável', width:110 },
];

export default function Oportunidades() {
  const pipeline = MOCK.filter(m=>m.estagio!=='Fechado Ganho'&&m.estagio!=='Fechado Perdido').reduce((s,m)=>s+m.valor,0);
  return (
    <div>
      <PageHeader title="Oportunidades" breadcrumbs={['Início','CRM','Oportunidades']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Oportunidade</button>}
      />
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          {label:'Pipeline Total',val:`R$ ${pipeline.toLocaleString('pt-BR',{minimumFractionDigits:2})}`,color:'text-primary'},
          {label:'Oportunidades Ativas',val:MOCK.filter(m=>!m.estagio.startsWith('Fechado')).length,color:'text-foreground'},
          {label:'Ganhas no Mês',val:MOCK.filter(m=>m.estagio==='Fechado Ganho').length,color:'text-success'},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3">
            <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={MOCK} />
      </div>
    </div>
  );
}