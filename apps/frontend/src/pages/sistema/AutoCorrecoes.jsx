import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { toast } from 'sonner';
import { Activity, RefreshCw, Sparkles } from 'lucide-react';
import {
  analyzeErrorQueueItem,
  fetchErrorQueue,
  patchErrorQueueStatus,
} from '@/services/errorMonitorApi';

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'analyzing', label: 'A analisar' },
  { value: 'review_required', label: 'Revisão' },
  { value: 'fixed', label: 'Corrigidos' },
  { value: 'ignored', label: 'Ignorados' },
];

export default function AutoCorrecoes() {
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchErrorQueue({ status: status || undefined, take: 150 });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e?.message || 'Falha ao carregar fila.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatusRow = async (id, next) => {
    setBusyId(id);
    try {
      await patchErrorQueueStatus(id, { status: next });
      toast.success('Estado atualizado.');
      await load();
    } catch (e) {
      toast.error(e?.message || 'Falha ao atualizar.');
    } finally {
      setBusyId(null);
    }
  };

  const analyze = async (id) => {
    setBusyId(id);
    try {
      await analyzeErrorQueueItem(id);
      toast.success('Análise concluída.');
      await load();
    } catch (e) {
      toast.error(e?.message || 'Falha na análise.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Auto-correções"
        breadcrumbs={['Início', 'Sistema', 'Auto-correções']}
        actions={(
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded border border-border bg-white px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        )}
      />

      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <Activity size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">
            Fila de erros detetados (browser e API). Análise com heurística ou OpenAI se
            {' '}
            <code className="rounded bg-muted px-1">OPENAI_API_KEY</code>
            {' '}
            estiver definida no backend. Correções de código aplicam-se via PR/CI — não em runtime.
          </span>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted-foreground">Filtrar:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border border-border bg-white px-2 py-1 text-xs"
          >
            {STATUS_OPTS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registo neste filtro.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-2">Data</th>
                  <th className="py-2 pr-2">Severidade</th>
                  <th className="py-2 pr-2">Tipo</th>
                  <th className="py-2 pr-2">Estado</th>
                  <th className="py-2 pr-2">Rota</th>
                  <th className="py-2 pr-2">Descrição</th>
                  <th className="py-2 pr-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/80 align-top">
                    <td className="py-2 pr-2 whitespace-nowrap text-muted-foreground">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-2 pr-2 font-medium">{r.severity}</td>
                    <td className="py-2 pr-2">{r.type}</td>
                    <td className="py-2 pr-2">{r.status}</td>
                    <td className="py-2 pr-2 max-w-[140px] truncate" title={r.route || ''}>{r.route || '—'}</td>
                    <td className="py-2 pr-2 max-w-[280px]">
                      <div className="line-clamp-2" title={r.description}>{r.description}</div>
                      {r.probableCause ? (
                        <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2" title={r.probableCause}>
                          Causa provável: {r.probableCause}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          className="rounded border border-border px-2 py-0.5 hover:bg-muted disabled:opacity-50"
                          onClick={() => void analyze(r.id)}
                        >
                          <Sparkles size={12} className="inline mr-0.5" />
                          Analisar
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          className="rounded border border-border px-2 py-0.5 hover:bg-muted disabled:opacity-50"
                          onClick={() => void setStatusRow(r.id, 'ignored')}
                        >
                          Ignorar
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          className="rounded border border-border px-2 py-0.5 hover:bg-muted disabled:opacity-50"
                          onClick={() => void setStatusRow(r.id, 'review_required')}
                        >
                          Revisão
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          className="rounded border border-border px-2 py-0.5 hover:bg-muted disabled:opacity-50"
                          onClick={() => void setStatusRow(r.id, 'fixed')}
                        >
                          Resolvido
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
