import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FilterBar from '@/components/common/FilterBar';
import StatusBadge from '@/components/common/StatusBadge';
import { listPurchaseOrders } from '@/services/purchasesApi';

const fmtD = (v) => (v ? new Date(v + 'T00:00').toLocaleDateString('pt-BR') : '—');
const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const STATUS_OC_RECEBIMENTO = ['RECEBIDO', 'PARCIALMENTE_RECEBIDO'];

const columns = [
  { key: 'numero', label: 'OC', width: 110 },
  { key: 'fornecedor_nome', label: 'Fornecedor' },
  {
    key: 'data_entrega_prevista',
    label: 'Data Entrega',
    width: 110,
    render: fmtD,
    mobileHidden: true,
  },
  { key: 'valor_total', label: 'Valor', width: 110, render: fmtR },
  {
    key: 'status',
    label: 'Status',
    width: 160,
    render: (v) => <StatusBadge status={v} />,
    sortable: false,
  },
];

export default function Recebimentos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await listPurchaseOrders();
        const recebimentos = rows.filter((r) =>
          STATUS_OC_RECEBIMENTO.includes(r.statusRaw),
        );
        if (mounted) setData(recebimentos);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (r) =>
        (!s ||
          r.numero?.toLowerCase().includes(s) ||
          r.fornecedor_nome?.toLowerCase().includes(s)) &&
        (!filters.status || r.status === filters.status),
    );
  }, [data, search, filters]);

  return (
    <div>
      <PageHeader
        title="Recebimentos"
        breadcrumbs={['Início', 'Compras', 'Recebimentos']}
      />
      <p className="text-xs text-muted-foreground mb-3">
        Exibe Ordens de Compra com recebimento registrado (total ou parcial). Para receber mercadoria, acesse
        <strong> Ordens de Compra</strong> e use o botão <em>Receber mercadoria</em>.
      </p>
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: ['Parcialmente Recebido', 'Recebido'].map((s) => ({ value: s, label: s })),
            },
          ]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => {
            setSearch('');
            setFilters({});
          }}
        />
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}
