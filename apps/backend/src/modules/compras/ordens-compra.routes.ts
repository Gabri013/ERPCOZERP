import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';

export const ordensCompraRouter = Router();

async function ensureOcEntity() {
  return prisma.entity.upsert({
    where: { code: 'ordem_compra' },
    update: {},
    create: { code: 'ordem_compra', name: 'Ordens de Compra' },
  });
}

function normalizeStr(v: unknown) {
  return String(v || '').trim();
}

function nextOcNumber(existing: any[]) {
  // Tenta encontrar maior OC-00000 e incrementar; fallback por timestamp.
  const nums = existing
    .map((r) => String(r.numero || ''))
    .map((n) => {
      const m = n.match(/OC-(\d+)/i);
      return m ? Number(m[1]) : NaN;
    })
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) + 1 : 1);
  return `OC-${String(next).padStart(5, '0')}`;
}

ordensCompraRouter.get('/', async (req, res) => {
  const entity = await ensureOcEntity();

  const search = normalizeStr(req.query.search);
  const status = normalizeStr(req.query.status);
  const take = Math.min(200, Math.max(1, Number(req.query.limit || 200)));

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take,
  });

  const data = rows
    .map((r) => ({ id: r.id, ...(r.data as any) }))
    .filter((o) => {
      if (status && String(o.status || '') !== status) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        String(o.numero || '').toLowerCase().includes(s) ||
        String(o.fornecedor_nome || '').toLowerCase().includes(s)
      );
    });

  res.json({ success: true, data });
});

ordensCompraRouter.post('/', async (req, res) => {
  const entity = await ensureOcEntity();
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;

  if (!normalizeStr(data?.fornecedor_nome)) return res.status(400).json({ error: 'fornecedor_nome é obrigatório' });

  // gera número se não vier
  const numero = normalizeStr(data.numero);
  if (!numero) {
    const existing = await prisma.entityRecord.findMany({
      where: { entityId: entity.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { data: true },
    });
    (data as any).numero = nextOcNumber(existing.map((r) => r.data));
  }

  // garante valor_total coerente
  const itens = Array.isArray((data as any).itens) ? (data as any).itens : [];
  if ((data as any).valor_total === undefined && itens.length) {
    (data as any).valor_total = itens.reduce((s: number, it: any) => s + Number(it.quantidade || 0) * Number(it.preco_unitario || 0), 0);
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

ordensCompraRouter.put('/:id', async (req, res) => {
  const entity = await ensureOcEntity();
  const { id } = req.params;
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;

  if (!normalizeStr(data?.fornecedor_nome)) return res.status(400).json({ error: 'fornecedor_nome é obrigatório' });

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'OC não encontrada' });

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: data as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  res.json({ success: true, data: { id: updated.id, ...(updated.data as any) } });
});

ordensCompraRouter.delete('/:id', async (req, res) => {
  const entity = await ensureOcEntity();
  const { id } = req.params;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'OC não encontrada' });

  await prisma.entityRecord.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: req.user?.userId },
  });

  res.json({ success: true });
});

