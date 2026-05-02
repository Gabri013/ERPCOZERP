// @ts-nocheck — shadcn/jsx UI components without TS props
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { convertQuote, listQuotes, type QuoteRow } from '@/services/salesApi';
import { PodeRender } from '@/lib/PermissaoContext';

function money(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return '—';
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function QuotesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['sales-quotes'],
    queryFn: listQuotes,
  });

  const conv = useMutation({
    mutationFn: (id: string) => convertQuote(id),
    onSuccess: () => {
      toast({ title: 'Convertido em pedido de venda' });
      qc.invalidateQueries({ queryKey: ['sales-quotes'] });
      qc.invalidateQueries({ queryKey: ['sale-orders'] });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const columns = [
    { key: 'number', label: 'Nº', width: 140 },
    {
      key: 'customer',
      label: 'Cliente',
      render: (_: unknown, row: QuoteRow) => row.customer?.name ?? '—',
    },
    { key: 'status', label: 'Status', width: 120 },
    {
      key: 'totalAmount',
      label: 'Total',
      width: 100,
      render: (v: unknown) => money(v),
    },
    {
      key: 'id',
      label: '',
      sortable: false,
      width: 120,
      render: (_: unknown, row: QuoteRow) =>
        row.status !== 'CONVERTIDO' ? (
          <PodeRender acao="editar_pedidos">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={conv.isPending}
              onClick={(e) => {
                e.stopPropagation();
                conv.mutate(row.id);
              }}
            >
              Converter
            </Button>
          </PodeRender>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Orçamentos" subtitle="" breadcrumbs={['Início', 'Vendas', 'Orçamentos']} actions={null} />
      {q.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={q.data ?? []} loading={false} />
      )}
    </div>
  );
}
