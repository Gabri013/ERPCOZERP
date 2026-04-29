import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';
import { getEstoqueCritico } from '@/services/businessLogic';

export default function WidgetEstoqueCritico() {
  const critico = useMemo(() => getEstoqueCritico(), []);

  return (
    <div className="bg-white border border-border rounded-lg h-full flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold">Estoque Crítico</h3>
        <Link to="/estoque/produtos" className="text-xs text-primary hover:underline flex items-center gap-1">Ver <ArrowRight size={11}/></Link>
      </div>
      <div className="flex-1 overflow-auto">
        {critico.length === 0 ? (
          <div className="px-4 py-6 text-xs text-muted-foreground text-center flex items-center gap-2 justify-center">
            <CheckCircle size={13} className="text-success"/> Todos OK
          </div>
        ) : (
          <div className="divide-y divide-border">
            {critico.slice(0, 6).map(p => {
              const pct = p.estoque_minimo > 0 ? Math.min(100, (p.estoque_atual / p.estoque_minimo) * 100) : 0;
              return (
                <div key={p.id} className="px-3 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium truncate flex-1">{p.descricao}</span>
                    <span className="text-[10px] text-destructive font-bold ml-2">{p.estoque_atual}/{p.estoque_minimo}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-destructive rounded-full h-1.5" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}