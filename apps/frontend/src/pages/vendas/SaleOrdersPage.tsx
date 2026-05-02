// @ts-nocheck — shadcn/jsx UI components without TS props
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button.jsx';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, LayoutGrid, Table2 } from 'lucide-react';
import {
  approveSaleOrder,
  generateWorkOrderFromSale,
  getSaleOrder,
  listSaleOrders,
  patchSaleOrderKanban,
  type SaleOrderRow,
} from '@/services/salesApi';
import { PodeRender, usePermissions } from '@/lib/PermissaoContext';

const COLS = [
  { id: 'PEDIDO', label: 'Pedido' },
  { id: 'APROVACAO', label: 'Aprovação' },
  { id: 'PRODUCAO', label: 'Produção' },
  { id: 'EXPEDICAO', label: 'Expedição' },
  { id: 'CONCLUIDO', label: 'Concluído' },
];

function money(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return '—';
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function SaleOrdersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { pode } = usePermissions();
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [detailId, setDetailId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['sale-orders'],
    queryFn: () => listSaleOrders(),
  });

  const detailQ = useQuery({
    queryKey: ['sale-order', detailId],
    queryFn: () => getSaleOrder(detailId as string),
    enabled: Boolean(detailId),
  });

  const patchKanban = useMutation({
    mutationFn: ({ id, col }: { id: string; col: string }) => patchSaleOrderKanban(id, col),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sale-orders'] });
      qc.invalidateQueries({ queryKey: ['sale-order', detailId] });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveSaleOrder(id),
    onSuccess: () => {
      toast({ title: 'Pedido aprovado' });
      qc.invalidateQueries({ queryKey: ['sale-orders'] });
      qc.invalidateQueries({ queryKey: ['sale-order', detailId] });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const woMut = useMutation({
    mutationFn: (id: string) => generateWorkOrderFromSale(id),
    onSuccess: () => {
      toast({ title: 'Ordem de produção gerada' });
      qc.invalidateQueries({ queryKey: ['sale-order', detailId] });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const byColumn = useMemo(() => {
    const map = new Map<string, SaleOrderRow[]>();
    for (const c of COLS) map.set(c.id, []);
    for (const o of q.data ?? []) {
      const col = COLS.some((c) => c.id === o.kanbanColumn) ? o.kanbanColumn : 'PEDIDO';
      map.get(col)?.push(o);
    }
    return map;
  }, [q.data]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, draggableId } = result;
      if (!destination) return;
      const col = destination.droppableId;
      patchKanban.mutate({ id: draggableId, col });
    },
    [patchKanban],
  );

  const columnsTable = [
    { key: 'number', label: 'Nº', width: 140 },
    {
      key: 'customer',
      label: 'Cliente',
      render: (_: unknown, row: SaleOrderRow) => row.customer?.name ?? '—',
    },
    {
      key: 'kanbanColumn',
      label: 'Etapa',
      width: 110,
    },
    {
      key: 'totalAmount',
      label: 'Total',
      width: 100,
      render: (v: unknown) => money(v),
    },
    {
      key: 'status',
      label: 'Status',
      width: 100,
    },
  ];

  const detail = detailQ.data;

  return (
    <div className="space-y-4">
      <PageHeader title="Pedidos de venda" subtitle="" breadcrumbs={['Início', 'Vendas', 'Pedidos']} actions={null} />

      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={view === 'kanban' ? 'default' : 'outline'}
          size="sm"
          className="gap-1"
          onClick={() => setView('kanban')}
        >
          <LayoutGrid size={14} /> Kanban
        </Button>
        <Button
          type="button"
          variant={view === 'table' ? 'default' : 'outline'}
          size="sm"
          className="gap-1"
          onClick={() => setView('table')}
        >
          <Table2 size={14} /> Tabela
        </Button>
      </div>

      {view === 'kanban' ? (
        <div className="mt-0">
          {q.isLoading ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {COLS.map((col) => (
                  <Droppable droppableId={col.id} key={col.id}>
                    {(prov, snap) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.droppableProps}
                        className={`rounded-lg border bg-muted/30 min-h-[280px] p-2 ${snap.isDraggingOver ? 'ring-2 ring-primary/30' : ''}`}
                      >
                        <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                          {col.label}
                        </div>
                        {(byColumn.get(col.id) ?? []).map((o, idx) => (
                          <Draggable draggableId={o.id} index={idx} key={o.id}>
                            {(drag, snapshot) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className={`mb-2 rounded-md border bg-card p-2 text-xs cursor-grab ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                                role="button"
                                tabIndex={0}
                                onClick={() => setDetailId(o.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') setDetailId(o.id);
                                }}
                              >
                                <div className="font-semibold text-primary">{o.number}</div>
                                <div className="truncate text-muted-foreground">{o.customer?.name}</div>
                                <div className="mt-1 font-medium">{money(o.totalAmount)}</div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {prov.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <DataTable
            columns={columnsTable}
            data={q.data ?? []}
            loading={q.isLoading}
            onRowClick={(row: SaleOrderRow) => setDetailId(row.id)}
          />
        </div>
      )}

      <Sheet open={Boolean(detailId)} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="">
            <SheetTitle className="">{detail?.number ?? 'Pedido'}</SheetTitle>
          </SheetHeader>
          {detailQ.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          )}
          {detail && (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Cliente</div>
                <div className="font-medium">{detail.customer?.name ?? '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Total</div>
                <div className="font-medium">{money(detail.totalAmount)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Itens</div>
                <ul className="list-disc pl-4 space-y-1">
                  {detail.items.map((it) => (
                    <li key={it.id}>
                      {it.product.code} — {it.product.name} × {String(it.quantity)} @ {money(it.unitPrice)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <PodeRender acao="aprovar_pedidos">
                  <Button
                    size="sm"
                    type="button"
                    disabled={approveMut.isPending}
                    onClick={() => approveMut.mutate(detail.id)}
                  >
                    Aprovar
                  </Button>
                </PodeRender>
                {(pode('editar_pedidos') || pode('criar_pedidos')) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    disabled={woMut.isPending}
                    onClick={() => woMut.mutate(detail.id)}
                  >
                    Gerar OP
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
