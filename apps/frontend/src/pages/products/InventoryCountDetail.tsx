// @ts-nocheck
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button.jsx';
import {
  getInventoryCount,
  patchInventoryItem,
  patchInventoryCount,
  approveInventoryCount,
} from '@/services/stockApi';
import { PodeRender } from '@/lib/PermissaoContext';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

type Item = {
  id: string;
  qtySystem: unknown;
  qtyCounted: unknown;
  product: { code: string; name: string };
  location: { code: string } | null;
};

export default function InventoryCountDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ['inventory-count', id],
    queryFn: () => getInventoryCount(id as string),
    enabled: Boolean(id),
  });

  const data = q.data as
    | {
        code: string;
        status: string;
        items: Item[];
      }
    | null
    | undefined;

  const patchItemMut = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: string; qty: number | null }) =>
      patchInventoryItem(itemId, { qtyCounted: qty }),
    onSuccess: () => {
      toast.success('Quantidade contada salva');
      qc.invalidateQueries({ queryKey: ['inventory-count', id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startCountMut = useMutation({
    mutationFn: () => patchInventoryCount(id as string, { status: 'EM_CONTAGEM' }),
    onSuccess: () => {
      toast.success('Contagem iniciada');
      qc.invalidateQueries({ queryKey: ['inventory-count', id] });
      qc.invalidateQueries({ queryKey: ['inventory-counts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMut = useMutation({
    mutationFn: () => approveInventoryCount(id as string),
    onSuccess: () => {
      toast.success('Inventário aprovado; ajustes lançados');
      qc.invalidateQueries({ queryKey: ['inventory-count', id] });
      qc.invalidateQueries({ queryKey: ['inventory-counts'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['stock-products'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="animate-spin" size={18} />
        Carregando…
      </div>
    );
  }

  if (q.isError || !data) {
    return <div className="text-destructive text-sm">Inventário não encontrado</div>;
  }

  return (
    <div>
      <PageHeader
        title={data.code}
        breadcrumbs={['Início', 'Estoque', 'Inventário', data.code]}
        actions={(
          <Button variant="outline" size="sm" asChild>
            <Link to="/estoque/inventario">
              <ArrowLeft size={14} />
              Voltar
            </Link>
          </Button>
        )}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {data.status === 'RASCUNHO' && (
          <PodeRender acao="movimentar_estoque">
            <Button size="sm" type="button" onClick={() => startCountMut.mutate()} disabled={startCountMut.isPending}>
              Iniciar contagem
            </Button>
          </PodeRender>
        )}
        {data.status !== 'APROVADO' && (
          <PodeRender acao="movimentar_estoque">
            <Button
              size="sm"
              type="button"
              variant="default"
              onClick={() => approveMut.mutate()}
              disabled={approveMut.isPending}
            >
              Aprovar e gerar ajustes
            </Button>
          </PodeRender>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2">Produto</th>
              <th className="text-left p-2">Endereço</th>
              <th className="text-right p-2">Sistema</th>
              <th className="text-right p-2">Contado</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {data.items?.map((it) => (
              <tr key={it.id} className="border-t border-border">
                <td className="p-2">
                  {it.product.code} — {it.product.name}
                </td>
                <td className="p-2">{it.location?.code || '—'}</td>
                <td className="p-2 text-right">{String(it.qtySystem)}</td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    step="0.0001"
                    className="w-24 rounded border border-input px-1 py-0.5 text-right"
                    disabled={data.status === 'APROVADO'}
                    value={editing[it.id] ?? (it.qtyCounted != null ? String(it.qtyCounted) : '')}
                    onChange={(e) => setEditing((m) => ({ ...m, [it.id]: e.target.value }))}
                  />
                </td>
                <td className="p-2">
                  {data.status !== 'APROVADO' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7"
                      onClick={() => {
                        const raw = editing[it.id];
                        const num = raw === '' || raw == null ? null : Number(raw);
                        patchItemMut.mutate({ itemId: it.id, qty: num });
                      }}
                    >
                      Salvar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
