import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';

const ROTEIROS = [
  {
    id:'1', produto:'Eixo Transmissão 25mm', codigo:'A-001', operacoes:[
      {seq:10, descricao:'Torneamento externo', maquina:'Torno CNC 1', tempo:45, setup:15, unidade:'min/pc'},
      {seq:20, descricao:'Fresamento de chaveta', maquina:'Fresadora Conv.', tempo:20, setup:10, unidade:'min/pc'},
      {seq:30, descricao:'Retificação cilíndrica', maquina:'Retífica CIL-01', tempo:30, setup:20, unidade:'min/pc'},
      {seq:40, descricao:'Inspeção de qualidade', maquina:'Bancada Inspeção', tempo:10, setup:5, unidade:'min/pc'},
    ]
  },
  {
    id:'2', produto:'Flange Aço Inox 3"', codigo:'B-001', operacoes:[
      {seq:10, descricao:'Torneamento interno/externo', maquina:'Torno CNC 2', tempo:60, setup:20, unidade:'min/pc'},
      {seq:20, descricao:'Furação de flange', maquina:'Centro Usinagem', tempo:25, setup:15, unidade:'min/pc'},
      {seq:30, descricao:'Inspeção final', maquina:'Bancada Inspeção', tempo:8, setup:5, unidade:'min/pc'},
    ]
  },
];

function RoteiItem({r}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden mb-2">
      <button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-muted transition-colors text-left">
        <div className="flex items-center gap-3">
          {open?<ChevronDown size={14} className="text-muted-foreground"/>:<ChevronRight size={14} className="text-muted-foreground"/>}
          <span className="text-xs font-semibold">{r.produto}</span>
          <span className="text-[11px] text-muted-foreground">{r.codigo}</span>
        </div>
        <span className="text-[11px] text-muted-foreground">{r.operacoes.length} operações</span>
      </button>
      {open && (
        <table className="w-full text-xs border-t border-border">
          <thead><tr className="bg-muted">
            <th className="text-left px-4 py-2 font-medium text-muted-foreground w-12">Seq.</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Operação</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground w-40">Máquina</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground w-28">Tempo</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground w-20">Setup</th>
          </tr></thead>
          <tbody>
            {r.operacoes.map((o,i)=>(
              <tr key={i} className="border-t border-border hover:bg-nomus-blue-light">
                <td className="px-4 py-2 font-bold text-primary">{o.seq}</td>
                <td className="px-4 py-2">{o.descricao}</td>
                <td className="px-4 py-2 text-muted-foreground">{o.maquina}</td>
                <td className="px-4 py-2">{o.tempo} {o.unidade}</td>
                <td className="px-4 py-2">{o.setup} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Roteiros() {
  return (
    <div>
      <PageHeader title="Roteiros de Produção" breadcrumbs={['Início','Produção','Roteiros']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Roteiro</button>}
      />
      <div>{ROTEIROS.map(r=><RoteiItem key={r.id} r={r}/>)}</div>
    </div>
  );
}