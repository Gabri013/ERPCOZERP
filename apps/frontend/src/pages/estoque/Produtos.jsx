import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalProduto from '@/components/estoque/ModalProduto';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportPdfReport } from '@/services/pdfExport';
import { stockApi, uiFormToStockPayload } from '@/services/stockApi';
import { usePermissions } from '@/lib/PermissaoContext';

const fmtR = (v) => (v ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : '—');

function podeProduto(pode, acao) {
  const legacy = ['produto.create', 'produto.update', 'produto.delete'].includes(acao)
    ? pode('editar_produtos')
    : false;
  return pode(acao) || legacy;
}

export default function Produtos() {
  const { pode } = usePermissions();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await stockApi.listProducts({
        search: search.trim() || undefined,
        status: filters.status || undefined,
      });
      setData(rows);
    } catch (err) {
      setError(err?.message || 'Falha ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [search, filters.status]);

  const handleSave = async (form) => {
    const payload = uiFormToStockPayload(form);
    if (editando?.id) {
      await stockApi.patchProduct(editando.id, payload);
    } else {
      await stockApi.createProduct(payload);
    }
    await load();
    setEditando(null);
  };

  const handleDelete = async (produto) => {
    if (!produto?.id) return;
    if (!podeProduto(pode, 'produto.delete')) return;
    if (!confirm(`Inativar ${produto.codigo || ''} — ${produto.descricao || ''}?`)) return;
    await stockApi.inactivateProduct(produto.id);
    setDetalhe(null);
    await load();
  };

  const filtered = useMemo(() => {
    return data.filter((p) => (!filters.tipo || p.tipo === filters.tipo));
  }, [data, filters.tipo]);

  const semEstoque = data.filter((p) => Number(p.estoque_atual) < Number(p.estoque_minimo)).length;

  const columns = [
    { key: 'codigo', label: 'Código', width: 90 },
    {
      key: 'descricao',
      label: 'Descrição',
      render: (v, row) => (
        <button
          type="button"
          className="text-primary hover:underline text-left"
          onClick={(e) => {
            e.stopPropagation();
            setDetalhe(row);
          }}
        >
          {v}
        </button>
      ),
    },
    { key: 'grupo', label: 'Grupo', width: 100, mobileHidden: true },
    { key: 'tipo', label: 'Tipo', width: 100, mobileHidden: true },
    { key: 'unidade', label: 'UN', width: 50, mobileHidden: true },
    { key: 'preco_custo', label: 'Custo', width: 90, render: fmtR, mobileHidden: true },
    { key: 'preco_venda', label: 'Venda', width: 90, render: fmtR },
    {
      key: 'estoque_atual',
      label: 'Estoque',
      width: 80,
      render: (v, row) => (
        <span
          className={
            Number(v) < Number(row.estoque_minimo)
              ? 'text-destructive font-semibold flex items-center gap-1'
              : ''
          }
        >
          {Number(v) < Number(row.estoque_minimo) && <AlertTriangle size={11} />}
          {v}
        </span>
      ),
    },
    { key: 'estoque_minimo', label: 'Mín.', width: 60, mobileHidden: true },
    {
      key: 'status',
      label: 'Status',
      width: 70,
      render: (v) => <StatusBadge status={v} />,
      sortable: false,
    },
  ];

  const podeCriar = podeProduto(pode, 'produto.create');
  const podeEditar = podeProduto(pode, 'produto.update');

  return (
    <div>
      <PageHeader
        title="Produtos"
        breadcrumbs={['Início', 'Estoque', 'Produtos']}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() =>
                exportPdfReport({
                  title: 'Produtos',
                  subtitle: 'Catálogo de itens, serviços e matérias-primas',
                  filename: 'produtos.pdf',
                  table: {
                    headers: [
                      'Código',
                      'Descrição',
                      'Grupo',
                      'Tipo',
                      'UN',
                      'Custo',
                      'Venda',
                      'Estoque',
                      'Mín.',
                      'Status',
                    ],
                    rows: data.map((produto) => [
                      produto.codigo,
                      produto.descricao,
                      produto.grupo,
                      produto.tipo,
                      produto.unidade,
                      fmtR(produto.preco_custo),
                      fmtR(produto.preco_venda),
                      produto.estoque_atual,
                      produto.estoque_minimo,
                      produto.status,
                    ]),
                  },
                })
              }
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              <Download size={13} /> Exportar PDF
            </button>
            {podeCriar && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
              >
                <Plus size={13} /> Novo Produto
              </button>
            )}
          </div>
        }
      />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-3 py-2 mb-3 text-xs text-red-700">{error}</div>
      )}
      {semEstoque > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3 text-xs text-red-700">
          <AlertTriangle size={13} />
          <strong>{semEstoque} produto(s)</strong> com estoque abaixo do mínimo
        </div>
      )}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[
            {
              key: 'tipo',
              label: 'Tipo',
              options: ['Produto', 'Serviço', 'Matéria-Prima', 'Semi-Acabado'].map((s) => ({
                value: s,
                label: s,
              })),
            },
            {
              key: 'status',
              label: 'Status',
              options: ['Ativo', 'Inativo'].map((s) => ({ value: s, label: s })),
            },
          ]}
          activeFilters={filters}
          onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClear={() => {
            setSearch('');
            setFilters({});
          }}
        />
        <DataTable columns={columns} data={filtered} onRowClick={(row) => setDetalhe(row)} loading={loading} />
      </div>

      {((showModal && podeCriar) || (editando && podeEditar)) && (
        <ModalProduto
          produto={editando}
          onClose={() => {
            setShowModal(false);
            setEditando(null);
          }}
          onSave={handleSave}
        />
      )}

      {detalhe && (
        <DetalheModal
          title={detalhe.descricao}
          subtitle={`${detalhe.codigo} · ${detalhe.tipo}`}
          onClose={() => setDetalhe(null)}
          onExport={() =>
            exportPdfReport({
              title: detalhe.descricao,
              subtitle: `${detalhe.codigo} · ${detalhe.tipo}`,
              filename: `${detalhe.codigo}.pdf`,
              fields: [
                { label: 'Código', value: detalhe.codigo },
                { label: 'Grupo', value: detalhe.grupo },
                { label: 'Unidade', value: detalhe.unidade },
                { label: 'Status', value: detalhe.status },
                { label: 'Custo', value: fmtR(detalhe.preco_custo) },
                { label: 'Venda', value: fmtR(detalhe.preco_venda) },
                { label: 'Estoque Atual', value: detalhe.estoque_atual },
                { label: 'Estoque Mín.', value: detalhe.estoque_minimo },
                { label: 'Localização', value: detalhe.localizacao || '—' },
                { label: 'NCM', value: detalhe.ncm || '—' },
              ],
              preview: true,
            })
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              ['Código', detalhe.codigo],
              ['Grupo', detalhe.grupo],
              ['Unidade', detalhe.unidade],
              ['Status', detalhe.status],
              ['Custo', fmtR(detalhe.preco_custo)],
              ['Venda', fmtR(detalhe.preco_venda)],
              ['Estoque Atual', detalhe.estoque_atual],
              ['Estoque Mín.', detalhe.estoque_minimo],
              ['Localização', detalhe.localizacao || '—'],
              ['NCM', detalhe.ncm || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          {detalhe.id && (
            <div className="mt-3">
              <Link
                to={`/estoque/produtos/${detalhe.id}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Ficha industrial — BOM SolidWorks, DXF/PDF, modelo 3D
              </Link>
            </div>
          )}
          <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2">
            {podeProduto(pode, 'produto.delete') && (
              <button
                type="button"
                onClick={() => handleDelete(detalhe)}
                className="px-3 py-2 sm:py-1.5 text-xs border border-destructive text-destructive rounded hover:bg-destructive/5"
              >
                Inativar
              </button>
            )}
            {podeEditar && (
              <button
                type="button"
                onClick={() => {
                  setEditando(detalhe);
                  setDetalhe(null);
                }}
                className="px-3 py-2 sm:py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
              >
                Editar
              </button>
            )}
          </div>
        </DetalheModal>
      )}
    </div>
  );
}
