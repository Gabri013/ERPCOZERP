import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus } from 'lucide-react';
import { listSuppliers, createSupplier, patchSupplier } from '@/services/purchasesApi';
import { usePermissions } from '@/lib/PermissaoContext';

function mapToUi(s) {
  if (!s) return s;
  return {
    id: s.id,
    codigo: s.code,
    razao_social: s.name,
    cnpj_cpf: s.document ?? '',
    email: s.email ?? '',
    telefone: s.phone ?? '',
    status: s.active === false ? 'Inativo' : 'Ativo',
    _raw: s,
  };
}

const columns = [
  { key: 'codigo', label: 'Código', width: 90 },
  { key: 'razao_social', label: 'Nome/Razão Social' },
  { key: 'cnpj_cpf', label: 'CNPJ/CPF', width: 150, mobileHidden: true },
  { key: 'email', label: 'E-mail', width: 180, mobileHidden: true },
  { key: 'telefone', label: 'Telefone', width: 130, mobileHidden: true },
  {
    key: 'status',
    label: 'Status',
    width: 80,
    render: (v) => <StatusBadge status={v} />,
    sortable: false,
  },
];

export default function Fornecedores() {
  const { pode } = usePermissions();
  const podeEditar = pode('criar_oc') || pode('editar_fornecedores') || pode('ordem_compra.edit');
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const rows = await listSuppliers();
      setData(rows.map(mapToUi));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleSave = async (form) => {
    if (editando?.id) {
      await patchSupplier(editando.id, {
        name: form.razao_social?.trim() || editando.razao_social,
        document: form.cnpj_cpf?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.telefone?.trim() || null,
        active: form.status !== 'Inativo',
      });
    } else {
      await createSupplier({
        name: form.razao_social?.trim(),
        code: form.codigo?.trim() || undefined,
        document: form.cnpj_cpf?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.telefone?.trim() || null,
      });
    }
    await reload();
    setEditando(null);
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (f) =>
        (!s ||
          f.razao_social?.toLowerCase().includes(s) ||
          f.codigo?.toLowerCase().includes(s) ||
          f.cnpj_cpf?.toLowerCase().includes(s)) &&
        (!filters.status || f.status === filters.status),
    );
  }, [data, search, filters]);

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        breadcrumbs={['Início', 'Compras', 'Fornecedores']}
        actions={
          podeEditar ? (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
            >
              <Plus size={13} /> Novo Fornecedor
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
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => setDetalhe(row)}
          loading={loading}
        />
      </div>

      {(showModal || editando) && podeEditar && (
        <ModalFornecedor
          fornecedor={editando}
          onClose={() => {
            setShowModal(false);
            setEditando(null);
          }}
          onSave={handleSave}
        />
      )}

      {detalhe && (
        <DetalheModal
          title={detalhe.razao_social}
          subtitle={detalhe.codigo}
          onClose={() => setDetalhe(null)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              ['Código', detalhe.codigo],
              ['Razão Social', detalhe.razao_social],
              ['CNPJ/CPF', detalhe.cnpj_cpf || '—'],
              ['E-mail', detalhe.email || '—'],
              ['Telefone', detalhe.telefone || '—'],
              ['Status', detalhe.status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          {podeEditar && (
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditando(detalhe);
                  setDetalhe(null);
                }}
                className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
              >
                Editar
              </button>
            </div>
          )}
        </DetalheModal>
      )}
    </div>
  );
}

function ModalFornecedor({ fornecedor, onClose, onSave }) {
  const [form, setForm] = useState({
    codigo: fornecedor?.codigo ?? '',
    razao_social: fornecedor?.razao_social ?? '',
    cnpj_cpf: fornecedor?.cnpj_cpf ?? '',
    email: fornecedor?.email ?? '',
    telefone: fornecedor?.telefone ?? '',
    status: fornecedor?.status ?? 'Ativo',
  });
  const [saving, setSaving] = useState(false);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.razao_social?.trim()) return alert('Nome/Razão social é obrigatório');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      title={fornecedor?.id ? `Editar — ${fornecedor.razao_social}` : 'Novo Fornecedor'}
      onClose={onClose}
      onSave={submit}
      saving={saving}
      size="md"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Código</label>
          <input
            className={inp}
            value={form.codigo}
            onChange={(e) => upd('codigo', e.target.value)}
            disabled={!!fornecedor?.id}
            placeholder="FOR-001 (auto se vazio)"
          />
        </div>
        <div>
          <label className={lbl}>Status</label>
          <select className={inp} value={form.status} onChange={(e) => upd('status', e.target.value)}>
            <option>Ativo</option>
            <option>Inativo</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={lbl}>
            Nome / Razão Social {req}
          </label>
          <input
            className={inp}
            value={form.razao_social}
            onChange={(e) => upd('razao_social', e.target.value)}
          />
        </div>
        <div>
          <label className={lbl}>CNPJ / CPF</label>
          <input className={inp} value={form.cnpj_cpf} onChange={(e) => upd('cnpj_cpf', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Telefone</label>
          <input className={inp} value={form.telefone} onChange={(e) => upd('telefone', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={lbl}>E-mail</label>
          <input
            type="email"
            className={inp}
            value={form.email}
            onChange={(e) => upd('email', e.target.value)}
          />
        </div>
      </div>
    </FormModal>
  );
}
