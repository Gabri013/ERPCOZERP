import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { storage } from '@/services/storage';

const fmtR = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function WidgetPedidosRecentes() {
  const pedidos = useMemo(() => storage.get('pedidos', []).slice(0, 6), []);

  return (
    <div className="bg-white border border-border rounded-lg h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">Últimos Pedidos de Venda</h3>
        <Link to="/vendas/pedidos" className="text-xs text-primary flex items-center gap-1 hover:underline">Ver todos <ArrowRight size={11} /></Link>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="border-b border-border bg-muted">
              {['Pedido','Cliente','Valor','Status'].map(h => (
                <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidos.length > 0 ? pedidos.map((p, i) => (
              <tr key={i} className="border-b border-border hover:bg-nomus-blue-light transition-colors last:border-0">
                <td className="px-4 py-2 font-medium text-primary">{p.numero}</td>
                <td className="px-4 py-2 max-w-[120px] truncate">{p.cliente_nome}</td>
                <td className="px-4 py-2 font-medium whitespace-nowrap">{fmtR(p.valor_total)}</td>
                <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum pedido</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}