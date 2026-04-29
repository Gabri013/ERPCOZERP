import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { MapPin, Package } from 'lucide-react';

const ENDERECOS = [
  { rua:'A', prateleira:'01', posicao:'01', produto:'Eixo Transmissão 25mm', codigo:'A-001', qtd:118, capacidade:200 },
  { rua:'A', prateleira:'01', posicao:'02', produto:'Rolamento 6205 2RS', codigo:'A-002', qtd:350, capacidade:500 },
  { rua:'A', prateleira:'01', posicao:'03', produto:null, codigo:null, qtd:0, capacidade:300 },
  { rua:'A', prateleira:'02', posicao:'01', produto:'Bucha Bronze 30x40', codigo:'A-003', qtd:200, capacidade:400 },
  { rua:'A', prateleira:'02', posicao:'02', produto:null, codigo:null, qtd:0, capacidade:300 },
  { rua:'B', prateleira:'01', posicao:'01', produto:'Flange Aço Inox 3"', codigo:'B-001', qtd:48, capacidade:100 },
  { rua:'B', prateleira:'01', posicao:'02', produto:'Parafuso Especial M12', codigo:'B-002', qtd:1200, capacidade:2000 },
  { rua:'B', prateleira:'02', posicao:'01', produto:'Correia Dentada 5M', codigo:'C-002', qtd:65, capacidade:150 },
  { rua:'C', prateleira:'01', posicao:'01', produto:'Caixa Redutora Mod.5', codigo:'C-001', qtd:8, capacidade:20 },
  { rua:'C', prateleira:'01', posicao:'02', produto:null, codigo:null, qtd:0, capacidade:50 },
];

export default function Enderecamento() {
  const [selected, setSelected] = useState(null);
  const ruas = [...new Set(ENDERECOS.map(e=>e.rua))];

  return (
    <div>
      <PageHeader title="Endereçamento" breadcrumbs={['Início','Estoque','Endereçamento']}/>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {ruas.map(rua=>(
            <div key={rua} className="bg-white border border-border rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <MapPin size={13}/> RUA {rua}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {ENDERECOS.filter(e=>e.rua===rua).map((e,i)=>{
                  const pct = Math.round((e.qtd/e.capacidade)*100);
                  const loc = `${e.rua}-${e.prateleira}-${e.posicao}`;
                  const isSel = selected?.loc===loc;
                  return (
                    <button key={i} onClick={()=>setSelected(e.produto?{...e,loc}:null)}
                      className={`border rounded p-2 text-left transition-all ${e.produto?'cursor-pointer hover:border-primary':' bg-muted/40 opacity-60'} ${isSel?'border-primary bg-blue-50':''}`}>
                      <div className="text-[10px] font-bold text-muted-foreground mb-1">{loc}</div>
                      {e.produto ? (
                        <>
                          <div className="text-[11px] font-medium text-foreground leading-tight truncate">{e.produto}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{e.qtd}/{e.capacidade} un</div>
                          <div className="mt-1.5 bg-muted rounded-full h-1">
                            <div className={`h-1 rounded-full ${pct>80?'bg-destructive':pct>50?'bg-warning':'bg-success'}`} style={{width:`${pct}%`}}/>
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-muted-foreground">Vazio</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-border rounded-lg p-4 h-fit sticky top-0">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Package size={14}/> Detalhes do Endereço</h3>
          {selected ? (
            <div className="space-y-2.5 text-xs">
              <div><span className="text-muted-foreground">Endereço:</span> <span className="font-bold text-primary">{selected.loc}</span></div>
              <div><span className="text-muted-foreground">Produto:</span> <div className="font-medium mt-0.5">{selected.produto}</div></div>
              <div><span className="text-muted-foreground">Código:</span> <span className="font-medium">{selected.codigo}</span></div>
              <div><span className="text-muted-foreground">Qtd. Atual:</span> <span className="font-medium">{selected.qtd}</span></div>
              <div><span className="text-muted-foreground">Capacidade:</span> <span className="font-medium">{selected.capacidade}</span></div>
              <div>
                <span className="text-muted-foreground">Ocupação:</span>
                <div className="mt-1 bg-muted rounded-full h-2">
                  <div className="nomus-blue-bg h-2 rounded-full" style={{width:`${Math.round((selected.qtd/selected.capacidade)*100)}%`}}/>
                </div>
                <span className="text-muted-foreground">{Math.round((selected.qtd/selected.capacidade)*100)}%</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Clique em um endereço para ver os detalhes.</p>
          )}
        </div>
      </div>
    </div>
  );
}