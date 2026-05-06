import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';
import {
  CRM_OPPORTUNITY_STAGES,
  CLOSED_OPPORTUNITY_STAGES,
  normalizeOpportunityStage,
} from './crm-constants.js';
import { appendCrmLog } from './crm-log.service.js';
import { emitOpportunityStageChanged, emitOpportunityUpdated } from './crm-events.js';
import { opportunityHasFuturePendingActivity } from './crm-opportunity-activity.js';
import {
  hasResponsibleUser,
  validateCrmOpportunityWrite,
} from './crm-record-validation.js';
import {
  buildCrmAnalyticsSummary,
  enrichPipelineWithAnalytics,
  getCrmAnalyticsAlerts,
  getConversionAnalytics,
  getLossReasonAnalytics,
  getSalesPerformanceAnalytics,
  parseCrmAnalyticsQuery,
} from './crm-analytics.service.js';

export const ENT = {
  lead: 'crm_lead',
  oportunidade: 'crm_oportunidade',
  atividade: 'crm_atividade',
} as const;

export async function entityId(ctx: TenantContext, code: string) {
  const companyId = ctx.companyId;
  const e = await prisma.entity.findFirst({
    where: {
      code,
      companyId,
    },
  });
  if (!e) throw new Error(`Entidade ${code} não configurada. Rode o seed.`);
  return e.id;
}

export function parseData(data: Prisma.JsonValue): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  return {};
}

type TenantContext = { companyId: string };

function opportunityAmount(d: Record<string, unknown>): number {
  const v = Number(d.valor ?? d.value ?? 0);
  return Number.isFinite(v) ? v : 0;
}

export async function getPipeline(ctx: TenantContext, query?: Record<string, unknown>) {
  const companyId = ctx.companyId;
  const eid = await entityId(ctx, ENT.oportunidade);
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: eid, deletedAt: null, companyId },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });
  const stages = [...CRM_OPPORTUNITY_STAGES];
  const byStage: Record<string, typeof rows> = {};
  for (const s of stages) byStage[s] = [];
  for (const r of rows) {
    const d = parseData(r.data);
    const stage = normalizeOpportunityStage(String(d.estagio || d.stage || 'Novo')) as typeof CRM_OPPORTUNITY_STAGES[number];
    const bucket = stages.includes(stage) ? stage : 'Novo';
    if (!byStage[bucket]) byStage[bucket] = [];
    byStage[bucket].push(r);
  }
  const columnTotals: Record<string, number> = {};
  for (const s of stages) {
    const list = byStage[s] || [];
    columnTotals[s] = list.reduce((acc, r) => acc + opportunityAmount(parseData(r.data)), 0);
  }
  const base = { stages, columns: byStage, columnTotals, raw: rows };
  return enrichPipelineWithAnalytics(base, query);
}

export async function moveOpportunity(
  ctx: TenantContext,
  recordId: string,
  newStage: string,
  userId?: string | null,
  roles?: string[],
) {
  const companyId = ctx.companyId;
  const eid = await entityId(ctx, ENT.oportunidade);
  const row = await prisma.entityRecord.findFirst({
    where: { id: recordId, entityId: eid, deletedAt: null, companyId },
  });
  if (!row) throw new Error('Oportunidade não encontrada');
  const d = parseData(row.data);
  const merged = { ...d, estagio: newStage, stage: newStage };
  await validateCrmOpportunityWrite({
    merged,
    recordId,
    roles: roles ?? [],
  });

  const updated = await prisma.entityRecord.updateMany({
    where: { id: recordId, companyId },
    data: {
      data: merged as Prisma.InputJsonValue,
      updatedAt: new Date(),
      updatedBy: userId ?? undefined,
    },
  });

  if (updated.count === 0) throw new Error('Not found');

  emitOpportunityUpdated({
    recordId,
    userId: userId ?? null,
    previous: d,
    next: merged,
  });

  const prevS = normalizeOpportunityStage(String(d.estagio ?? d.stage ?? ''));
  const nextS = normalizeOpportunityStage(String(merged.estagio ?? merged.stage ?? ''));
  if (prevS !== nextS) {
    emitOpportunityStageChanged({
      recordId,
      userId: userId ?? null,
      from: prevS,
      to: nextS,
      data: merged,
    });
  }

  await appendCrmLog({
    eventType: 'opportunity_stage_change',
    entityCode: ENT.oportunidade,
    entityRecordId: recordId,
    userId,
    payload: {
      from: String(d.estagio ?? d.stage ?? ''),
      to: String(merged.estagio ?? ''),
    },
  });

  return { count: updated.count };
}

export async function listActivitiesToday(ctx: TenantContext) {
  const companyId = ctx.companyId;
  const eid = await entityId(ctx, ENT.atividade);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: eid, deletedAt: null, companyId },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  return rows.filter((r) => {
    const d = parseData(r.data);
    const when = d.data_atividade || d.data || d.due;
    if (!when) return false;
    const t = new Date(String(when));
    return !Number.isNaN(t.getTime()) && t >= start && t <= end;
  });
}

function activityDueFromRowData(d: Record<string, unknown>): Date | null {
  const raw = d.data_atividade ?? d.data ?? d.due;
  if (raw === undefined || raw === null) return null;
  const t = new Date(String(raw));
  return Number.isNaN(t.getTime()) ? null : t;
}

function isActivityOpen(d: Record<string, unknown>): boolean {
  const st = String(d.status || '').toLowerCase();
  return !st.includes('cancel') && !st.includes('conclu');
}

export function summarizeActivitiesForDashboard(
  rows: Array<{ id: string; data: Prisma.JsonValue }>,
) {
  const now = new Date();
  return rows.map((r) => {
    const d = parseData(r.data);
    const due = activityDueFromRowData(d);
    const overdue = Boolean(due && isActivityOpen(d) && due < now);
    return {
      id: r.id,
      titulo: String(d.titulo || d.title || '—'),
      tipo: String(d.tipo || 'Tarefa'),
      dueIso: due ? due.toISOString() : null,
      status: String(d.status || ''),
      oportunidadeId: String(d.oportunidade_id || d.oportunidadeId || '').trim() || null,
      overdue,
    };
  });
}

async function listOpenOpportunitiesRowsTenant(ctx: TenantContext) {
  const companyId = ctx.companyId;
  const eid = await entityId(ctx, ENT.oportunidade);
  return prisma.entityRecord.findMany({
    where: { entityId: eid, deletedAt: null, companyId },
    select: { id: true, data: true, updatedAt: true },
  });
}

export async function getCrmDashboard(ctx: TenantContext, analyticsQuery?: Record<string, unknown>) {
  const companyId = ctx.companyId;
  const [leadEid, oppEid, actEid] = await Promise.all([
    entityId(ctx, ENT.lead),
    entityId(ctx, ENT.oportunidade),
    entityId(ctx, ENT.atividade),
  ]);

  const [leadCount, oppCount, actCount, oppRows, leadRows] = await Promise.all([
    prisma.entityRecord.count({ where: { entityId: leadEid, deletedAt: null, companyId } }),
    prisma.entityRecord.count({ where: { entityId: oppEid, deletedAt: null, companyId } }),
    prisma.entityRecord.count({ where: { entityId: actEid, deletedAt: null, companyId } }),
    listOpenOpportunitiesRowsTenant(ctx),
    prisma.entityRecord.findMany({
      where: { entityId: leadEid, deletedAt: null, companyId },
      select: { id: true, data: true, updatedAt: true },
    }),
  ]);

  const totalsByStage: Record<string, number> = Object.fromEntries(
    CRM_OPPORTUNITY_STAGES.map((s) => [s, 0]),
  ) as Record<string, number>;
  const valueByStage: Record<string, { count: number; sumBrl: number }> = Object.fromEntries(
    CRM_OPPORTUNITY_STAGES.map((s) => [s, { count: 0, sumBrl: 0 }]),
  ) as Record<string, { count: number; sumBrl: number }>;
  let pipelineOpenTotalBrl = 0;

  for (const r of oppRows) {
    const d = parseData(r.data);
    const stage = normalizeOpportunityStage(String(d.estagio || d.stage || '')) as typeof CRM_OPPORTUNITY_STAGES[number];
    const v = opportunityAmount(d);
    const bucket = CRM_OPPORTUNITY_STAGES.includes(stage) ? stage : 'Novo';
    totalsByStage[bucket] += 1;
    valueByStage[bucket].count += 1;
    valueByStage[bucket].sumBrl += v;
    if (!CLOSED_OPPORTUNITY_STAGES.has(stage)) pipelineOpenTotalBrl += v;
  }

  const activitiesToday = summarizeActivitiesForDashboard(await listActivitiesToday(ctx));

  const opportunitiesWithoutFutureActivity: { id: string; titulo: string; estagio: string }[] = [];
  const opportunitiesStalled: { id: string; titulo: string; estagio: string; updatedAt: string }[] = [];
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  for (const r of oppRows) {
    const d = parseData(r.data);
    const stage = normalizeOpportunityStage(String(d.estagio || d.stage || ''));
    const titulo = String(d.titulo || d.title || '—');
    if (CLOSED_OPPORTUNITY_STAGES.has(stage)) continue;
    if (stage !== 'Novo') {
      const has = await opportunityHasFuturePendingActivity(r.id, ctx);
      if (!has) opportunitiesWithoutFutureActivity.push({ id: r.id, titulo, estagio: stage });
    }
    if (r.updatedAt < threeDaysAgo && !CLOSED_OPPORTUNITY_STAGES.has(stage)) {
      opportunitiesStalled.push({
        id: r.id,
        titulo,
        estagio: stage,
        updatedAt: r.updatedAt.toISOString(),
      });
    }
  }

  const leadsWithoutResponsible: { id: string; nome: string }[] = [];
  const leadsStale: { id: string; nome: string; updatedAt: string }[] = [];
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  for (const r of leadRows) {
    const d = parseData(r.data);
    const nome = String(d.nome || '—');
    if (!hasResponsibleUser(d)) {
      leadsWithoutResponsible.push({ id: r.id, nome });
    }
    if (r.updatedAt < twoDaysAgo) {
      leadsStale.push({ id: r.id, nome, updatedAt: r.updatedAt.toISOString() });
    }
  }

  let analytics: Awaited<ReturnType<typeof buildCrmAnalyticsSummary>> | null = null;
  try {
    const f = parseCrmAnalyticsQuery(analyticsQuery ?? {});
    analytics = await buildCrmAnalyticsSummary(f);
  } catch {
    analytics = null;
  }

  return {
    counts: { leads: leadCount, opportunities: oppCount, activities: actCount },
    pipelineSummary: totalsByStage,
    totalsByStage,
    pipelineOpenTotalBrl,
    valueByStage,
    activitiesToday,
    opportunitiesWithoutFutureActivity,
    opportunitiesStalled,
    leadsWithoutResponsible,
    leadsStale,
    analytics,
  };
}

export async function getCrmAlerts(ctx: TenantContext, analyticsQuery?: Record<string, unknown>) {
  const { getInboxAlerts } = await import('./crm-inbox.service.js');
  const [dash, inbox] = await Promise.all([getCrmDashboard(ctx, analyticsQuery), getInboxAlerts()]);
  let analyticsAlerts: Awaited<ReturnType<typeof getCrmAnalyticsAlerts>> | null = null;
  try {
    analyticsAlerts = await getCrmAnalyticsAlerts(parseCrmAnalyticsQuery(analyticsQuery ?? {}));
  } catch {
    analyticsAlerts = null;
  }
  return {
    opportunitiesWithoutFutureActivity: dash.opportunitiesWithoutFutureActivity,
    opportunitiesStalled: dash.opportunitiesStalled,
    leadsStale: dash.leadsStale,
    leadsWithoutResponsible: dash.leadsWithoutResponsible,
    inboxSemResponsavel: inbox.semResponsavel,
    inboxSemRespostaHaMaisDe1h: inbox.semRespostaHaMaisDe1h,
    analytics: analyticsAlerts,
  };
}

export async function getCrmAnalyticsConversion(query: Record<string, unknown>) {
  const f = parseCrmAnalyticsQuery(query);
  return getConversionAnalytics(f);
}

export async function getCrmAnalyticsLossReasons(query: Record<string, unknown>) {
  const f = parseCrmAnalyticsQuery(query);
  return getLossReasonAnalytics(f);
}

export async function getCrmAnalyticsSalesPerformance(query: Record<string, unknown>) {
  const f = parseCrmAnalyticsQuery(query);
  return getSalesPerformanceAnalytics(f);
}
