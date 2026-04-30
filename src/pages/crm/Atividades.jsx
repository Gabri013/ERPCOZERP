import PageHeader from '@/components/common/PageHeader';
import { Phone, Mail, Users, Calendar, Plus } from 'lucide-react';

const ATIVIDADES = [
  { id:'1', tipo:'Reunião', descricao:'Apresentação de proposta', empresa:'Metalúrgica ABC', contato:'Márcio Lima', data:'2026-04-21', hora:'10:00', responsavel:'Carlos Silva', status:'Pendente' },
  { id:'2', tipo:'Ligação', descricao:'Follow-up negociação eixos', empresa:'SiderTech S/A', contato:'Ana Ramos', data:'2026-04-21', hora:'14:30', responsavel:'Rafael Costa', status:'Pendente' },
  { id:'3', tipo:'E-mail', descricao:'Envio catálogo de produtos', empresa:'TechParts Ltda', contato:'Sandra P.', data:'2026-04-20', hora:'09:00', responsavel:'Ana Paula', status:'Concluído' },
  { id:'4', tipo:'Reunião', descricao:'Visita técnica', empresa:'Grupo Delta', contato:'João Faria', data:'2026-04-19', hora:'15:00', responsavel:'Carlos Silva', status:'Concluído' },
  { id:'5', tipo:'Ligação', descricao:'Negociação de prazo', empresa:'Usinagem Precisa', contato:'Roberto A.', data:'2026-04-22', hora:'11:00', responsavel:'Rafael Costa', status:'Pendente' },
];

const tipoIcon = { 'Reunião':<Users size={13}/>, 'Ligação':<Phone size={13}/>, 'E-mail':<Mail size={13}/>, 'Visita':<Calendar size={13}/> };
const tipoCor = { 'Reunião':'bg-blue-100 text-blue-700', 'Ligação':'bg-green-100 text-green-700', 'E-mail':'bg-purple-100 text-purple-700', 'Visita':`bg-orange-100 text-orange-700` };

export default function Atividades() {
  return (
    <div>
      <PageHeader title="Atividades" breadcrumbs={['Início','CRM','Atividades']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Nova Atividade</button>}
      />
      <div className="bg-white border border-border rounded-lg divide-y divide-border">
        {ATIVIDADES.map((a,i)=>(
          <div key={i} className="flex items-start gap-4 px-4 py-3 hover:bg-nomus-blue-light transition-colors">
            <div className="w-20 text-center shrink-0">
              <div className="text-xs font-bold text-foreground">{new Date(a.data+'T00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</div>
              <div className="text-[11px] text-muted-foreground">{a.hora}</div>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium shrink-0 ${tipoCor[a.tipo]}`}>
              {tipoIcon[a.tipo]}{a.tipo}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">{a.descricao}</div>
              <div className="text-[11px] text-muted-foreground">{a.empresa} — {a.contato}</div>
            </div>
            <div className="text-[11px] text-muted-foreground shrink-0">{a.responsavel}</div>
            <div className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${a.status==='Concluído'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>
              {a.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}