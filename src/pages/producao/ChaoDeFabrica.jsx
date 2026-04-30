import PageHeader from '@/components/common/PageHeader';
import FluxoProducao from '@/components/producao/FluxoProducao';

const MAQUINAS = [
  { id:'TNC-01', nome:'Torno CNC 1', op:'OP-00542', produto:'Eixo Transmissão 25mm', operador:'João M.', inicio:'08:00', progresso:65, status:'Em Andamento' },
  { id:'TNC-02', nome:'Torno CNC 2', op:'OP-00540', produto:'Flange Aço Inox 3"', operador:'Pedro A.', inicio:'07:30', progresso:82, status:'Em Andamento' },
  { id:'CUS-01', nome:'Centro Usinagem', op:null, produto:null, operador:null, inicio:null, progresso:0, status:'Manutenção' },
  { id:'RET-01', nome:'Retífica CIL-01', op:'OP-00541', produto:'Conjunto Rolamento', operador:'Carlos S.', inicio:'09:00', progresso:30, status:'Em Andamento' },
  { id:'FRE-01', nome:'Fresadora Conv.', op:null, produto:null, operador:null, inicio:null, progresso:0, status:'Disponível' },
];

const corStatus = { 'Em Andamento':'border-blue-400 bg-blue-50', 'Manutenção':'border-orange-400 bg-orange-50', 'Disponível':'border-green-400 bg-green-50' };
const dotStatus = { 'Em Andamento':'bg-blue-500', 'Manutenção':'bg-orange-500', 'Disponível':'bg-green-500' };

export default function ChaoDeFabrica() {
  return (
    <div>
      <PageHeader title="Chão de Fábrica" breadcrumbs={['Início','Produção','Chão de Fábrica']}
        subtitle="Visão em tempo real das máquinas e ordens em andamento"
      />
      <FluxoProducao />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          {label:'Máquinas Ativas',val:MAQUINAS.filter(m=>m.status==='Em Andamento').length,color:'text-blue-600'},
          {label:'Disponíveis',val:MAQUINAS.filter(m=>m.status==='Disponível').length,color:'text-success'},
          {label:'Em Manutenção',val:MAQUINAS.filter(m=>m.status==='Manutenção').length,color:'text-orange-600'},
          {label:'Eficiência Geral',val:'81%',color:'text-foreground'},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {MAQUINAS.map(m=>(
          <div key={m.id} className={`border-2 rounded-lg p-4 ${corStatus[m.status]}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${dotStatus[m.status]} animate-pulse`}/>
                <span className="text-xs font-bold text-foreground">{m.nome}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{m.id}</span>
            </div>
            {m.op ? (
              <>
                <div className="text-[11px] font-semibold text-primary mb-0.5">{m.op}</div>
                <div className="text-xs text-foreground mb-1 leading-tight">{m.produto}</div>
                <div className="text-[11px] text-muted-foreground mb-2">Op: {m.operador} | Início: {m.inicio}</div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progresso</span><span className="font-medium">{m.progresso}%</span>
                </div>
                <div className="bg-white/70 rounded-full h-2">
                  <div className="cozinha-blue-bg h-2 rounded-full transition-all" style={{width:`${m.progresso}%`}}/>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground mt-2">{m.status}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}