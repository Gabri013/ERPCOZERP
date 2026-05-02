// @ts-nocheck
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button.jsx';
import { listStockProducts, type StockProduct } from '@/services/stockApi';
import { PodeRender, usePermissions } from '@/lib/PermissaoContext';

const fmtR = (v: number | null | undefined) =>
  v != null ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : '—';

export default function ProductsPage() {
  const { pode } = usePermissions();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ['stock-products', search, filters.status],
    queryFn: () => listStockProducts({ search: search || undefined, status: filters.status }),
  });

  const rows = q.data ?? [];
  const filtered = useMemo(() => {
    return rows.filter((p) => !filters.status || p.status === filters.status);
  }, [rows, filters]);

  const semEstoque = rows.filter((p) => p.totalQty < p.minStock).length;

  const columns = [
    { key: 'code', label: 'Código', width: 110 },
    {
      key: 'name',
      label: 'Descrição',
      render: (_v: unknown, row: StockProduct) => (
        <Link className="text-primary hover:underline font-medium" to={`/estoque/produtos/${row.id}`}>
          {row.name}
        </Link>
      ),
    },
    { key: 'group', label: 'Grupo', width: 100, mobileHidden: true },
    { key: 'productType', label: 'Tipo', width: 100, mobileHidden: true },
    { key: 'unit', label: 'UN', width: 50, mobileHidden: true },
    {
      key: 'costPrice',
      label: 'Custo',
      width: 90,
      render: (v: unknown) => fmtR(v as number | null),
      mobileHidden: true,
    },
    {
      key: 'salePrice',
      label: 'Venda',
      width: 90,
      render: (v: unknown) => fmtR(v as number | null),
    },
    {
      key: 'totalQty',
      label: 'Estoque',
      width: 90,
      render: (_v: unknown, row: StockProduct) => (
        <span
          className={
            row.totalQty < row.minStock ? 'text-destructive font-semibold inline-flex items-center gap-1' : ''
          }
        >
          {row.totalQty < row.minStock && <AlertTriangle size={11} />}
          {row.totalQty}
        </span>
      ),
    },
    {
      key: 'minStock',
      label: 'Mín.',
      width: 60,
      mobileHidden: true,
    },
    {
      key: 'status',
      label: 'Status',
      width: 80,
      render: (v: unknown) => <StatusBadge status={v as string} />,
      sortable: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Produtos (catálogo)"
        breadcrumbs={['Início', 'Estoque', 'Produtos']}
        actions={(
          <PodeRender acao="editar_produtos">
            <Button asChild size="sm">
              <Link to="/estoque/produtos/novo">
                <Plus size={14} />
                Novo
              </Link>
            </Button>
          </PodeRender>
        )}
      />

      {semEstoque > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertTriangle size={14} />
          <strong>{semEstoque}</strong> produto(s) abaixo do estoque mínimo
        </div>
      )}

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'Ativo', label: 'Ativo' },
                { value: 'Inativo', label: 'Inativo' },
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

      {q.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="animate-spin" size={18} />
          Carregando produtos…
        </div>
      )}

      {q.isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(q.error as Error)?.message || 'Erro ao carregar catálogo'}
        </div>
      )}

      {!q.isLoading && !q.isError && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Nenhum produto encontrado.{' '}
          {pode('editar_produtos') && (
            <Link className="text-primary underline" to="/estoque/produtos/novo">
              Cadastrar o primeiro
            </Link>
          )}
        </div>
      )}

      {!q.isLoading && !q.isError && filtered.length > 0 && (
        <DataTable columns={columns} data={filtered} loading={q.isFetching} />
      )}
      </div>
    </div>
  );
}
