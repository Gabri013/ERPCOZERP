import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';

export const clientesRouter = Router();

async function ensureClienteEntity() {
  return prisma.entity.upsert({
    where: { code: 'cliente' },
    update: {},
    create: { code: 'cliente', name: 'Clientes' },
  });
}

function normalizeStr(v: unknown) {
  return String(v || '').trim();
}

clientesRouter.get('/', async (req, res) => {
  const entity = await ensureClienteEntity();

  const search = normalizeStr(req.query.search);
  const status = normalizeStr(req.query.status);
  const take = Math.min(200, Math.max(1, Number(req.query.limit || 200)));

  // Basic filtering is done in memory for now (keeps it simple/portable).
  // Later we can add jsonb indexes + SQL for high scale.
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take,
  });

  const data = rows
    .map((r) => ({ id: r.id, ...(r.data as any) }))
    .filter((c) => {
      if (status && String(c.status || '') !== status) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        String(c.razao_social || '').toLowerCase().includes(s) ||
        String(c.nome_fantasia || '').toLowerCase().includes(s) ||
        String(c.cnpj_cpf || '').includes(search) ||
        String(c.codigo || '').toLowerCase().includes(s)
      );
    });

  res.json({ success: true, data });
});

clientesRouter.post('/', async (req, res) => {
  const entity = await ensureClienteEntity();
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;

  if (!normalizeStr(data?.razao_social)) {
    return res.status(400).json({ error: 'razao_social é obrigatório' });
  }

  const created = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      data: data as Prisma.InputJsonValue,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    },
  });

  res.status(201).json({ success: true, data: { id: created.id, ...(created.data as any) } });
});

clientesRouter.put('/:id', async (req, res) => {
  const entity = await ensureClienteEntity();
  const { id } = req.params;
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;

  if (!normalizeStr(data?.razao_social)) {
    return res.status(400).json({ error: 'razao_social é obrigatório' });
  }

  const existing = await prisma.entityRecord.findFirst({
    where: { id, entityId: entity.id, deletedAt: null },
  });
  if (!existing) return res.status(404).json({ error: 'Cliente não encontrado' });

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: data as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  res.json({ success: true, data: { id: updated.id, ...(updated.data as any) } });
});

clientesRouter.delete('/:id', async (req, res) => {
  const entity = await ensureClienteEntity();
  const { id } = req.params;

  const existing = await prisma.entityRecord.findFirst({
    where: { id, entityId: entity.id, deletedAt: null },
  });
  if (!existing) return res.status(404).json({ error: 'Cliente não encontrado' });

  await prisma.entityRecord.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: req.user?.userId },
  });

  res.json({ success: true });
});

