import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import FluxoProducao from '@/components/producao/FluxoProducao';

const semana = ['Seg 21/04','Ter 22/04','Qua 23/04','Qui 24/04','Sex 25/04'];

const ordens = [
  { op:'OP-00540', produto:'Flange Aço Inox 3"', maquina:'Torno CNC 1', dias:[1,1,1,0,0], status:'Em Andamento', prioridade:'Urgente' },
  { op:'OP-00542', produto:'Eixo Transmissão 25mm', maquina:'Torno CNC 2', dias:[1,1,1,1,0], status:'Em Andamento', prioridade:'Alta' },
  { op:'OP-00541', produto:'Conjunto Rolamento', maquina:'Centro Usinage', dias:[0,1,1,1,1], status:'Aberta', prioridade:'Normal' },
  { op:'OP-00543', produto:'Bucha Bronze 30x40', maquina:'Torno Conv.', dias:[0,0,1,1,1], status:'Aberta', prioridade:'Baixa' },
];

const cores = { 'Em Andamento':'bg-orange-400', 'Aberta':'bg-blue-400', 'Concluída':'bg-green-400' };

export default function PCP() {
  return (
    <div>
      <PageHeader title="Planejamento e Controle de Produção (PCP)" breadcrumbs={['Início','Produção','PCP']}
        actions={<select className="text-xs border border-border rounded px-2 py-1.5 bg-white outline-none"><option>Semana 17 — Abr/2026</option></select>}
      />
      <FluxoProducao />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          {label:'OPs Abertas',val:'4',color:'text-blue-600'},{label:'Em Andamento',val:'2',color:'text-orange-600'},
          {label:'Previstas Semana',val:'280 un',color:'text-foreground'},{label:'Eficiência',val:'91%',color:'text-success'},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3 text-center">
            <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border"><h3 className="text-sm font-semibold">Gantt da Semana</h3></div>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">OP</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Produto</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-36">Máquina</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Prioridade</th>
                {semana.map(d=><th key={d} className="px-3 py-2 font-medium text-muted-foreground text-center w-24">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {ordens.map((o,i)=>(
                <tr key={i} className="border-b border-border hover:bg-nomus-blue-light last:border-0">
                  <td className="px-3 py-2 font-medium text-primary">{o.op}</td>
                  <td className="px-3 py-2">{o.produto}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.maquina}</td>
                  <td className="px-3 py-2"><StatusBadge status={o.prioridade}/></td>
                  {o.dias.map((d,j)=>(
                    <td key={j} className="px-3 py-2 text-center">
                      {d===1 && <div className={`${cores[o.status]} rounded h-6 mx-1`}/>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground">
          {Object.entries(cores).map(([k,v])=><div key={k} className="flex items-center gap-1"><div className={`w-3 h-3 rounded ${v}`}/>{k}</div>)}
        </div>
      </div>
    </div>
  );
}