import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';
import { cache } from '../../lib/cache.js';

export const tabelaPrecosRouter = Router();

async function ensureEntity() {
  return prisma.entity.upsert({
    where: { code: 'tabela_preco' },
    update: {},
    create: { code: 'tabela_preco', name: 'Tabela de Preços' },
  });
}

function normalizeStr(v: unknown) {
  return String(v || '').trim();
}

tabelaPrecosRouter.get('/', async (req, res) => {
  const entity = await ensureEntity();
  const search = normalizeStr(req.query.search);
  const grupo = normalizeStr(req.query.grupo);
  const take = Math.min(500, Math.max(1, Number(req.query.limit || 500)));
  const skip = Math.max(0, Number(req.query.skip || 0));

  // Cache only if no search or grupo filters
  if (!search && !grupo) {
    const cacheKey = `sales:price-tables:${take}:${skip}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
  }

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    take,
    skip,
  });

  const data = rows
    .map((r) => ({ id: r.id, ...(r.data as any) }))
    .filter((p) => {
      if (grupo && String(p.grupo || '') !== grupo) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        String(p.codigo || '').toLowerCase().includes(s) ||
        String(p.descricao || '').toLowerCase().includes(s)
      );
    });

  const response = { success: true, data };
  if (!search && !grupo) {
    const cacheKey = `sales:price-tables:${take}:${skip}`;
    await cache.set(cacheKey, response, { ttl: 300 }); // 5 minutes
  }

  res.json(response);
});

tabelaPrecosRouter.post('/', async (req, res) => {
  const entity = await ensureEntity();
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;
  if (!normalizeStr((data as any).descricao)) return res.status(400).json({ error: 'descricao é obrigatório' });

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

tabelaPrecosRouter.put('/:id', async (req, res) => {
  const entity = await ensureEntity();
  const { id } = req.params;
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Item não encontrado' });

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: data as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  res.json({ success: true, data: { id: updated.id, ...(updated.data as any) } });
});

tabelaPrecosRouter.delete('/:id', async (req, res) => {
  const entity = await ensureEntity();
  const { id } = req.params;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Item não encontrado' });

  await prisma.entityRecord.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: req.user?.userId },
  });

  res.json({ success: true });
});

