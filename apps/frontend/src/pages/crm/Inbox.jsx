import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Inbox, Send, UserPlus, Briefcase, AlertTriangle } from 'lucide-react';

function fmtRelative(iso) {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

const CHANNEL_LABEL = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  manual: 'Manual',
};

export default function CrmInboxPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [users, setUsers] = useState([]);
  const [assignId, setAssignId] = useState('');
  const [alerts, setAlerts] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    channel: 'manual',
    contatoNome: '',
    contatoTelefone: '',
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const res = await api.get(`/api/crm/conversations${qs}`);
      const body = res?.data;
      if (!body?.success) throw new Error('Lista inválida');
      setList(Array.isArray(body.data) ? body.data : []);
    } catch (e) {
      toast.error(e?.message || 'Falha ao carregar conversas');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await api.get('/api/crm/inbox/alerts');
      const body = res?.data;
      if (body?.success) setAlerts(body.data);
    } catch {
      setAlerts(null);
    }
  }, []);

  useEffect(() => {
    void loadList();
    void loadAlerts();
  }, [loadList, loadAlerts]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/crm/assignable-users');
        const body = res?.data;
        if (mounted && body?.success) setUsers(Array.isArray(body.data) ? body.data : []);
      } catch {
        if (mounted) setUsers([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/crm/conversations/${id}`);
      const body = res?.data;
      if (!body?.success) throw new Error('Detalhe inválido');
      setDetail(body.data);
      setAssignId(body.data?.responsavelId || '');
    } catch (e) {
      toast.error(e?.message || 'Falha ao abrir conversa');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const send = async () => {
    if (!selectedId || !draft.trim()) return;
    try {
      await api.post('/api/crm/messages', {
        conversationId: selectedId,
        message: draft.trim(),
        messageType: 'text',
      });
      setDraft('');
      toast.success('Mensagem enviada (simulado)');
      await loadDetail(selectedId);
      await loadList();
      await loadAlerts();
    } catch (e) {
      toast.error(e?.message || 'Falha ao enviar');
    }
  };

  const saveAssign = async () => {
    if (!selectedId) return;
    try {
      await api.patch(`/api/crm/conversations/${selectedId}/assign`, {
        responsavelId: assignId || null,
      });
      toast.success('Responsável atualizado');
      await loadList();
      await loadDetail(selectedId);
      await loadAlerts();
    } catch (e) {
      toast.error(e?.message || 'Falha ao atribuir');
    }
  };

  const createOpp = async () => {
    if (!selectedId) return;
    try {
      await api.post(`/api/crm/conversations/${selectedId}/opportunity`, {});
      toast.success('Oportunidade criada');
      await loadDetail(selectedId);
      await loadList();
    } catch (e) {
      toast.error(e?.message || 'Falha ao criar oportunidade');
    }
  };

  const createConv = async () => {
    try {
      await api.post('/api/crm/conversations', {
        channel: newForm.channel,
        contatoNome: newForm.contatoNome.trim(),
        contatoTelefone: newForm.contatoTelefone.trim(),
      });
      toast.success('Conversa criada');
      setShowNew(false);
      setNewForm({ channel: 'manual', contatoNome: '', contatoTelefone: '' });
      await loadList();
      await loadAlerts();
    } catch (e) {
      toast.error(e?.message || 'Falha ao criar');
    }
  };

  const alertCount =
    (alerts?.semResponsavel?.length || 0) + (alerts?.semRespostaHaMaisDe1h?.length || 0);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <PageHeader title="CRM — Inbox" breadcrumbs={['Início', 'CRM', 'Inbox']} />

      {alertCount > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Alertas de atendimento</p>
            <p className="text-xs text-amber-800/90">
              {alerts?.semResponsavel?.length ? `${alerts.semResponsavel.length} sem responsável. ` : ''}
              {alerts?.semRespostaHaMaisDe1h?.length
                ? `${alerts.semRespostaHaMaisDe1h.length} sem resposta há mais de 1 h.`
                : ''}
            </p>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden rounded-lg border border-border bg-card">
        <aside className="flex w-full max-w-sm flex-col border-r border-border bg-muted/20">
          <div className="flex items-center justify-between gap-2 border-b border-border p-2">
            <select
              className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="finalizado">Finalizado</option>
            </select>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground"
              onClick={() => setShowNew(true)}
            >
              Nova
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-3 text-sm text-muted-foreground">Carregando…</p>
            ) : list.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Nenhuma conversa.</p>
            ) : (
              list.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2.5 text-left text-sm hover:bg-muted/60 ${
                    selectedId === c.id ? 'bg-muted' : ''
                  }`}
                >
                  <span className="font-medium leading-tight">{c.contatoNome}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {CHANNEL_LABEL[c.channel] || c.channel} · {fmtRelative(c.lastMessageAt || c.updatedAt)}
                  </span>
                  {c.lastMessagePreview && (
                    <span className="line-clamp-2 text-xs text-muted-foreground">{c.lastMessagePreview}</span>
                  )}
                  {!c.responsavelId && (
                    <span className="text-[10px] font-medium text-amber-700">Sem responsável</span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <Inbox className="h-10 w-10 opacity-40" />
              <p className="text-sm">Selecione uma conversa à esquerda.</p>
            </div>
          ) : detailLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando conversa…</p>
          ) : !detail ? (
            <p className="p-4 text-sm text-destructive">Conversa não encontrada.</p>
          ) : (
            <>
              <header className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/10 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold">{detail.contatoNome}</h2>
                  <p className="text-xs text-muted-foreground">
                    {CHANNEL_LABEL[detail.channel] || detail.channel} · {detail.contatoTelefone}
                    {detail.leadId ? ` · Lead: ${detail.leadId.slice(0, 8)}…` : ''}
                    {detail.opportunityId ? ` · Opp: ${detail.opportunityId.slice(0, 8)}…` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-9 min-w-[140px] rounded-md border border-input bg-background px-2 text-xs"
                    value={assignId}
                    onChange={(e) => setAssignId(e.target.value)}
                  >
                    <option value="">Responsável…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium"
                    onClick={() => void saveAssign()}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Atribuir
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(detail.opportunityId)}
                    className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium disabled:opacity-50"
                    onClick={() => void createOpp()}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    {detail.opportunityId ? 'Oportunidade' : 'Criar oportunidade'}
                  </button>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {(detail.messages || []).map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      m.direction === 'outbound'
                        ? 'ml-auto bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    <p className={`mt-1 text-[10px] ${m.direction === 'outbound' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {fmtRelative(m.createdAt)} · {m.messageType || 'text'}
                    </p>
                  </div>
                ))}
              </div>

              <footer className="border-t border-border p-3">
                <div className="flex gap-2">
                  <textarea
                    className="min-h-[44px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Escreva uma mensagem (simulado)…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                  />
                  <button
                    type="button"
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                    onClick={() => void send()}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-lg">
            <h3 className="mb-3 text-sm font-semibold">Nova conversa (manual)</h3>
            <div className="space-y-2 text-sm">
              <label className="block">
                <span className="text-xs text-muted-foreground">Canal</span>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2"
                  value={newForm.channel}
                  onChange={(e) => setNewForm((f) => ({ ...f, channel: e.target.value }))}
                >
                  <option value="manual">Manual</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Nome</span>
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2"
                  value={newForm.contatoNome}
                  onChange={(e) => setNewForm((f) => ({ ...f, contatoNome: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Telefone</span>
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2"
                  value={newForm.contatoTelefone}
                  onChange={(e) => setNewForm((f) => ({ ...f, contatoTelefone: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-1.5 text-sm"
                onClick={() => setShowNew(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                onClick={() => void createConv()}
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
