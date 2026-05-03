import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { api } from '@/services/api';

export default function CrmDashboard() {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
        const [dashRes, alertRes] = await Promise.all([
          api.get('/api/crm/dashboard', { params }),
          api.get('/api/crm/alerts', { params }),
        ]);
        const dashBody = dashRes?.data;
        const alertBody = alertRes?.data;
        if (mounted && dashBody?.success) setData(dashBody.data);
        if (mounted && alertBody?.success) setAlerts(alertBody.data);
      } catch {
        if (mounted) {
          setData(null);
          setAlerts(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = data?.totalsByStage || {};
  const fmtBrl = (n) =>
    typeof n === 'number' && Number.isFinite(n)
      ? `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';
  const fmtPct = (n) =>
    n == null || typeof n !== 'number' || !Number.isFinite(n)
      ? '—'
      : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  const fmtDays = (n) =>
    n == null || typeof n !== 'number' || !Number.isFinite(n) ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} d`;

  const ax = data?.analytics;
  const conv = ax?.conversion;
  const anAlert = alerts?.analytics;

  return (
    <div>
      <PageHeader title="CRM — Dashboard" breadcrumbs={['Início', 'CRM', 'Dashboard']} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Pipeline aberto (R$)</p>
              <p className="text-2xl font-bold text-primary">{fmtBrl(data?.pipelineOpenTotalBrl)}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Leads</p>
              <p className="text-2xl font-bold">{data?.counts?.leads ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Oportunidades</p>
              <p className="text-2xl font-bold">{data?.counts?.opportunities ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Atividades (cadastro)</p>
              <p className="text-2xl font-bold">{data?.counts?.activities ?? '—'}</p>
            </div>
          </div>

          {ax && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Funil (últimos 90 dias)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                  <p className="text-[11px] font-semibold uppercase text-emerald-900">Lead → Oportunidade</p>
                  <p className="text-2xl font-bold text-emerald-900">{fmtPct(conv?.leadToOpportunity?.percent)}</p>
                  <p className="text-[11px] text-emerald-800/90">
                    {conv?.leadToOpportunity?.numerator ?? '—'} / {conv?.leadToOpportunity?.denominator ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-4">
                  <p className="text-[11px] font-semibold uppercase text-teal-900">Oportunidade → Orçamento</p>
                  <p className="text-2xl font-bold text-teal-900">{fmtPct(conv?.opportunityToQuote?.percent)}</p>
                  <p className="text-[11px] text-teal-800/90">
                    {conv?.opportunityToQuote?.numerator ?? '—'} / {conv?.opportunityToQuote?.denominator ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-4">
                  <p className="text-[11px] font-semibold uppercase text-cyan-900">Orçamento → Venda</p>
                  <p className="text-2xl font-bold text-cyan-900">{fmtPct(conv?.quoteToSale?.percent)}</p>
                  <p className="text-[11px] text-cyan-800/90">
                    {conv?.quoteToSale?.numerator ?? '—'} / {conv?.quoteToSale?.denominator ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-4">
                  <p className="text-[11px] font-semibold uppercase text-sky-900">Tempo médio fechamento</p>
                  <p className="text-2xl font-bold text-sky-900">{fmtDays(ax.avgSaleDays)}</p>
                  <p className="text-[11px] text-sky-800/90">Vendas ganhas (amostra)</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-[11px] font-semibold uppercase text-amber-900">Sem atividade futura</p>
              <p className="text-xl font-bold text-amber-900">
                {Array.isArray(data?.opportunitiesWithoutFutureActivity) ? data.opportunitiesWithoutFutureActivity.length : 0}
              </p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4">
              <p className="text-[11px] font-semibold uppercase text-orange-900">Oport. paradas (+3d)</p>
              <p className="text-xl font-bold text-orange-900">
                {Array.isArray(data?.opportunitiesStalled) ? data.opportunitiesStalled.length : 0}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
              <p className="text-[11px] font-semibold uppercase text-red-900">Leads sem responsável</p>
              <p className="text-xl font-bold text-red-900">
                {Array.isArray(data?.leadsWithoutResponsible) ? data.leadsWithoutResponsible.length : 0}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-800">Leads sem ação (+2d)</p>
              <p className="text-xl font-bold text-slate-800">
                {Array.isArray(data?.leadsStale) ? data.leadsStale.length : 0}
              </p>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
              <p className="text-[11px] font-semibold uppercase text-violet-900">Inbox sem responsável</p>
              <p className="text-xl font-bold text-violet-900">
                {Array.isArray(alerts?.inboxSemResponsavel) ? alerts.inboxSemResponsavel.length : 0}
              </p>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
              <p className="text-[11px] font-semibold uppercase text-violet-900">Inbox sem resposta (+1h)</p>
              <p className="text-xl font-bold text-violet-900">
                {Array.isArray(alerts?.inboxSemRespostaHaMaisDe1h) ? alerts.inboxSemRespostaHaMaisDe1h.length : 0}
              </p>
            </div>
          </div>

          {ax?.bottlenecks?.length > 0 && (
            <div className="rounded-lg border border-amber-300/60 bg-amber-50/30 p-4">
              <p className="text-[11px] font-semibold uppercase text-amber-950 mb-2">Gargalos (tempo médio no estágio)</p>
              <ul className="flex flex-wrap gap-2 text-xs">
                {ax.bottlenecks.map((b) => (
                  <li key={b.stage} className="rounded-md border border-amber-200/80 bg-background/80 px-2 py-1">
                    <span className="font-medium">{b.stage}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="font-semibold">{fmtDays(b.avgDaysInStage)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ax?.sellerRanking?.length > 0 && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">Ranking vendedores (valor)</p>
              <ol className="list-decimal space-y-1 pl-4 text-sm">
                {ax.sellerRanking.slice(0, 8).map((s) => (
                  <li key={s.sellerKey} className="marker:font-semibold">
                    <span className="font-medium">{s.sellerLabel}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span>{fmtBrl(s.soldBrl)}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-xs">conv. {fmtPct(s.conversionPercent)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {anAlert && (anAlert.lowConversionStages?.length > 0 || anAlert.stalledCriticalOpportunities?.length > 0 || anAlert.underperformingSellers?.length > 0) && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-4">
              <p className="text-[11px] font-semibold uppercase text-rose-950 mb-2">Alertas de performance</p>
              <ul className="space-y-2 text-xs text-rose-950">
                {anAlert.lowConversionStages?.length > 0 && (
                  <li>
                    <span className="font-semibold">Baixa conversão para o próximo estágio: </span>
                    {anAlert.lowConversionStages.map((x) => `${x.stage} (${fmtPct(x.conversionPercent)})`).join(', ')}
                  </li>
                )}
                {anAlert.stalledCriticalOpportunities?.length > 0 && (
                  <li>
                    <span className="font-semibold">Paradas em etapa crítica (+7d): </span>
                    {anAlert.stalledCriticalOpportunities.length} oportunidade(s)
                  </li>
                )}
                {anAlert.underperformingSellers?.length > 0 && (
                  <li>
                    <span className="font-semibold">Vendedores com baixa conversão: </span>
                    {anAlert.underperformingSellers.map((s) => s.sellerLabel).join(', ')}
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-border p-4">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-3">Oportunidades por estágio</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(totals).map(([k, v]) => {
                const vs = data?.valueByStage?.[k];
                return (
                  <span
                    key={k}
                    className="inline-flex flex-col gap-0.5 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs"
                  >
                    <span className="font-medium">{k}</span>
                    <span>
                      <span className="font-bold text-primary">{v}</span>
                      <span className="text-muted-foreground"> · </span>
                      <span className="font-semibold text-foreground">{fmtBrl(vs?.sumBrl)}</span>
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">
              Atividades de hoje ({Array.isArray(data?.activitiesToday) ? data.activitiesToday.length : 0})
            </p>
            {!Array.isArray(data?.activitiesToday) || data.activitiesToday.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma atividade com data/hora para o dia atual.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {data.activitiesToday.map((a) => (
                  <li
                    key={a.id}
                    className={`flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0 ${
                      a.overdue ? 'text-destructive' : ''
                    }`}
                  >
                    <span className="font-medium">{a.titulo}</span>
                    <span className="text-muted-foreground">
                      {a.tipo}
                      {a.dueIso ? ` · ${new Date(a.dueIso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : ''}
                      {a.overdue ? ' · atrasada' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
