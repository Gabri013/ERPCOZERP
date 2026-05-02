import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FluxoProducao from '@/components/producao/FluxoProducao';
import { cozincaApi } from '@/services/cozincaApi';
import { toast } from 'sonner';

const corStatus = { 'Em Andamento':'border-blue-400 bg-blue-50', 'Manutenção':'border-orange-400 bg-orange-50', 'Disponível':'border-green-400 bg-green-50' };
const dotStatus = { 'Em Andamento':'bg-blue-500', 'Manutenção':'bg-orange-500', 'Disponível':'bg-green-500' };

export default function ChaoDeFabrica() {
  const [cards, setCards] = useState([]);
  const [resumo, setResumo] = useState({ ativas: 0, disponiveis: 0, manut: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const snap = await cozincaApi.chaoFabricaSnapshot();
        if (!ok) return;
        const list = snap?.cards || [];
        setCards(list);
        setResumo({
          ativas: list.filter((m) => m.status === 'Em Andamento').length,
          disponiveis: list.filter((m) => m.status === 'Disponível').length,
          manut: list.filter((m) => m.status === 'Manutenção').length,
        });
      } catch (e) {
        if (!ok) return;
        toast.error(e?.message || 'Não foi possível carregar o chão de fábrica.');
        setCards([]);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  return (
    <div>
      <PageHeader title="Chão de Fábrica" breadcrumbs={['Início','Produção','Chão de Fábrica']}
        subtitle="Visão em tempo real das máquinas e ordens em andamento"
      />
      <FluxoProducao />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          {label:'Máquinas Ativas',val:loading ? '…' : resumo.ativas,color:'text-blue-600'},
          {label:'Disponíveis',val:loading ? '…' : resumo.disponiveis,color:'text-success'},
          {label:'Em Manutenção',val:loading ? '…' : resumo.manut,color:'text-orange-600'},
          {label:'Cartões (API)',val:loading ? '…' : cards.length,color:'text-foreground'},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-border rounded px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(cards.length ? cards : []).map(m=>(
          <div key={m.id} className={`border-2 rounded-lg p-4 ${corStatus[m.status] || 'border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${dotStatus[m.status] || 'bg-gray-400'} animate-pulse`}/>
                <span className="text-xs font-bold text-foreground">{m.nome}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{m.id}</span>
            </div>
            {m.op ? (
              <>
                <div className="text-[11px] font-semibold text-primary mb-0.5">{m.op}</div>
                <div className="text-xs text-foreground mb-1 leading-tight">{m.produto}</div>
                <div className="text-[11px] text-muted-foreground mb-2">Op: {m.operador || '—'} | Início: {m.inicio ? new Date(m.inicio).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '—'}</div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progresso</span><span className="font-medium">{m.progresso ?? 0}%</span>
                </div>
                <div className="bg-white/70 rounded-full h-2">
                  <div className="cozinha-blue-bg h-2 rounded-full transition-all" style={{width:`${m.progresso ?? 0}%`}}/>
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
