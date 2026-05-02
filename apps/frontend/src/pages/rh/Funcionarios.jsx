import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalFuncionario from '@/components/rh/ModalFuncionario';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`;
const fmtD = (v) => (v ? new Date(String(v).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR') : '—');

function mapEmployeeToRow(e) {
  return {
    id: e.id,
    matricula: e.code,
    nome: e.fullName,
    cargo: e.department || '—',
    departamento: e.department || '',
    tipo_contrato: 'CLT',
    salario: e.salaryBase != null ? Number(e.salaryBase) : '',
    data_admissao: e.hireDate ? String(e.hireDate).slice(0, 10) : '',
    status: e.active ? 'Ativo' : 'Inativo',
    email: e.email || '',
    telefone: '',
  };
}

async function fetchEmployees() {
  const res = await api.get('/api/hr/employees');
  const rows = res?.data?.data;
  return Array.isArray(rows) ? rows.map(mapEmployeeToRow) : [];
}

export default function Funcionarios() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['hr-employees'],
    queryFn: fetchEmployees,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ form, id }) => {
      const payload = {
        code: form.matricula?.trim() || `MAT-${Date.now().toString().slice(-6)}`,
        fullName: form.nome,
        email: form.email || null,
        department: form.departamento || form.cargo || null,
        hireDate: form.data_admissao || null,
        salaryBase: form.salario !== '' && form.salario != null ? Number(form.salario) : null,
        active: form.status !== 'Inativo',
      };
      if (id) {
        await api.patch(`/api/hr/employees/${id}`, payload);
      } else {
        await api.post('/api/hr/employees', payload);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['hr-employees'] });
      toast.success('Funcionário salvo.');
    },
    onError: (e) => {
      toast.error(e?.response?.data?.error || e?.message || 'Erro ao salvar.');
    },
  });

  const handleSave = async (form) => {
    await saveMutation.mutateAsync({ form, id: editando?.id });
  };

  const filtered = useMemo(() => {
    return data.filter((f) => {
      const s = search.toLowerCase();
      return (
        (!s || f.nome?.toLowerCase().includes(s) || f.cargo?.toLowerCase().includes(s))
        && (!filters.departamento || f.departamento === filters.departamento)
        && (!filters.status || f.status === filters.status)
      );
    });
  }, [data, search, filters.departamento, filters.status]);

  const deptos = useMemo(() => [...new Set(data.map((m) => m.departamento).filter(Boolean))], [data]);

  const columns = [
    { key: 'matricula', label: 'Matrícula', width: 90 },
    {
      key: 'nome',
      label: 'Nome',
      render: (v, row) => (
        <button
          type="button"
          className="text-left font-medium text-primary hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            setDetalhe(row);
          }}
        >
          {v}
        </button>
      ),
    },
    { key: 'cargo', label: 'Cargo', width: 150 },
    { key: 'departamento', label: 'Depto.', width: 110 },
    { key: 'tipo_contrato', label: 'Contrato', width: 80 },
    { key: 'salario', label: 'Salário', width: 100, render: fmtR },
    { key: 'data_admissao', label: 'Admissão', width: 90, render: fmtD },
    { key: 'status', label: 'Status', width: 80, render: (v) => <StatusBadge status={v} />, sortable: false },
  ];

  return (
    <div>
      <PageHeader
        title="Funcionários"
        breadcrumbs={['Início', 'RH', 'Funcionários']}
        actions={(
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs cozinha-blue-bg text-white hover:opacity-90"
          >
            <Plus size={13} /> Novo Funcionário
          </button>
        )}
      />
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <FilterBar
          search={search}
          onSearch={setSearch}
          filters={[
            { key: 'departamento', label: 'Departamento', options: deptos.map((d) => ({ value: d, label: d })) },
            { key: 'status', label: 'Status', options: ['Ativo', 'Inativo', 'Férias', 'Afastado'].map((s) => ({ value: s, label: s })) },
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

      {(showModal || editando) && (
        <ModalFuncionario
          funcionario={editando}
          onClose={() => {
            setShowModal(false);
            setEditando(null);
          }}
          onSave={handleSave}
        />
      )}

      {detalhe && (
        <DetalheModal title={detalhe.nome} subtitle={`${detalhe.matricula} · ${detalhe.cargo}`} onClose={() => setDetalhe(null)}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Departamento', detalhe.departamento],
              ['Cargo', detalhe.cargo],
              ['Contrato', detalhe.tipo_contrato],
              ['Salário', fmtR(detalhe.salario)],
              ['Admissão', fmtD(detalhe.data_admissao)],
              ['Status', detalhe.status],
              ['E-mail', detalhe.email || '—'],
              ['Telefone', detalhe.telefone || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEditando(detalhe);
                setDetalhe(null);
              }}
              className="rounded px-3 py-1.5 text-xs cozinha-blue-bg text-white hover:opacity-90"
            >
              Editar
            </button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}
