import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { toast } from 'sonner';
import { ClipboardCheck, RefreshCw } from 'lucide-react';
import { getQualityGateReport } from '@/services/qualityGateApi';

export default function Qualidade() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getQualityGateReport();
      setRaw(res);
    } catch (e) {
      toast.error(e?.message || 'Falha ao carregar relatório.');
      setRaw(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const data = raw?.data;
  const summary = data?.summary;
  const be = data?.backendRoutes;
  const fe = data?.frontend;
  const biz = data?.businessRules;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quality gate"
        breadcrumbs={['Início', 'Sistema', 'Qualidade']}
        actions={(
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded border border-border bg-white px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Recarregar
          </button>
        )}
      />

      <div className="rounded-lg border border-border bg-white p-4 shadow-sm text-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <ClipboardCheck size={14} />
          <span>
            Último relatório gerado por
            {' '}
            <code className="rounded bg-muted px-1">npm run quality:gate</code>
            {' '}
            na raiz — ficheiro
            {' '}
            <code className="rounded bg-muted px-1">reports/quality-gate-last.json</code>
            .
            {' '}CI pode correr modo
            {' '}
            <code className="rounded bg-muted px-1">--strict</code>
            {' '}
            após ir reduzindo avisos heurísticos.
          </span>
        </div>

        {loading ? (
          <p className="text-muted-foreground">A carregar…</p>
        ) : raw?.message ? (
          <p className="text-amber-800 text-sm">{raw.message}</p>
        ) : (
          <>
            {summary ? (
              <div className="grid gap-2 sm:grid-cols-3 text-xs">
                <div className="rounded border border-border p-2">
                  <div className="font-medium">Avisos heurísticos</div>
                  <div className="text-lg font-semibold">{summary.heuristicWarns ?? '—'}</div>
                </div>
                <div className="rounded border border-border p-2">
                  <div className="font-medium">ESLint frontend (exit)</div>
                  <div className="text-lg font-semibold">{summary.eslintFrontendExit ?? '—'}</div>
                </div>
                <div className="rounded border border-border p-2">
                  <div className="font-medium">tsc backend (exit)</div>
                  <div className="text-lg font-semibold">{summary.tscBackendExit ?? '—'}</div>
                </div>
              </div>
            ) : null}

            <div className="text-xs font-medium pt-2">Rotas backend (avisos)</div>
            <ul className="max-h-40 overflow-auto text-xs border border-border rounded p-2 bg-muted/30">
              {(be?.warnings ?? []).slice(0, 25).map((w, i) => (
                <li key={`${w.file}-${i}`} className="py-0.5 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{w.rule}</span>
                  {' '}
                  — {w.file}
                  {w.line ? `:${w.line}` : ''}
                  <span className="block text-muted-foreground">{w.message}</span>
                </li>
              ))}
              {(be?.warnings ?? []).length > 25 ? (
                <li className="text-muted-foreground py-1">… +{(be?.warnings ?? []).length - 25}</li>
              ) : null}
            </ul>

            <div className="text-xs font-medium pt-2">Frontend (avisos)</div>
            <ul className="max-h-32 overflow-auto text-xs border border-border rounded p-2 bg-muted/30">
              {(fe?.warnings ?? []).slice(0, 15).map((w, i) => (
                <li key={`${w.file}-${i}`} className="py-0.5">
                  {w.file}
                  {w.line ? `:${w.line}` : ''}
                  {' '}
                  — {w.rule}
                </li>
              ))}
            </ul>

            <div className="text-xs font-medium pt-2">Regras de negócio (schema)</div>
            <pre className="text-[11px] overflow-auto rounded border border-border p-2 bg-muted/40 max-h-32">
              {biz?.policyReport ? JSON.stringify(biz.policyReport, null, 2) : '—'}
            </pre>

            <p className="text-[11px] text-muted-foreground">
              Gerado em:
              {' '}
              {data?.generatedAt || '—'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
