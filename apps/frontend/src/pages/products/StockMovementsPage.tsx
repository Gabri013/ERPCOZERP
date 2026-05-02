// @ts-nocheck
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button.jsx';
import { listStockMovements, createStockMovement, listStockProducts } from '@/services/stockApi';
import { PodeRender, usePermissions } from '@/lib/PermissaoContext';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

type MovementRow = {
  id: string;
  type: string;
  quantity: number;
  createdAt: string;
  reference: string | null;
  product: { code: string; name: string };
  location: { code: string; name: string } | null;
};

export default function StockMovementsPage() {
  const qc = useQueryClient();
  const { pode } = usePermissions();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    locationId: '',
    type: 'ENTRADA' as 'ENTRADA' | 'SAIDA' | 'AJUSTE',
    quantity: 1,
    reference: '',
  });

  const productsQ = useQuery({
    queryKey: ['stock-products-all'],
    queryFn: () => listStockProducts({}),
  });

  const movQ = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => listStockMovements(),
  });

  const rows = (movQ.data || []) as MovementRow[];

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return rows.filter((m) => {
      const okSearch =
        !s ||
        m.product?.name?.toLowerCase().includes(s) ||
        m.product?.code?.toLowerCase().includes(s) ||
        (m.reference && m.reference.toLowerCase().includes(s));
      const okTipo = !filters.tipo || m.type === filters.tipo;
      return okSearch && okTipo;
    });
  }, [rows, search, filters.tipo]);

  const createMut = useMutation({
    mutationFn: () =>
      createStockMovement({
        productId: form.productId,
        locationId: form.locationId || undefined,
        type: form.type,
        quantity: form.quantity,
        reference: form.reference || undefined,
      }),
    onSuccess: () => {
      toast.success('Movimentação registrada');
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['stock-products'] });
      setShowForm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = [
    { key: 'createdAt', label: 'Data', width: 160, render: (v: unknown) => String(v).slice(0, 19).replace('T', ' ') },
    { key: 'type', label: 'Tipo', width: 90 },
    { key: 'product', label: 'Produto', render: (_: unknown, row: MovementRow) => `${row.product?.code} — ${row.product?.name}` },
    { key: 'location', label: 'Endereço', render: (_: unknown, row: MovementRow) => row.location?.code || '—' },
    { key: 'quantity', label: 'Qtd', width: 80 },
    { key: 'reference', label: 'Ref.', width: 120 },
  ];

  const productOptions = productsQ.data || [];

  return (
    <div>
      <PageHeader
        title="Movimentações"
        breadcrumbs={['Início', 'Estoque', 'Movimentações']}
        actions={(
          <PodeRender acao="movimentar_estoque">
            <Button size="sm" type="button" onClick={() => setShowForm(true)}>
              <Plus size={14} />
              Novo lançamento
            </Button>
          </PodeRender>
        )}
      />

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[
            {
              key: 'tipo',
              label: 'Tipo',
              options: [
                { value: 'ENTRADA', label: 'Entrada' },
                { value: 'SAIDA', label: 'Saída' },
                { value: 'AJUSTE', label: 'Ajuste' },
              ],
            },
          ]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => {
            setSearch('');
            setFilters({});
          }}
        />

        {movQ.isLoading && (
          <div className="flex justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="animate-spin" size={18} />
            Carregando…
          </div>
        )}
        {movQ.isError && (
          <div className="p-4 text-sm text-destructive">{(movQ.error as Error)?.message}</div>
        )}
        {!movQ.isLoading && !movQ.isError && (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>

      {showForm && pode('movimentar_estoque') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-4 shadow-lg space-y-3">
            <h3 className="font-semibold text-sm">Novo lançamento</h3>
            <label className="text-xs block space-y-1">
              Produto
              <select
                className="w-full rounded border border-input px-2 py-1.5 text-sm"
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
              >
                <option value="">Selecione…</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs block space-y-1">
              Tipo
              <select
                className="w-full rounded border border-input px-2 py-1.5 text-sm"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))
                }
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
                <option value="AJUSTE">Ajuste</option>
              </select>
            </label>
            <label className="text-xs block space-y-1">
              Quantidade
              <input
                type="number"
                min={0.0001}
                step="0.0001"
                className="w-full rounded border border-input px-2 py-1.5 text-sm"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              />
            </label>
            <label className="text-xs block space-y-1">
              Referência (opcional)
              <input
                className="w-full rounded border border-input px-2 py-1.5 text-sm"
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              />
            </label>
            <p className="text-[11px] text-muted-foreground">
              Endereço: usa o depósito padrão se não informado (campo reservado para evolução da UI).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!form.productId || createMut.isPending}
                onClick={() => createMut.mutate()}
              >
                {createMut.isPending && <Loader2 className="animate-spin" size={14} />}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
