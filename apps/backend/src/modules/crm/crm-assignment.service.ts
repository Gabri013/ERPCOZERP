import { prisma } from '../../infra/prisma.js';

const ROLE_VENDEDOR = 'orcamentista_vendas';
const ROLE_TECNICO = 'projetista';

/** Detecta tipo de projeto no lead (campos opcionais no metadata). */
export function detectLeadProductKind(data: Record<string, unknown>): 'sob_medida' | 'padrao' | null {
  const raw = String(
    data.tipo_projeto ?? data.tipo_produto ?? data.tipo ?? data.produto_tipo ?? '',
  ).toLowerCase();
  if (!raw.trim()) return null;
  if (raw.includes('sob') && raw.includes('med')) return 'sob_medida';
  if (raw.includes('padr') || raw.includes('catalogo') || raw.includes('catálogo')) return 'padrao';
  if (raw === 'sob medida' || raw === 'sob_medida') return 'sob_medida';
  return null;
}

async function listActiveUserIdsForRoles(roleCodes: string[]): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: {
      active: true,
      roles: { some: { role: { code: { in: roleCodes }, active: true } } },
    },
    select: { id: true },
    orderBy: { email: 'asc' },
  });
  return rows.map((r) => r.id);
}

/** Regras em EntityRecord `crm_rules` (tipo assignment, config JSON). */
async function roundRobinUserIdsFromRules(): Promise<string[] | null> {
  const ent = await prisma.entity.findUnique({ where: { code: 'crm_rules' } });
  if (!ent) return null;
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: ent.id, deletedAt: null },
    take: 50,
    orderBy: { updatedAt: 'desc' },
  });
  for (const r of rows) {
    const d = r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? (r.data as Record<string, unknown>) : {};
    const tipo = String(d.tipo ?? '');
    const cfg = d.config;
    if (tipo !== 'assignment' || !cfg || typeof cfg !== 'object' || Array.isArray(cfg)) continue;
    const c = cfg as Record<string, unknown>;
    if (String(c.type ?? '') !== 'round_robin') continue;
    const usuarios = c.usuarios;
    if (!Array.isArray(usuarios)) continue;
    const ids = usuarios.filter((u): u is string => typeof u === 'string' && u.length > 0);
    if (ids.length > 0) return ids;
  }
  return null;
}

async function eligiblePoolForLead(data: Record<string, unknown>): Promise<string[]> {
  const fromRules = await roundRobinUserIdsFromRules();
  if (fromRules?.length) return fromRules;

  const kind = detectLeadProductKind(data);
  if (kind === 'sob_medida') {
    const tech = await listActiveUserIdsForRoles([ROLE_TECNICO]);
    if (tech.length) return tech;
  }
  if (kind === 'padrao') {
    const sellers = await listActiveUserIdsForRoles([ROLE_VENDEDOR]);
    if (sellers.length) return sellers;
  }

  const sellers = await listActiveUserIdsForRoles([ROLE_VENDEDOR]);
  if (sellers.length) return sellers;
  const tech = await listActiveUserIdsForRoles([ROLE_TECNICO]);
  return tech;
}

async function pickRoundRobin(pool: string[], entityCode: string): Promise<string | null> {
  if (pool.length === 0) return null;
  const last = await prisma.crmAssignmentLog.findFirst({
    where: {
      entityCode,
      reason: { in: ['lead_round_robin', 'lead_auto_assigned', 'lead_sob_medida'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { novoResponsavel: true },
  });
  if (!last?.novoResponsavel) return pool[0];
  const idx = pool.indexOf(last.novoResponsavel);
  if (idx < 0) return pool[0];
  return pool[(idx + 1) % pool.length];
}

/**
 * Preenche `responsavelId` quando vazio (antes da validação CRM).
 * Round-robin por pool (regras CRM → tipo projeto → papéis).
 */
export async function assignLeadResponsavelIfEmpty(merged: Record<string, unknown>): Promise<void> {
  const existing = String(merged.responsavelId ?? merged.responsavel_id ?? '').trim();
  if (existing.length > 0) return;

  const pool = await eligiblePoolForLead(merged);
  const chosen = await pickRoundRobin(pool, 'crm_lead');
  if (!chosen) return;

  merged.responsavelId = chosen;
  const kind = detectLeadProductKind(merged);
  (merged as Record<string, unknown> & { _crmAutoAssignMeta?: { reason: string } })._crmAutoAssignMeta = {
    reason:
      kind === 'sob_medida'
        ? 'lead_sob_medida'
        : kind === 'padrao'
          ? 'lead_padrao'
          : 'lead_round_robin',
  };
}

export async function logCrmAssignment(params: {
  entityCode: string;
  entityRecordId: string;
  antigoResponsavel: string | null;
  novoResponsavel: string;
  reason?: string | null;
}) {
  return prisma.crmAssignmentLog.create({
    data: {
      entityCode: params.entityCode,
      entityRecordId: params.entityRecordId,
      antigoResponsavel: params.antigoResponsavel ?? undefined,
      novoResponsavel: params.novoResponsavel,
      reason: params.reason ?? undefined,
    },
  });
}
