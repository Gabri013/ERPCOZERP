import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

const statusCor = {
  APROVADO: 'bg-green-100 text-green-700',
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  RASCUNHO: 'bg-gray-100 text-gray-600',
  REJEITADO: 'bg-red-100 text-red-700',
};

const fmtD = (v) => (v ? new Date(String(v).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR') : '—');

export default function Ferias() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [form, setForm] = useState({ employeeId: '', startDate: '', endDate: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function load() {
    setLoading(true);
    try {
      const [lr, em] = await Promise.all([api.get('/api/hr/leave-requests'), api.get('/api/hr/employees')]);
      const rows = Array.isArray(lr?.data?.data) ? lr.data.data : [];
      setData(
        rows.map((r) => ({
          id: r.id,
          nome: r.employee?.fullName || '—',
          matricula: r.employee?.code || '—',
          cargo: '—',
          data_inicio: r.startDate ? String(r.startDate).slice(0, 10) : '',
          data_fim: r.endDate ? String(r.endDate).slice(0, 10) : '',
          dias: r.startDate && r.endDate
            ? Math.max(1, Math.round((new Date(r.endDate) - new Date(r.startDate)) / 86400000) + 1)
            : '—',
          status: r.status || 'PENDENTE',
          observacoes: r.reason || '',
        })),
      );
      setEmployees(Array.isArray(em?.data?.data) ? em.data.data : []);
    } catch {
      toast.error('Erro ao carregar férias.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!form.employeeId || !form.startDate || !form.endDate) {
      toast.error('Preencha funcionário e período.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/hr/leave-requests', {
        employeeId: form.employeeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
      });
      toast.success('Solicitação registrada.');
      await load();
      setShowModal(false);
      setForm({ employeeId: '', startDate: '', endDate: '', reason: '' });
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'nome', label: 'Funcionário' },
    { key: 'matricula', label: 'Matrícula', width: 90 },
    { key: 'cargo', label: 'Cargo', width: 150 },
    { key: 'data_inicio', label: 'Início', width: 100, render: fmtD },
    { key: 'data_fim', label: 'Fim', width: 100, render: fmtD },
    { key: 'dias', label: 'Dias', width: 60 },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      render: (v) => (
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${statusCor[v] || 'bg-gray-100'}`}>
          {v}
        </span>
      ),
      sortable: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Férias / ausências"
        breadcrumbs={['Início', 'RH', 'Férias']}
        actions={(
          <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs cozinha-blue-bg text-white hover:opacity-90">
            <Plus size={13} /> Nova solicitação
          </button>
        )}
      />
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <DataTable columns={columns} data={data} onRowClick={(row) => setDetalhe(row)} loading={loading} />
      </div>

      {showModal && (
        <FormModal title="Solicitar período" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div>
              <label className={lbl}>Funcionário {req}</label>
              <select className={inp} value={form.employeeId} onChange={(e) => upd('employeeId', e.target.value)}>
                <option value="">Selecione…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} — {e.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Início {req}</label>
                <input type="date" className={inp} value={form.startDate} onChange={(e) => upd('startDate', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Fim {req}</label>
                <input type="date" className={inp} value={form.endDate} onChange={(e) => upd('endDate', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={lbl}>Motivo</label>
              <input className={inp} value={form.reason} onChange={(e) => upd('reason', e.target.value)} />
            </div>
          </div>
        </FormModal>
      )}

      {detalhe && (
        <DetalheModal title={detalhe.nome} subtitle={`${detalhe.matricula} · ${detalhe.status}`} onClose={() => setDetalhe(null)}>
          <p className="text-xs text-muted-foreground">{detalhe.observacoes || 'Sem observações.'}</p>
        </DetalheModal>
      )}
    </div>
  );
}
