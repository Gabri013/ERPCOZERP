import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';

export const recordsRouter = Router();

async function hasPermission(userId: string, permissionCode: string) {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true, role: { select: { code: true } } },
  });

  if (roles.some((r) => r.role.code === 'master')) return true;
  const roleIds = roles.map((r) => r.roleId);
  if (!roleIds.length) return false;

  const allowed = await prisma.rolePermission.findFirst({
    where: {
      roleId: { in: roleIds },
      granted: true,
      permission: { code: permissionCode, active: true },
    },
    select: { id: true },
  });

  return Boolean(allowed);
}

async function ensureRecordsAccess(req: any, entityCode: string, action: 'read' | 'write' | 'delete') {
  // Master sempre passa (tratado via roles no DB)
  const userId = req.user?.userId;
  if (!userId) return false;

  // Produção: leitura de OPs e escrita/leitura de apontamentos sem CRUD genérico
  if (action === 'read' && entityCode === 'ordem_producao') return hasPermission(userId, 'ver_op');
  if (action === 'read' && entityCode === 'apontamento_producao') return hasPermission(userId, 'apontar');
  if (action === 'write' && entityCode === 'apontamento_producao') return hasPermission(userId, 'apontar');
  if (action === 'read' && entityCode === 'historico_op') return hasPermission(userId, 'ver_kanban');
  if (action === 'write' && entityCode === 'historico_op') return hasPermission(userId, 'ver_kanban');

  // Default: exige permissão de CRUD genérico
  return hasPermission(userId, 'record.manage');
}

const createSchema = z.object({
  entity: z.string().min(1),
  data: z.record(z.string(), z.any()),
});

const updateSchema = z.object({
  data: z.record(z.string(), z.any()),
});

recordsRouter.get('/', async (req, res) => {
  const entityCode = String(req.query.entity || '');
  if (!entityCode) return res.status(400).json({ error: 'entity é obrigatório' });

  const can = await ensureRecordsAccess(req, entityCode, 'read');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const entity = await prisma.entity.findUnique({ where: { code: entityCode } });
  if (!entity) return res.status(404).json({ error: 'Entidade não encontrada' });

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  res.json({
    success: true,
    data: rows.map((r) => ({ id: r.id, data: r.data, created_at: r.createdAt, updated_at: r.updatedAt })),
  });
});

recordsRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const can = await ensureRecordsAccess(req, parsed.data.entity, 'write');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const entity = await prisma.entity.findUnique({ where: { code: parsed.data.entity } });
  if (!entity) return res.status(404).json({ error: 'Entidade não encontrada' });

  const created = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      data: parsed.data.data as Prisma.InputJsonValue,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    },
  });

  res.status(201).json({ success: true, data: { id: created.id, data: created.data } });
});

recordsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const row = await prisma.entityRecord.findUnique({ where: { id } });
  if (!row || row.deletedAt) return res.status(404).json({ error: 'Registro não encontrado' });

  const entity = await prisma.entity.findUnique({ where: { id: row.entityId } });
  const entityCode = entity?.code || '';
  const can = await ensureRecordsAccess(req, entityCode, 'read');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  res.json({ success: true, data: { id: row.id, entity_id: row.entityId, data: row.data } });
});

recordsRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const existing = await prisma.entityRecord.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return res.status(404).json({ error: 'Registro não encontrado' });

  const entity = await prisma.entity.findUnique({ where: { id: existing.entityId } });
  const entityCode = entity?.code || '';
  const can = await ensureRecordsAccess(req, entityCode, 'write');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: parsed.data.data as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  res.json({ success: true, data: { id: updated.id, data: updated.data } });
});

recordsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.entityRecord.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return res.status(404).json({ error: 'Registro não encontrado' });

  const entity = await prisma.entity.findUnique({ where: { id: existing.entityId } });
  const entityCode = entity?.code || '';
  const can = await ensureRecordsAccess(req, entityCode, 'delete');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  await prisma.entityRecord.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: req.user?.userId },
  });

  res.json({ success: true });
});

