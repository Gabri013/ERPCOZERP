import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FormModal, { inp, lbl } from '@/components/common/FormModal';
import { Clock, Plus, Download } from 'lucide-react';
import { exportPdfReport } from '@/services/pdfExport';
import { api } from '@/services/api';
import { toast } from 'sonner';

export default function Ponto() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employeeId: '', workDate: '', hours: 8, notes: '' });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function load() {
    setLoading(true);
    try {
      const [te, em] = await Promise.all([
        api.get('/api/hr/time-entries'),
        api.get('/api/hr/employees'),
      ]);
      setRows(Array.isArray(te?.data?.data) ? te.data.data : []);
      setEmployees(Array.isArray(em?.data?.data) ? em.data.data : []);
    } catch {
      toast.error('Erro ao carregar ponto.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const id = r.employeeId;
      const name = r.employee?.fullName || id;
      if (!map.has(id)) map.set(id, { id, name, registros: [] });
      map.get(id).registros.push({
        id: r.id,
        data: r.workDate ? String(r.workDate).slice(0, 10) : '',
        horas: Number(r.hours || 0),
        notes: r.notes || '',
      });
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      registros: g.registros.sort((a, b) => String(b.data).localeCompare(String(a.data))),
    }));
  }, [rows]);

  const [sel, setSel] = useState(0);
  const func = grouped[sel];

  const handleSave = async () => {
    if (!form.employeeId || !form.workDate) {
      toast.error('Funcionário e data são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/hr/time-entries', {
        employeeId: form.employeeId,
        workDate: form.workDate,
        hours: Number(form.hours) || 0,
        notes: form.notes || undefined,
      });
      toast.success('Registro lançado.');
      await load();
      setShowModal(false);
      setForm({ employeeId: '', workDate: '', hours: 8, notes: '' });
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const exportar = () => {
    exportPdfReport({
      title: 'Ponto Eletrônico',
      subtitle: 'Registros (API RH)',
      filename: 'ponto.pdf',
      table: {
        headers: ['Funcionário', 'Data', 'Horas', 'Observações'],
        rows: rows.map((r) => [
          r.employee?.fullName || '—',
          r.workDate ? String(r.workDate).slice(0, 10) : '—',
          String(r.hours ?? ''),
          r.notes || '',
        ]),
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Ponto Eletrônico"
        breadcrumbs={['Início', 'RH', 'Ponto Eletrônico']}
        actions={(
          <div className="flex gap-2">
            <button type="button" onClick={exportar} className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs hover:bg-muted">
              <Download size={13} /> Exportar PDF
            </button>
            <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs cozinha-blue-bg text-white hover:opacity-90">
              <Plus size={13} /> Novo lançamento
            </button>
          </div>
        )}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-white lg:col-span-1">
            <div className="border-b border-border px-3 py-2 text-xs font-semibold">Funcionários</div>
            <div className="max-h-80 overflow-y-auto">
              {grouped.map((g, i) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSel(i)}
                  className={`flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-xs last:border-0 ${sel === i ? 'bg-muted font-medium' : 'hover:bg-muted/60'}`}
                >
                  <Clock size={12} className="shrink-0 text-muted-foreground" />
                  {g.name}
                </button>
              ))}
              {grouped.length === 0 && <div className="px-3 py-6 text-center text-xs text-muted-foreground">Sem lançamentos.</div>}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold">{func?.name || '—'}</h3>
            <div className="space-y-2">
              {(func?.registros || []).map((reg) => (
                <div key={reg.id || reg.data} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-xs">
                  <span>{reg.data ? new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                  <span className="font-semibold">{reg.horas} h</span>
                  <span className="text-muted-foreground">{reg.notes || '—'}</span>
                </div>
              ))}
              {(!func?.registros?.length) && <p className="text-xs text-muted-foreground">Nenhum registro.</p>}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <FormModal title="Novo lançamento de horas" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div>
              <label className={lbl}>Funcionário</label>
              <select className={inp} value={form.employeeId} onChange={(e) => upd('employeeId', e.target.value)}>
                <option value="">Selecione…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} — {e.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Data</label>
              <input type="date" className={inp} value={form.workDate} onChange={(e) => upd('workDate', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Horas</label>
              <input type="number" min="0.5" step="0.5" className={inp} value={form.hours} onChange={(e) => upd('hours', Number(e.target.value))} />
            </div>
            <div>
              <label className={lbl}>Observações</label>
              <input className={inp} value={form.notes} onChange={(e) => upd('notes', e.target.value)} />
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
