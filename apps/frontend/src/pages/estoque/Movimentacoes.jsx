import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import ModalMovimentacao from '@/components/estoque/ModalMovimentacao';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { mapMovementToUiRow, stockApi } from '@/services/stockApi';
import { usePermissions } from '@/lib/PermissaoContext';

const PT_TO_RAW = { Entrada: 'ENTRADA', Saída: 'SAIDA', Ajuste: 'AJUSTE' };

export default function Movimentacoes() {
  const { pode } = usePermissions();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);

  const podeMov = pode('movimentacao.create') || pode('movimentar_estoque');

  async function load() {
    setLoading(true);
    try {
      const rows = await stockApi.listMovements({ take: 2000 });
      setData(rows.map(mapMovementToUiRow));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (body) => {
    await stockApi.createMovement(body);
    await load();
  };

  const filtered = useMemo(() => {
    return data.filter((m) => {
      const s = search.toLowerCase();
      const okSearch =
        !s ||
        m.produto_descricao?.toLowerCase().includes(s) ||
        m.produto_codigo?.toLowerCase().includes(s) ||
        m.numero?.toLowerCase().includes(s);
      const raw = filters.tipo ? PT_TO_RAW[filters.tipo] : null;
      const okTipo = !raw || m.tipoRaw === raw;
      return okSearch && okTipo;
    });
  }, [data, search, filters.tipo]);

  const tipoCor = {
    Entrada: 'bg-green-100 text-green-700',
    Saída: 'bg-red-100 text-red-700',
    Transferência: 'bg-blue-100 text-blue-700',
    Ajuste: 'bg-yellow-100 text-yellow-700',
  };

  const columns = [
    { key: 'numero', label: 'Ref.', width: 90 },
    {
      key: 'tipo',
      label: 'Tipo',
      width: 100,
      render: (v) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${tipoCor[v] || 'bg-gray-100 text-gray-600'}`}
        >
          {v === 'Entrada' ? (
            <TrendingUp size={10} />
          ) : v === 'Saída' ? (
            <TrendingDown size={10} />
          ) : null}
          {v}
        </span>
      ),
    },
    { key: 'produto_descricao', label: 'Produto' },
    { key: 'local', label: 'End.', width: 72, mobileHidden: true },
    { key: 'quantidade', label: 'Qtd', width: 70 },
    { key: 'unidade', label: 'UN', width: 50 },
    {
      key: 'data',
      label: 'Data',
      width: 100,
      render: (v) => (v ? new Date(v + 'T12:00:00').toLocaleDateString('pt-BR') : '—'),
    },
    { key: 'origem', label: 'Referência', width: 110 },
    { key: 'responsavel', label: 'Usuário', width: 110, mobileHidden: true },
  ];

  return (
    <div>
      <PageHeader
        title="Movimentações de Estoque"
        breadcrumbs={['Início', 'Estoque', 'Movimentações']}
        actions={
          podeMov ? (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            >
              <Plus size={13} /> Nova movimentação
            </button>
          ) : null
        }
      />
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[
            {
              key: 'tipo',
              label: 'Tipo',
              options: ['Entrada', 'Saída', 'Ajuste'].map((s) => ({ value: s, label: s })),
            },
          ]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => {
            setSearch('');
            setFilters({});
          }}
        />
        <div className="overflow-x-auto min-w-0">
          <DataTable columns={columns} data={filtered} loading={loading} />
        </div>
      </div>
      {showModal && podeMov && (
        <ModalMovimentacao onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
