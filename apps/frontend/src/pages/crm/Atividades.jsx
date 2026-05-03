import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { Phone, Mail, Users, Calendar, Plus, MessageCircle, Clock } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';
import { api } from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const TIPOS = ['Ligação', 'WhatsApp', 'Reunião', 'Follow-up', 'E-mail', 'Visita', 'Tarefa', 'Outro'];

const tipoIcon = {
  Reunião: <Users size={13} />,
  Ligação: <Phone size={13} />,
  WhatsApp: <MessageCircle size={13} />,
  'Follow-up': <Clock size={13} />,
  'E-mail': <Mail size={13} />,
  Visita: <Calendar size={13} />,
  Tarefa: <Calendar size={13} />,
  Outro: <Calendar size={13} />,
};

const tipoCor = {
  Reunião: 'bg-blue-100 text-blue-700',
  Ligação: 'bg-green-100 text-green-700',
  WhatsApp: 'bg-emerald-100 text-emerald-800',
  'Follow-up': 'bg-violet-100 text-violet-800',
  'E-mail': 'bg-purple-100 text-purple-700',
  Visita: 'bg-orange-100 text-orange-700',
  Tarefa: 'bg-slate-100 text-slate-700',
  Outro: 'bg-slate-100 text-slate-700',
};

function atividadeDateTimeIso(row) {
  return row.data_atividade || row.data || row.due || '';
}

function isOverdue(a) {
  const raw = atividadeDateTimeIso(a);
  if (!raw) return false;
  const st = String(a.status || '').toLowerCase();
  if (st.includes('conclu') || st.includes('cancel')) return false;
  const t = new Date(String(raw));
  if (Number.isNaN(t.getTime())) return false;
  return t < new Date();
}

const FORM_EMPTY = {
  titulo: '',
  tipo: 'Ligação',
  dataLocal: '',
  oportunidade_id: '',
  responsavel: '',
  observacao: '',
  status: 'Pendente',
};

export default function Atividades() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(FORM_EMPTY);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, todayRes] = await Promise.all([
        recordsServiceApi.list('crm_atividade').catch(() => []),
        api.get('/api/crm/activities/today').catch(() => ({ data: {} })),
      ]);
      const fromRecords = Array.isArray(recRes) ? recRes : [];
      const rawToday = Array.isArray(todayRes?.data?.data) ? todayRes.data.data : [];
      const fromApi = rawToday.map((r) => {
        const d = r?.data && typeof r.data === 'object' ? r.data : {};
        return {
          id: r.id,
          titulo: d.titulo || d.title || 'Atividade',
          tipo: d.tipo || 'Tarefa',
          data_atividade: d.data_atividade,
          data: d.data_atividade || d.data || d.due || '',
          relacionamento: d.relacionamento || '',
          observacao: d.observacao || '',
          responsavel: d.responsavel || '',
          status: d.status || 'Pendente',
          oportunidade_id: d.oportunidade_id || '',
          _fonte: 'api',
        };
      });
      const merged = [...fromApi, ...fromRecords.filter((a) => !fromApi.some((x) => x.id === a.id))];
      setRows(merged);
    } catch (e) {
      toast.error(e?.message || 'Erro ao carregar atividades.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showModal) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setForm({
      ...FORM_EMPTY,
      responsavel: user?.fullName || user?.nome || '',
      dataLocal: now.toISOString().slice(0, 16),
    });
  }, [showModal, user]);

  const handleSave = async () => {
    if (!form.titulo?.trim()) return toast.error('Informe o título');
    if (!form.dataLocal) return toast.error('Informe data e hora');
    setSaving(true);
    try {
      const iso = new Date(form.dataLocal).toISOString();
      await recordsServiceApi.create('crm_atividade', {
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        data_atividade: iso,
        data: iso,
        oportunidade_id: String(form.oportunidade_id || '').trim() || undefined,
        responsavel: form.responsavel || user?.fullName || '',
        observacao: form.observacao || '',
        status: form.status || 'Pendente',
      });
      await load();
      setShowModal(false);
      setForm(FORM_EMPTY);
      toast.success('Atividade cadastrada.');
    } catch (e) {
      toast.error((e?.body && e.body.error) || e?.message || 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Atividades"
        breadcrumbs={['Início', 'CRM', 'Atividades']}
        actions={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"
          >
            <Plus size={13} /> Nova Atividade
          </button>
        }
      />
      <div className="bg-white border border-border rounded-lg divide-y divide-border">
        {loading && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">Carregando…</div>
        )}
        {!loading && rows.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            Nenhuma atividade cadastrada (entidade crm_atividade).
          </div>
        )}
        {!loading &&
          rows.map((a) => {
            const tipo = a.tipo || 'Tarefa';
            const rawDt = atividadeDateTimeIso(a);
            const dataStr = rawDt ? String(rawDt).slice(0, 10) : '';
            const horaStr =
              rawDt && String(rawDt).length > 12
                ? new Date(rawDt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '';
            const icon = tipoIcon[tipo] || tipoIcon.Tarefa;
            const cor = tipoCor[tipo] || tipoCor.Tarefa;
            const statusOk = String(a.status || '').toLowerCase().includes('concl');
            const overdue = !statusOk && isOverdue(a);
            return (
              <div
                key={a.id}
                className={`flex items-start gap-4 px-4 py-3 hover:bg-muted/40 transition-colors ${
                  overdue ? 'bg-destructive/5' : ''
                }`}
              >
                <div className="w-20 text-center shrink-0">
                  <div className="text-xs font-bold text-foreground">
                    {dataStr
                      ? new Date(dataStr + 'T12:00').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })
                      : '—'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{horaStr || '—'}</div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium shrink-0 ${cor}`}>
                  {icon}
                  {tipo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{a.titulo || '—'}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {a.relacionamento || '—'}
                    {a.observacao ? ` — ${a.observacao}` : ''}
                    {overdue ? (
                      <span className="ml-1 font-semibold text-destructive">(atrasada)</span>
                    ) : null}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0">{a.responsavel || '—'}</div>
                <div
                  className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${
                    statusOk ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {a.status || '—'}
                </div>
              </div>
            );
          })}
      </div>

      {showModal && (
        <FormModal title="Nova atividade" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} size="md">
          <div className="space-y-3">
            <div>
              <label className={lbl}>Título {req}</label>
              <input className={inp} value={form.titulo} onChange={(e) => upd('titulo', e.target.value)} placeholder="Ex.: Retornar proposta" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Tipo {req}</label>
                <select className={inp} value={form.tipo} onChange={(e) => upd('tipo', e.target.value)}>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Data e hora {req}</label>
                <input
                  type="datetime-local"
                  className={inp}
                  value={form.dataLocal}
                  onChange={(e) => upd('dataLocal', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={lbl}>Oportunidade (ID)</label>
              <input
                className={inp}
                value={form.oportunidade_id}
                onChange={(e) => upd('oportunidade_id', e.target.value)}
                placeholder="UUID da oportunidade (opcional)"
              />
            </div>
            <div>
              <label className={lbl}>Responsável</label>
              <input className={inp} value={form.responsavel} onChange={(e) => upd('responsavel', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Observação</label>
              <textarea className={inp} rows={2} value={form.observacao} onChange={(e) => upd('observacao', e.target.value)} />
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
