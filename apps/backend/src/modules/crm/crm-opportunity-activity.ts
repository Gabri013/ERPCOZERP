import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

const ATIVIDADE = 'crm_atividade';

function parseData(data: Prisma.JsonValue): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  return {};
}

async function atividadeEntityId() {
  const e = await prisma.entity.findUnique({ where: { code: ATIVIDADE } });
  if (!e) throw new Error('Entidade crm_atividade não configurada');
  return e.id;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function activityDueDate(d: Record<string, unknown>): Date | null {
  const raw = d.data_atividade ?? d.data ?? d.due;
  if (raw === undefined || raw === null) return null;
  const t = new Date(String(raw));
  return Number.isNaN(t.getTime()) ? null : t;
}

function isActivityCompletedOrCancelled(d: Record<string, unknown>): boolean {
  const st = String(d.status || '').toLowerCase();
  return st.includes('cancel') || st.includes('conclu');
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TenantContext = { companyId: string };

/**
 * Atividade ainda aberta, com data de contacto entre (agora − withinDays) e agora (inclusive).
 * Usado para validar avanço p.ex. para "Negociação".
 */
export async function opportunityHasRecentTouchWithinDays(
  opportunityId: string,
  withinDays: number,
  ctx?: TenantContext,
): Promise<boolean> {
  const eid = await atividadeEntityId();
  const companyId = ctx?.companyId;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);
  cutoff.setHours(0, 0, 0, 0);
  const now = new Date();

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: eid, deletedAt: null, companyId },
    select: { data: true },
    take: 2000,
  });
  for (const r of rows) {
    const d = parseData(r.data);
    const oid = String(d.oportunidade_id || d.oportunidadeId || '').trim();
    if (oid !== opportunityId) continue;
    if (isActivityCompletedOrCancelled(d)) continue;
    const due = activityDueDate(d);
    if (!due) continue;
    if (due >= cutoff && due <= now) return true;
  }
  return false;
}

/** Campo `orcamento_id` na oportunidade ou registo `orcamento` com `oportunidade_id`. */
export async function opportunityHasLinkedOrcamento(
  opportunityId: string,
  merged?: Record<string, unknown>,
  ctx?: TenantContext,
): Promise<boolean> {
  const oidField = String(merged?.orcamento_id ?? merged?.orcamentoId ?? '').trim();
  if (UUID_RE.test(oidField)) return true;

  const ent = await prisma.entity.findUnique({ where: { code: 'orcamento' } });
  if (!ent) return false;
  const companyId = ctx?.companyId;
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: ent.id, deletedAt: null, ...(companyId ? { companyId } : {}) },
    select: { data: true },
    take: 800,
  });
  for (const r of rows) {
    const d = parseData(r.data);
    const o = String(d.oportunidade_id ?? d.opportunityId ?? '').trim();
    if (o === opportunityId) return true;
  }
  return false;
}

/** Atividade pendente com data >= hoje (00h local), vinculada à oportunidade. */
export async function opportunityHasFuturePendingActivity(
  opportunityId: string,
  ctx?: TenantContext,
): Promise<boolean> {
  const eid = await atividadeEntityId();
  const companyId = ctx?.companyId;
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: eid, deletedAt: null, companyId },
    select: { data: true },
  });
  const today = startOfToday();
  for (const r of rows) {
    const d = parseData(r.data);
    const oid = String(d.oportunidade_id || d.oportunidadeId || '').trim();
    if (oid !== opportunityId) continue;
    if (isActivityCompletedOrCancelled(d)) continue;
    const due = activityDueDate(d);
    if (!due) continue;
    if (due >= today) return true;
  }
  return false;
}
