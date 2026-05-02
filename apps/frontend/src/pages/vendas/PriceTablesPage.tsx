// @ts-nocheck — shadcn/jsx UI components without TS props
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Loader2 } from 'lucide-react';
import { listPriceTables } from '@/services/salesApi';

function money(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return '—';
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function PriceTablesPage() {
  const q = useQuery({
    queryKey: ['price-tables'],
    queryFn: listPriceTables,
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Tabelas de preço" subtitle="" breadcrumbs={['Início', 'Vendas', 'Tabela de preços']} actions={null} />
      {q.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(q.data ?? []).map((t) => (
            <div key={t.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="py-3 px-4 border-b border-border">
                <div className="text-base font-semibold">
                  {t.code} — {t.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.currency} {t.active ? '· Ativa' : '· Inativa'}
                </p>
              </div>
              <div className="text-sm space-y-1 max-h-48 overflow-y-auto p-4">
                {t.items.length === 0 && (
                  <p className="text-muted-foreground text-xs">Sem itens.</p>
                )}
                {t.items.map((it) => (
                  <div key={it.id} className="flex justify-between gap-2 border-b border-border/50 pb-1">
                    <span className="truncate">
                      {it.product.code} {it.product.name}
                    </span>
                    <span className="shrink-0 font-medium">{money(it.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
