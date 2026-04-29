import PageHeader from '@/components/common/PageHeader';
import { Download, CheckCircle, Clock } from 'lucide-react';

const OBRIGACOES = [
  { nome:'SPED Fiscal (EFD-ICMS/IPI)', competencia:'Mar/2026', vencimento:'25/04/2026', status:'Pendente' },
  { nome:'SPED Contribuições (EFD-PIS/COFINS)', competencia:'Mar/2026', vencimento:'25/04/2026', status:'Pendente' },
  { nome:'SPED Contábil (ECD)', competencia:'2025', vencimento:'30/06/2026', status:'Pendente' },
  { nome:'ECF (Escrituração Contábil Fiscal)', competencia:'2025', vencimento:'31/07/2026', status:'Pendente' },
  { nome:'SPED Fiscal (EFD-ICMS/IPI)', competencia:'Fev/2026', vencimento:'25/03/2026', status:'Entregue' },
  { nome:'SPED Contribuições (EFD-PIS/COFINS)', competencia:'Fev/2026', vencimento:'25/03/2026', status:'Entregue' },
];

export default function SPED() {
  return (
    <div>
      <PageHeader title="SPED — Obrigações Acessórias" breadcrumbs={['Início','Fiscal','SPED']}/>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {label:'Pendentes',val:OBRIGACOES.filter(o=>o.status==='Pendente').length,color:'text-warning',bg:'bg-yellow-50'},
          {label:'Entregues',val:OBRIGACOES.filter(o=>o.status==='Entregue').length,color:'text-success',bg:'bg-green-50'},
        ].map(k=>(
          <div key={k.label} className={`${k.bg} border border-border rounded px-4 py-3 text-center`}>
            <div className={`text-2xl font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border"><h3 className="text-sm font-semibold">Agenda de Obrigações</h3></div>
        <table className="w-full text-xs">
          <thead><tr className="bg-muted border-b border-border">
            {['Obrigação','Competência','Vencimento','Status','Ação'].map(h=>(
              <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {OBRIGACOES.map((o,i)=>(
              <tr key={i} className="border-b border-border last:border-0 hover:bg-nomus-blue-light">
                <td className="px-4 py-2 font-medium">{o.nome}</td>
                <td className="px-4 py-2">{o.competencia}</td>
                <td className="px-4 py-2">{o.vencimento}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    {o.status==='Entregue'?<CheckCircle size={12} className="text-success"/>:<Clock size={12} className="text-warning"/>}
                    <span className={o.status==='Entregue'?'text-success':'text-warning'}>{o.status}</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  {o.status==='Entregue'
                    ?<button className="flex items-center gap-1 text-[11px] text-primary hover:underline"><Download size={11}/>Baixar</button>
                    :<button className="text-[11px] nomus-blue-bg text-white px-2 py-0.5 rounded hover:opacity-90">Gerar</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}