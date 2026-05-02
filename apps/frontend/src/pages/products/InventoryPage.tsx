// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button.jsx';
import { listInventoryCounts, createInventoryCount } from '@/services/stockApi';
import { PodeRender } from '@/lib/PermissaoContext';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

export default function InventoryPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['inventory-counts'],
    queryFn: () => listInventoryCounts(),
  });

  const createMut = useMutation({
    mutationFn: () => createInventoryCount({}),
    onSuccess: () => {
      toast.success('Contagem criada');
      qc.invalidateQueries({ queryKey: ['inventory-counts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (q.data || []) as Array<{
    id: string;
    code: string;
    status: string;
    items: unknown[];
    createdAt: string;
  }>;

  return (
    <div>
      <PageHeader
        title="Inventário"
        breadcrumbs={['Início', 'Estoque', 'Inventário']}
        actions={(
          <PodeRender acao="movimentar_estoque">
            <Button size="sm" type="button" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              Nova contagem
            </Button>
          </PodeRender>
        )}
      />

      {q.isLoading && (
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
          <Loader2 className="animate-spin" size={18} />
          Carregando…
        </div>
      )}
      {q.isError && (
        <div className="rounded-md border border-destructive/40 px-4 py-3 text-sm text-destructive">
          {(q.error as Error)?.message}
        </div>
      )}
      {!q.isLoading && !q.isError && rows.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
          Nenhuma contagem. Crie uma nova para gerar linhas a partir do saldo atual.
        </div>
      )}
      <ul className="space-y-2 mt-4">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
          >
            <div>
              <div className="font-medium">{r.code}</div>
              <div className="text-xs text-muted-foreground">
                {r.status} · {r.items?.length || 0} linhas ·{' '}
                {r.createdAt ? String(r.createdAt).slice(0, 10) : ''}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/estoque/inventario/${r.id}`}>Detalhe</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
