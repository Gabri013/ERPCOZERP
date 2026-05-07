import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import { ExternalLink, FlaskConical, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { produtoService } from '@/services/produtoService';
import { productsApi } from '@/services/productsApi';
import { usePermissions } from '@/lib/PermissaoContext';

const BOM_STATUS_CFG = {
  EMPTY: { label: 'Sem BOM', cls: 'bg-red-100 text-red-700', icon: AlertTriangle },
  PENDING_ENGINEERING: { label: 'Em elaboração', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  COMPLETE: { label: 'Aprovada', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

function BomBadge({ status }) {
  const cfg = BOM_STATUS_CFG[status] || BOM_STATUS_CFG.EMPTY;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.cls}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

/** Lista produtos (entity produto) — BOM / 3D na página de detalhe do produto. */
export default function ProjetosEngenharia() {
  const { pode } = usePermissions();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  // map of recordId → bom_status
  const [bomStatusMap, setBomStatusMap] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [list, pendentes] = await Promise.all([
          produtoService.getAll(),
          productsApi.pendingBom().catch(() => []),
        ]);
        if (!mounted) return;

        // Build status map from pendentes (EMPTY + PENDING)
        const map = {};
        for (const p of (pendentes || [])) {
          map[p.record_id] = p.bom_status;
        }
        setBomStatusMap(map);
        setRows(list);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const bomStatus = bomStatusMap[r.id] ?? 'COMPLETE';
      const okSearch =
        !q ||
        String(r.codigo || '').toLowerCase().includes(q) ||
        String(r.descricao || r.nome || '').toLowerCase().includes(q);
      const okTipo = !filters.tipo || String(r.tipo || '') === filters.tipo;
      const okBom = !filters.bom_status || bomStatus === filters.bom_status;
      return okSearch && okTipo && okBom;
    });
  }, [rows, search, filters, bomStatusMap]);

  const columns = [
    {
      key: 'codigo',
      label: 'Código',
      width: 120,
      render: (v, row) => (
        <Link className="text-primary hover:underline font-mono font-medium text-xs" to={`/estoque/produtos/bom/${row.id}`}>
          {v || '—'}
        </Link>
      ),
    },
    {
      key: 'nome',
      label: 'Nome / Descrição',
      render: (_, row) => (
        <span className="text-xs">{row.nome || row.descricao || '—'}</span>
      ),
    },
    { key: 'tipo', label: 'Tipo', width: 120, render: (v) => <span className="text-xs">{v || '—'}</span> },
    {
      key: 'bom_status',
      label: 'Status BOM',
      width: 130,
      sortable: false,
      render: (_, row) => {
        const status = bomStatusMap[row.id] ?? 'COMPLETE';
        return <BomBadge status={status} />;
      },
    },
    {
      key: 'acoes',
      label: '',
      width: 80,
      sortable: false,
      render: (_, row) => (
        <Link
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          to={`/estoque/produtos/bom/${row.id}`}
        >
          Abrir <ExternalLink size={11} />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projetos em desenvolvimento"
        breadcrumbs={['Início', 'Engenharia', 'Projetos']}
        subtitle="Produtos cadastrados — BOM, roteiros e arquivos técnicos."
      />

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto min-w-0">
          <FilterBar
            search={search}
            onSearch={setSearch}
            filters={[
              {
                key: 'tipo',
                label: 'Tipo',
                options: ['Produto', 'Serviço', 'Matéria-Prima', 'Semi-Acabado'].map((t) => ({
                  value: t,
                  label: t,
                })),
              },
              {
                key: 'bom_status',
                label: 'BOM',
                options: [
                  { value: 'EMPTY', label: 'Sem BOM' },
                  { value: 'PENDING_ENGINEERING', label: 'Em elaboração' },
                  { value: 'COMPLETE', label: 'Aprovada' },
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
          {pode('editar_produtos') && (
            <div className="px-3 pb-2 text-[11px] text-muted-foreground flex items-center gap-2">
              <FlaskConical size={13} />
              Clique no código para abrir a ficha — importar BOM SolidWorks, arquivos DXF/PDF e modelo 3D.
            </div>
          )}
          <DataTable columns={columns} data={filtered} loading={loading} />
        </div>
      </div>
    </div>
  );
}
