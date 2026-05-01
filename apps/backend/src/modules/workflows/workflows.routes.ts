import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';

export const workflowsRouter = Router();

async function ensureWorkflowEntity() {
  return prisma.entity.upsert({
    where: { code: 'workflow' },
    update: {},
    create: { code: 'workflow', name: 'Workflows' },
  });
}

function normalizeStr(v: unknown) {
  return String(v || '').trim();
}

function toUi(r: any) {
  const data = (r?.data || {}) as any;
  return {
    id: r.id,
    entity_id: data.entity_id || '',
    code: data.code || '',
    name: data.name || '',
    description: data.description || '',
    is_active: data.is_active !== false,
    trigger_type: data.trigger_type || 'manual',
    config: data.config || { requireApproval: false },
    steps: Array.isArray(data.steps) ? data.steps : [],
  };
}

workflowsRouter.get('/', async (_req, res) => {
  const entity = await ensureWorkflowEntity();
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json({ success: true, data: rows.map((r) => toUi({ id: r.id, data: r.data })) });
});

workflowsRouter.post('/', async (req, res) => {
  const entity = await ensureWorkflowEntity();
  const data = (req.body?.data ?? req.body) as any;

  if (!normalizeStr(data?.entity_id)) return res.status(400).json({ error: 'entity_id é obrigatório' });
  if (!normalizeStr(data?.code)) return res.status(400).json({ error: 'code é obrigatório' });
  if (!normalizeStr(data?.name)) return res.status(400).json({ error: 'name é obrigatório' });

  const created = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      data: {
        ...data,
        steps: Array.isArray(data.steps) ? data.steps : [],
      } as Prisma.InputJsonValue,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    },
  });

  res.status(201).json({ success: true, data: toUi({ id: created.id, data: created.data }) });
});

workflowsRouter.put('/:id', async (req, res) => {
  const entity = await ensureWorkflowEntity();
  const { id } = req.params;
  const data = (req.body?.data ?? req.body) as any;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Workflow não encontrado' });

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: {
        ...(existing.data as any),
        ...data,
        steps: Array.isArray(data.steps) ? data.steps : (existing.data as any)?.steps || [],
      } as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  res.json({ success: true, data: toUi({ id: updated.id, data: updated.data }) });
});

workflowsRouter.delete('/:id', async (req, res) => {
  const entity = await ensureWorkflowEntity();
  const { id } = req.params;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Workflow não encontrado' });

  await prisma.entityRecord.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: req.user?.userId },
  });

  res.json({ success: true });
});

workflowsRouter.post('/:id/steps', async (req, res) => {
  const entity = await ensureWorkflowEntity();
  const { id } = req.params;
  const step = (req.body?.data ?? req.body) as any;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Workflow não encontrado' });

  const current = (existing.data as any) || {};
  const steps = Array.isArray(current.steps) ? current.steps : [];
  const nextSteps = [
    ...steps,
    {
      id: crypto.randomUUID(),
      code: normalizeStr(step.code),
      label: normalizeStr(step.label),
      description: normalizeStr(step.description),
      color: step.color || '#6B7280',
      sort_order: Number(step.sort_order || steps.length + 1),
      is_initial: Boolean(step.is_initial),
      is_final: Boolean(step.is_final),
      approver_roles: Array.isArray(step.approver_roles) ? step.approver_roles : [],
      can_edit_fields: Array.isArray(step.can_edit_fields) ? step.can_edit_fields : [],
      required_approval: Boolean(step.required_approval),
    },
  ];

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: { ...current, steps: nextSteps } as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  res.status(201).json({ success: true, data: toUi({ id: updated.id, data: updated.data }) });
});

