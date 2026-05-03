import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';
import {
  CLOSED_OPPORTUNITY_STAGES,
  CRM_OPPORTUNITY_STAGES,
  normalizeOpportunityStage,
  nextStageInCrmPipeline,
} from './crm-constants.js';
import type { OpportunityStageChangedPayload } from './crm-events.js';

const OPP_CODE = 'crm_oportunidade';
const LEAD_CODE = 'crm_lead';

function parseData(data: Prisma.JsonValue): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  return {};
}

function logAnalytics(msg: string, extra?: Record<string, unknown>) {
  if (process.env.CRM_ANALYTICS_LOG !== '1') return;
  // eslint-disable-next-line no-console
  console.info('[crm-analytics]', msg, extra ?? '');
}

async function entityIdByCode(code: string) {
  const e = await prisma.entity.findUnique({ where: { code } });
  if (!e) throw new Error(`Entidade ${code} não configurada.`);
  return e.id;
}

export type CrmAnalyticsFilters = {
  from: Date;
  to: Date;
  vendedorId?: string;
  origem?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CrmStageHistoryRow = {
  oportunidadeId: string;
  stageFrom: string;
  stageTo: string;
  createdAt: Date;
};

/** Tabela `crm_stage_history` (client Prisma pode estar desatualizado no dev). */
function crmStageHistory() {
  return (prisma as unknown as {
    crmStageHistory: {
      create(args: {
        data: {
          oportunidadeId: string;
          stageFrom: string;
          stageTo: string;
          usuarioId: string | null;
        };
      }): Promise<unknown>;
      findMany(args: Record<string, unknown>): Promise<CrmStageHistoryRow[]>;
    };
  }).crmStageHistory;
}

export function parseCrmAnalyticsQuery(q: Record<string, unknown>): CrmAnalyticsFilters {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 90);
  defaultFrom.setHours(0, 0, 0, 0);

  const rawFrom = String(q.from ?? q.de ?? '').trim();
  const rawTo = String(q.to ?? q.ate ?? '').trim();
  const from = rawFrom ? new Date(rawFrom) : defaultFrom;
  const to = rawTo ? new Date(rawTo) : now;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error('CRM analytics: parâmetros from/to inválidos (use ISO 8601).');
  }
  const vendedorId = String(q.vendedorId ?? q.responsavelId ?? '').trim();
  const origem = String(q.origem ?? '').trim();
  return {
    from,
    to,
    vendedorId: UUID_RE.test(vendedorId) ? vendedorId : undefined,
    origem: origem.length ? origem : undefined,
  };
}

function oppAmount(d: Record<string, unknown>): number {
  const v = Number(d.valor ?? d.value ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function responsavelKey(d: Record<string, unknown>): string {
  const id = String(d.responsavelId ?? d.responsavel_id ?? '').trim();
  if (UUID_RE.test(id)) return `id:${id}`;
  const leg = String(d.responsavel ?? '').trim();
  return leg ? `name:${leg}` : '—';
}

function matchesOrigem(
  oppData: Record<string, unknown>,
  leadById: Map<string, Record<string, unknown>>,
  origem?: string,
): boolean {
  if (!origem) return true;
  const needle = origem.toLowerCase();
  const direct = String(oppData.origem ?? '').trim().toLowerCase();
  if (direct && direct.includes(needle)) return true;
  const lid = String(oppData.lead_id ?? oppData.leadId ?? '').trim();
  if (lid && UUID_RE.test(lid)) {
    const lead = leadById.get(lid);
    if (lead) {
      const lo = String(lead.origem ?? '').trim().toLowerCase();
      if (lo && lo.includes(needle)) return true;
    }
  }
  return false;
}

function matchesVendedor(d: Record<string, unknown>, vendedorId?: string): boolean {
  if (!vendedorId) return true;
  const id = String(d.responsavelId ?? d.responsavel_id ?? '').trim();
  return id === vendedorId;
}

function recordInWindow(
  createdAt: Date,
  updatedAt: Date,
  f: CrmAnalyticsFilters,
): boolean {
  return createdAt <= f.to && updatedAt >= f.from;
}

async function loadLeadsMap(): Promise<Map<string, Record<string, unknown>>> {
  const eid = await entityIdByCode(LEAD_CODE);
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: eid, deletedAt: null },
    select: { id: true, data: true },
    take: 5000,
  });
  const m = new Map<string, Record<string, unknown>>();
  for (const r of rows) m.set(r.id, parseData(r.data));
  return m;
}

async function loadOpportunityRows(f: CrmAnalyticsFilters) {
  const eid = await entityIdByCode(OPP_CODE);
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: eid, deletedAt: null },
    select: { id: true, data: true, createdAt: true, updatedAt: true },
    take: 5000,
  });
  const leadById = await loadLeadsMap();
  return rows.filter((r) => {
    if (!recordInWindow(r.createdAt, r.updatedAt, f)) return false;
    const d = parseData(r.data);
    if (!matchesVendedor(d, f.vendedorId)) return false;
    if (!matchesOrigem(d, leadById, f.origem)) return false;
    return true;
  });
}

/** Persistido no evento `opportunity.stage.changed`. */
export async function recordOpportunityStageChange(payload: OpportunityStageChangedPayload): Promise<void> {
  try {
    await crmStageHistory().create({
      data: {
        oportunidadeId: payload.recordId,
        stageFrom: payload.from,
        stageTo: payload.to,
        usuarioId: payload.userId && UUID_RE.test(payload.userId) ? payload.userId : null,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[crm-analytics] crm_stage_history insert failed', e);
  }
}

async function hasLinkedOrcamentoQuick(opportunityId: string, d: Record<string, unknown>): Promise<boolean> {
  const oidField = String(d.orcamento_id ?? d.orcamentoId ?? '').trim();
  if (UUID_RE.test(oidField)) return true;
  const ent = await prisma.entity.findUnique({ where: { code: 'orcamento' } });
  if (!ent) return false;
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: ent.id, deletedAt: null },
    select: { data: true },
    take: 800,
  });
  for (const r of rows) {
    const od = parseData(r.data);
    const o = String(od.oportunidade_id ?? od.opportunityId ?? '').trim();
    if (o === opportunityId) return true;
  }
  return false;
}

export async function getConversionAnalytics(f: CrmAnalyticsFilters) {
  const rows = await loadOpportunityRows(f);
  const leadEid = await entityIdByCode(LEAD_CODE);
  const leadRows = await prisma.entityRecord.findMany({
    where: { entityId: leadEid, deletedAt: null },
    select: { id: true, data: true, createdAt: true, updatedAt: true },
    take: 5000,
  });
  const leadsInWindow = leadRows.filter((r) => recordInWindow(r.createdAt, r.updatedAt, f));
  let leadsDenom = 0;
  for (const r of leadsInWindow) {
    const ld = parseData(r.data);
    if (f.origem) {
      const lo = String(ld.origem ?? '').toLowerCase();
      if (!lo.includes(f.origem.toLowerCase())) continue;
    }
    if (f.vendedorId) {
      const id = String(ld.responsavelId ?? ld.responsavel_id ?? '').trim();
      if (id !== f.vendedorId) continue;
    }
    leadsDenom += 1;
  }

  let withLead = 0;
  let withQuote = 0;
  let wonFromQuote = 0;
  for (const r of rows) {
    const d = parseData(r.data);
    const lid = String(d.lead_id ?? d.leadId ?? '').trim();
    if (lid && UUID_RE.test(lid)) withLead += 1;
    const st = normalizeOpportunityStage(String(d.estagio ?? d.stage ?? ''));
    // eslint-disable-next-line no-await-in-loop
    const hq = await hasLinkedOrcamentoQuick(r.id, d);
    if (hq) withQuote += 1;
    if (hq && st === 'Fechado ganho') wonFromQuote += 1;
  }

  const totalOpps = rows.length;
  const pct = (num: number, den: number) => (den > 0 ? Math.round((10000 * num) / den) / 100 : null);

  const leadToOpportunity = {
    numerator: withLead,
    denominator: leadsDenom,
    percent: pct(withLead, leadsDenom),
  };
  const opportunityToQuote = {
    numerator: withQuote,
    denominator: totalOpps,
    percent: pct(withQuote, totalOpps),
  };
  const quoteToSale = {
    numerator: wonFromQuote,
    denominator: withQuote,
    percent: pct(wonFromQuote, withQuote),
  };

  const meta = { filters: { from: f.from.toISOString(), to: f.to.toISOString(), vendedorId: f.vendedorId, origem: f.origem } };
  logAnalytics('conversion', meta);

  return {
    period: meta.filters,
    leadToOpportunity,
    opportunityToQuote,
    quoteToSale,
  };
}

export async function getLossReasonAnalytics(f: CrmAnalyticsFilters) {
  const rows = await loadOpportunityRows(f);
  const counts: Record<string, number> = {};
  let totalLost = 0;
  for (const r of rows) {
    const d = parseData(r.data);
    const st = normalizeOpportunityStage(String(d.estagio ?? d.stage ?? ''));
    if (st !== 'Fechado perdido') continue;
    totalLost += 1;
    const reason = String(d.motivo_perda ?? d.motivoPerda ?? '(sem motivo)').trim() || '(sem motivo)';
    counts[reason] = (counts[reason] || 0) + 1;
  }
  const breakdown = Object.entries(counts)
    .map(([reason, count]) => ({
      reason,
      count,
      percent: totalLost > 0 ? Math.round((10000 * count) / totalLost) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  logAnalytics('loss-reasons', { totalLost });

  return {
    period: { from: f.from.toISOString(), to: f.to.toISOString(), vendedorId: f.vendedorId, origem: f.origem },
    totalLost,
    breakdown,
  };
}

export async function getSalesPerformanceAnalytics(f: CrmAnalyticsFilters) {
  const rows = await loadOpportunityRows(f);
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, fullName: true },
    take: 500,
  });
  const idToName = new Map(users.map((u) => [u.id, u.fullName || u.id]));

  const hist = await crmStageHistory().findMany({
    where: { createdAt: { gte: f.from, lte: f.to } },
    select: { oportunidadeId: true, stageFrom: true, stageTo: true, createdAt: true },
    orderBy: [{ oportunidadeId: 'asc' }, { createdAt: 'asc' }],
    take: 20000,
  });
  const oppIds = new Set(rows.map((r) => r.id));
  const histByOpp = new Map<string, CrmStageHistoryRow[]>();
  for (const h of hist) {
    if (!oppIds.has(h.oportunidadeId)) continue;
    const list = histByOpp.get(h.oportunidadeId) ?? [];
    list.push(h);
    histByOpp.set(h.oportunidadeId, list);
  }

  type Agg = {
    key: string;
    label: string;
    opportunities: number;
    closedWon: number;
    soldBrl: number;
    closeMsSamples: number[];
  };
  const bySeller = new Map<string, Agg>();

  function bump(key: string, label: string) {
    let a = bySeller.get(key);
    if (!a) {
      a = { key, label, opportunities: 0, closedWon: 0, soldBrl: 0, closeMsSamples: [] };
      bySeller.set(key, a);
    }
    return a;
  }

  for (const r of rows) {
    const d = parseData(r.data);
    const key = responsavelKey(d);
    const id = String(d.responsavelId ?? d.responsavel_id ?? '').trim();
    const label = UUID_RE.test(id) ? idToName.get(id) || id : String(d.responsavel ?? '—');
    const a = bump(key, label);
    a.opportunities += 1;
    const st = normalizeOpportunityStage(String(d.estagio ?? d.stage ?? ''));
    if (st === 'Fechado ganho') {
      a.closedWon += 1;
      a.soldBrl += oppAmount(d);
      const list = histByOpp.get(r.id) ?? [];
      const win = list.find((h: CrmStageHistoryRow) => h.stageTo === 'Fechado ganho');
      if (win) {
        const ms = win.createdAt.getTime() - r.createdAt.getTime();
        if (ms >= 0) a.closeMsSamples.push(ms);
      }
    }
  }

  const sellers = [...bySeller.values()].map((a) => {
    const rate = a.opportunities > 0 ? Math.round((10000 * a.closedWon) / a.opportunities) / 100 : 0;
    const avgMs =
      a.closeMsSamples.length > 0
        ? a.closeMsSamples.reduce((s, x) => s + x, 0) / a.closeMsSamples.length
        : null;
    return {
      sellerKey: a.key,
      sellerLabel: a.label,
      opportunities: a.opportunities,
      closedWon: a.closedWon,
      conversionPercent: rate,
      soldBrl: Math.round(a.soldBrl * 100) / 100,
      avgCloseDays: avgMs !== null ? Math.round((avgMs / 86400000) * 100) / 100 : null,
    };
  });
  sellers.sort((x, y) => y.soldBrl - x.soldBrl);

  logAnalytics('sales-performance', { sellers: sellers.length });

  return {
    period: { from: f.from.toISOString(), to: f.to.toISOString(), vendedorId: f.vendedorId, origem: f.origem },
    sellers,
  };
}

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Duração atribuída ao estágio `stageFrom` (ms) entre transições consecutivas. */
export function computeStageDwellFromHistory(
  rows: Array<{ id: string; createdAt: Date }>,
  history: Array<{ oportunidadeId: string; stageFrom: string; stageTo: string; createdAt: Date }>,
): { avgMsByStage: Record<string, number | null>; samplesByStage: Record<string, number> } {
  const created = new Map(rows.map((r) => [r.id, r.createdAt]));
  const byOpp = new Map<string, typeof history>();
  for (const h of history) {
    const list = byOpp.get(h.oportunidadeId) ?? [];
    list.push(h);
    byOpp.set(h.oportunidadeId, list);
  }
  const dwellByStage = new Map<string, number[]>();
  for (const [oppId, list] of byOpp) {
    const sorted = [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    let prevT = created.get(oppId)?.getTime();
    if (prevT === undefined) continue;
    for (const h of sorted) {
      const t = h.createdAt.getTime();
      const dt = t - prevT;
      if (dt >= 0 && dt < 365 * 86400000 * 5) {
        const from = normalizeOpportunityStage(h.stageFrom);
        const arr = dwellByStage.get(from) ?? [];
        arr.push(dt);
        dwellByStage.set(from, arr);
      }
      prevT = t;
    }
  }
  const avgMsByStage: Record<string, number | null> = {};
  const samplesByStage: Record<string, number> = {};
  for (const s of CRM_OPPORTUNITY_STAGES) {
    const arr = dwellByStage.get(s) ?? [];
    samplesByStage[s] = arr.length;
    const m = mean(arr);
    avgMsByStage[s] = m === null ? null : m;
  }
  return { avgMsByStage, samplesByStage };
}

function computeStageForwardRates(
  history: Array<{ oportunidadeId: string; stageFrom: string; stageTo: string }>,
): Record<string, { reached: number; progressed: number; conversionPercent: number | null }> {
  const reachedSets = new Map<string, Set<string>>();
  const advancedSets = new Map<string, Set<string>>();
  for (const h of history) {
    const opp = h.oportunidadeId;
    const to = normalizeOpportunityStage(h.stageTo);
    const from = normalizeOpportunityStage(h.stageFrom);
    if (!reachedSets.has(to)) reachedSets.set(to, new Set());
    reachedSets.get(to)!.add(opp);
    const expectedNext = nextStageInCrmPipeline(from);
    if (expectedNext && to === expectedNext) {
      if (!advancedSets.has(from)) advancedSets.set(from, new Set());
      advancedSets.get(from)!.add(opp);
    }
  }
  const out: Record<string, { reached: number; progressed: number; conversionPercent: number | null }> = {};
  for (const s of CRM_OPPORTUNITY_STAGES) {
    const next = nextStageInCrmPipeline(s);
    const reached = reachedSets.get(s)?.size ?? 0;
    const progressed = next ? (advancedSets.get(s)?.size ?? 0) : 0;
    const conversionPercent =
      next && reached > 0 ? Math.round((10000 * progressed) / reached) / 100 : null;
    out[s] = { reached, progressed, conversionPercent };
  }
  return out;
}

export async function enrichPipelineWithAnalytics(
  base: {
    stages: readonly string[];
    columns: Record<string, unknown[]>;
    columnTotals: Record<string, number>;
    raw: Array<{ id: string; data: Prisma.JsonValue; createdAt?: Date }>;
  },
  query?: Record<string, unknown>,
) {
  let f: CrmAnalyticsFilters;
  try {
    f = parseCrmAnalyticsQuery(query ?? {});
  } catch {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 90);
    f = { from, to: now };
  }

  const oppIds = base.raw.map((r) => r.id);
  const history =
    oppIds.length === 0
      ? []
      : await crmStageHistory().findMany({
          where: {
            oportunidadeId: { in: oppIds },
            createdAt: { gte: f.from, lte: f.to },
          },
          select: { oportunidadeId: true, stageFrom: true, stageTo: true, createdAt: true },
          orderBy: [{ oportunidadeId: 'asc' }, { createdAt: 'asc' }],
          take: 25000,
        });

  const rowsWithCreated = base.raw.map((r) => ({
    id: r.id,
    createdAt: r.createdAt ?? new Date(0),
  }));
  const { avgMsByStage, samplesByStage } = computeStageDwellFromHistory(rowsWithCreated, history);
  const forward = computeStageForwardRates(history);

  const stageAnalytics: Record<
    string,
    {
      avgDaysInStage: number | null;
      sampleCount: number;
      conversionToNextPercent: number | null;
      reachedStage: number;
      leftStageForward: number;
    }
  > = {};
  for (const s of base.stages) {
    const ms = avgMsByStage[s];
    const fr = forward[s] ?? { reached: 0, progressed: 0, conversionPercent: null };
    stageAnalytics[s] = {
      avgDaysInStage: ms === null ? null : Math.round((ms / 86400000) * 100) / 100,
      sampleCount: samplesByStage[s] ?? 0,
      conversionToNextPercent: fr.conversionPercent,
      reachedStage: fr.reached,
      leftStageForward: fr.progressed,
    };
  }

  logAnalytics('pipeline-enrich', { opps: oppIds.length, hist: history.length });

  return {
    ...base,
    analyticsPeriod: { from: f.from.toISOString(), to: f.to.toISOString() },
    stageAnalytics,
  };
}

export async function buildCrmAnalyticsSummary(f: CrmAnalyticsFilters) {
  const [conversion, loss, performance, pipelineBase] = await Promise.all([
    getConversionAnalytics(f),
    getLossReasonAnalytics(f),
    getSalesPerformanceAnalytics(f),
    (async () => {
      const eid = await entityIdByCode(OPP_CODE);
      const raw = await prisma.entityRecord.findMany({
        where: { entityId: eid, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 500,
        select: { id: true, data: true, createdAt: true, updatedAt: true },
      });
      const stages = [...CRM_OPPORTUNITY_STAGES];
      const byStage: Record<string, typeof raw> = {};
      for (const s of stages) byStage[s] = [];
      for (const r of raw) {
        const d = parseData(r.data);
        const stage = normalizeOpportunityStage(String(d.estagio || d.stage || 'Novo'));
        const bucket = byStage[stage] ? stage : 'Novo';
        if (!byStage[bucket]) byStage[bucket] = [];
        byStage[bucket].push(r);
      }
      const columnTotals: Record<string, number> = {};
      for (const s of stages) {
        const list = byStage[s] || [];
        columnTotals[s] = list.reduce((acc, r) => acc + oppAmount(parseData(r.data)), 0);
      }
      return { stages, columns: byStage, columnTotals, raw };
    })(),
  ]);

  const enriched = await enrichPipelineWithAnalytics(
    {
      stages: pipelineBase.stages,
      columns: pipelineBase.columns,
      columnTotals: pipelineBase.columnTotals,
      raw: pipelineBase.raw,
    },
    { from: f.from.toISOString(), to: f.to.toISOString(), vendedorId: f.vendedorId, origem: f.origem },
  );

  const sa = enriched.stageAnalytics;
  const bottlenecks = Object.entries(sa)
    .filter(([, v]) => v.avgDaysInStage !== null && v.sampleCount >= 1)
    .map(([stage, v]) => ({ stage, avgDaysInStage: v.avgDaysInStage as number }))
    .sort((a, b) => b.avgDaysInStage - a.avgDaysInStage)
    .slice(0, 5);

  const closeSamples = performance.sellers.flatMap((s) =>
    s.avgCloseDays != null ? [s.avgCloseDays] : [],
  );
  const avgSaleDaysGlobal = mean(closeSamples);

  const underperformingSellersSnapshot = performance.sellers.filter(
    (s) => s.opportunities >= 3 && s.conversionPercent < 15 && s.closedWon === 0,
  );

  return {
    filters: { from: f.from.toISOString(), to: f.to.toISOString(), vendedorId: f.vendedorId, origem: f.origem },
    conversion,
    lossReasons: loss,
    salesPerformance: performance,
    pipelineStageAnalytics: enriched.stageAnalytics,
    bottlenecks,
    avgSaleDays:
      avgSaleDaysGlobal !== null && !Number.isNaN(avgSaleDaysGlobal)
        ? Math.round(avgSaleDaysGlobal * 100) / 100
        : null,
    sellerRanking: performance.sellers.slice(0, 10),
    underperformingSellersSnapshot,
  };
}

// Fix: Object.entries doesn't work on Record typed stageAnalytics - bottlenecks used sa directly
// I had a typo `enriched.stageAnalytics.entries` - remove that dead code

export async function getCrmAnalyticsAlerts(f: CrmAnalyticsFilters) {
  const summary = await buildCrmAnalyticsSummary(f);
  const lowConversionStages: { stage: string; conversionPercent: number | null }[] = [];
  for (const [stage, v] of Object.entries(summary.pipelineStageAnalytics)) {
    if (v.conversionToNextPercent !== null && v.reachedStage >= 3 && v.conversionToNextPercent < 25) {
      lowConversionStages.push({ stage, conversionPercent: v.conversionToNextPercent });
    }
  }
  const critical = ['Negociação', 'Proposta enviada', 'Em orçamento'];
  const now = Date.now();
  const stalledCritical: { id: string; stage: string; daysSinceUpdate: number }[] = [];
  const rows = await loadOpportunityRows(f);
  for (const r of rows) {
    const d = parseData(r.data);
    const st = normalizeOpportunityStage(String(d.estagio ?? d.stage ?? ''));
    if (CLOSED_OPPORTUNITY_STAGES.has(st)) continue;
    if (!critical.includes(st)) continue;
    const days = (now - r.updatedAt.getTime()) / 86400000;
    if (days >= 7) stalledCritical.push({ id: r.id, stage: st, daysSinceUpdate: Math.round(days * 10) / 10 });
  }
  stalledCritical.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  return {
    lowConversionStages,
    stalledCriticalOpportunities: stalledCritical.slice(0, 20),
    underperformingSellers: summary.underperformingSellersSnapshot ?? [],
  };
}
