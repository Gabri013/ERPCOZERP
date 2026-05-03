import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { listSaleOrders } from '@/services/salesApi';

const fmtR = (v) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

/** Status do Prisma/API → rótulo do badge (mesmo vocabulário da lista de pedidos). */
const STATUS_PT = {
  DRAFT: 'Orçamento',
  APPROVED: 'Aprovado',
  IN_PRODUCTION: 'Em Produção',
  DELIVERED: 'Entregue',
  INVOICED: 'Faturado',
  CANCELLED: 'Cancelado',
};

function labelStatus(raw) {
  if (!raw) return '—';
  return STATUS_PT[raw] ?? raw;
}

function recentTimestamp(row) {
  const c = row.createdAt ? new Date(row.createdAt).getTime() : 0;
  const o = row.orderDate ? new Date(row.orderDate).getTime() : 0;
  return Math.max(c, o || c);
}

export default function WidgetPedidosRecentes({ title = 'Últimos Pedidos de Venda' }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await listSaleOrders({ take: 120 });
        if (cancelled) return;
        const sorted = [...rows].sort((a, b) => recentTimestamp(b) - recentTimestamp(a)).slice(0, 6);
        setPedidos(sorted);
      } catch {
        if (!cancelled) setPedidos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white border border-border rounded-lg h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link
          to="/vendas/pedidos"
          className="text-xs text-primary flex items-center gap-1 hover:underline"
        >
          Ver todos <ArrowRight size={11} />
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="border-b border-border bg-muted">
              {['Pedido', 'Cliente', 'Valor', 'Status'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : pedidos.length > 0 ? (
              pedidos.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border hover:bg-nomus-blue-light transition-colors last:border-0"
                >
                  <td className="px-4 py-2 font-medium text-primary">{p.number}</td>
                  <td className="px-4 py-2 max-w-[120px] truncate">{p.customer?.name ?? '—'}</td>
                  <td className="px-4 py-2 font-medium whitespace-nowrap">{fmtR(p.totalAmount)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={labelStatus(p.status)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-6 text-muted-foreground">
                  Nenhum pedido
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
