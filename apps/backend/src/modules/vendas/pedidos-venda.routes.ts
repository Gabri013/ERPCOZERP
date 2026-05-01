import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';

export const pedidosVendaRouter = Router();

async function ensureEntity() {
  return prisma.entity.upsert({
    where: { code: 'pedido_venda' },
    update: {},
    create: { code: 'pedido_venda', name: 'Pedidos de Venda' },
  });
}

function normalizeStr(v: unknown) {
  return String(v || '').trim();
}

function nextNumero(existing: any[]) {
  const nums = existing
    .map((r) => String(r.numero || ''))
    .map((n) => {
      const m = n.match(/PV-(\d+)/i);
      return m ? Number(m[1]) : NaN;
    })
    .filter((n) => Number.isFinite(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `PV-${String(next).padStart(5, '0')}`;
}

pedidosVendaRouter.get('/', async (req, res) => {
  const entity = await ensureEntity();

  const search = normalizeStr(req.query.search);
  const status = normalizeStr(req.query.status);
  const vendedor = normalizeStr(req.query.vendedor);
  const take = Math.min(200, Math.max(1, Number(req.query.limit || 200)));

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take,
  });

  const data = rows
    .map((r) => ({ id: r.id, ...(r.data as any) }))
    .filter((p) => {
      if (status && String(p.status || '') !== status) return false;
      if (vendedor && String(p.vendedor || '') !== vendedor) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        String(p.numero || '').toLowerCase().includes(s) ||
        String(p.cliente_nome || '').toLowerCase().includes(s)
      );
    });

  res.json({ success: true, data });
});

pedidosVendaRouter.post('/', async (req, res) => {
  const entity = await ensureEntity();
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;

  if (!normalizeStr((data as any).cliente_nome)) return res.status(400).json({ error: 'cliente_nome é obrigatório' });
  if (!normalizeStr((data as any).data_emissao)) return res.status(400).json({ error: 'data_emissao é obrigatório' });

  const numero = normalizeStr((data as any).numero);
  if (!numero) {
    const existing = await prisma.entityRecord.findMany({
      where: { entityId: entity.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { data: true },
    });
    (data as any).numero = nextNumero(existing.map((r) => r.data));
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

pedidosVendaRouter.put('/:id', async (req, res) => {
  const entity = await ensureEntity();
  const { id } = req.params;
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Pedido não encontrado' });

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: data as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  res.json({ success: true, data: { id: updated.id, ...(updated.data as any) } });
});

pedidosVendaRouter.delete('/:id', async (req, res) => {
  const entity = await ensureEntity();
  const { id } = req.params;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Pedido não encontrado' });

  await prisma.entityRecord.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: req.user?.userId },
  });

  res.json({ success: true });
});

