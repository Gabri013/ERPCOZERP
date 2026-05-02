import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

const ENT = {
  lead: 'crm_lead',
  oportunidade: 'crm_oportunidade',
  atividade: 'crm_atividade',
} as const;

async function entityId(code: string) {
  const e = await prisma.entity.findUnique({ where: { code } });
  if (!e) throw new Error(`Entidade ${code} não configurada. Rode o seed.`);
  return e.id;
}

function parseData(data: Prisma.JsonValue): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  return {};
}

export async function getPipeline() {
  const eid = await entityId(ENT.oportunidade);
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: eid, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });
  const stages = ['Lead', 'Qualificação', 'Proposta', 'Negociação', 'Fechado', 'Ganho', 'Perdido'];
  const byStage: Record<string, typeof rows> = {};
  for (const s of stages) byStage[s] = [];
  for (const r of rows) {
    const d = parseData(r.data);
    const stage = String(d.estagio || d.stage || 'Lead');
    const bucket = byStage[stage] ? stage : 'Lead';
    if (!byStage[bucket]) byStage[bucket] = [];
    byStage[bucket].push(r);
  }
  return { stages, columns: byStage, raw: rows };
}

export async function moveOpportunity(recordId: string, newStage: string) {
  const eid = await entityId(ENT.oportunidade);
  const row = await prisma.entityRecord.findFirst({ where: { id: recordId, entityId: eid, deletedAt: null } });
  if (!row) throw new Error('Oportunidade não encontrada');
  const d = parseData(row.data);
  d.estagio = newStage;
  d.stage = newStage;
  return prisma.entityRecord.update({
    where: { id: recordId },
    data: { data: d as Prisma.InputJsonValue, updatedAt: new Date() },
  });
}

export async function listActivitiesToday() {
  const eid = await entityId(ENT.atividade);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: eid, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  return rows.filter((r) => {
    const d = parseData(r.data);
    const when = d.data_atividade || d.data || d.due;
    if (!when) return true;
    const t = new Date(String(when));
    return t >= start && t <= end;
  });
}

export async function getCrmDashboard() {
  const [leads, opps, acts] = await Promise.all([
    prisma.entityRecord.count({ where: { entityId: await entityId(ENT.lead), deletedAt: null } }),
    prisma.entityRecord.count({ where: { entityId: await entityId(ENT.oportunidade), deletedAt: null } }),
    prisma.entityRecord.count({ where: { entityId: await entityId(ENT.atividade), deletedAt: null } }),
  ]);
  const pipeline = await getPipeline();
  return {
    counts: { leads, opportunities: opps, activities: acts },
    pipelineSummary: Object.fromEntries(Object.entries(pipeline.columns).map(([k, v]) => [k, v.length])),
  };
}
