import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';
import { entityRouteGuard } from '../../infra/entity-permissions.js';
import { cache } from '../../lib/cache.js';

export const contasRouter = Router();

async function ensureEntity(code: 'conta_receber' | 'conta_pagar', name: string) {
  return prisma.entity.upsert({
    where: { code },
    update: {},
    create: { code, name },
  });
}

function normalizeStr(v: unknown) {
  return String(v || '').trim();
}

function isValidStatus(s: string) {
  const v = s.toLowerCase();
  return v === 'aberto' || v === 'pago' || v === 'vencido' || v === 'cancelado' || v === 'recebido';
}

function buildListHandler(entityCode: 'conta_receber' | 'conta_pagar') {
  return async (req: any, res: any) => {
    const entity = await ensureEntity(entityCode, entityCode === 'conta_receber' ? 'Contas a Receber' : 'Contas a Pagar');
    const status = normalizeStr(req.query.status);
    const take = Math.min(200, Math.max(1, Number(req.query.limit || 200)));
    const skip = Math.max(0, Number(req.query.skip || 0));

    const rows = await prisma.entityRecord.findMany({
      where: {
        entityId: entity.id,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    const data = rows
      .map((r) => ({ id: r.id, ...(r.data as any), created_at: r.createdAt }))
      .filter((c) => {
        if (!status) return true;
        return String(c.status || '').toLowerCase() === status.toLowerCase();
      });

    res.json({ success: true, data });
  };
}

function buildCreateHandler(entityCode: 'conta_receber' | 'conta_pagar') {
  return async (req: any, res: any) => {
    const entity = await ensureEntity(entityCode, entityCode === 'conta_receber' ? 'Contas a Receber' : 'Contas a Pagar');
    const data = (req.body?.data ?? req.body) as Record<string, unknown>;

    const valor = Number((data as any).valor || 0);
    if (!Number.isFinite(valor) || valor <= 0) return res.status(400).json({ error: 'valor é obrigatório' });
    const dataV = normalizeStr((data as any).data_vencimento);
    if (!dataV) return res.status(400).json({ error: 'data_vencimento é obrigatório' });

    const status = normalizeStr((data as any).status || 'aberto').toLowerCase();
    if (!isValidStatus(status)) return res.status(400).json({ error: 'status inválido' });
    (data as any).status = status;

    const created = await prisma.entityRecord.create({
      data: {
        entityId: entity.id,
        data: { ...data, valor } as Prisma.InputJsonValue,
        createdBy: req.user?.userId,
        updatedBy: req.user?.userId,
      },
    });

    res.status(201).json({ success: true, data: { id: created.id, ...(created.data as any), created_at: created.createdAt } });
  };
}

function buildUpdateHandler(entityCode: 'conta_receber' | 'conta_pagar') {
  return async (req: any, res: any) => {
    const entity = await ensureEntity(entityCode, entityCode === 'conta_receber' ? 'Contas a Receber' : 'Contas a Pagar');
    const { id } = req.params;
    const data = (req.body?.data ?? req.body) as Record<string, unknown>;

    const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: 'Lançamento não encontrado' });

    if ((data as any).status) {
      const status = normalizeStr((data as any).status).toLowerCase();
      if (!isValidStatus(status)) return res.status(400).json({ error: 'status inválido' });
      (data as any).status = status;
    }

    if ((data as any).valor !== undefined) {
      const valor = Number((data as any).valor || 0);
      if (!Number.isFinite(valor) || valor <= 0) return res.status(400).json({ error: 'valor inválido' });
      (data as any).valor = valor;
    }

    const updated = await prisma.entityRecord.update({
      where: { id },
      data: {
        data: data as Prisma.InputJsonValue,
        updatedBy: req.user?.userId,
      },
    });

    res.json({ success: true, data: { id: updated.id, ...(updated.data as any), created_at: updated.createdAt } });
  };
}

function buildDeleteHandler(entityCode: 'conta_receber' | 'conta_pagar') {
  return async (req: any, res: any) => {
    const entity = await ensureEntity(entityCode, entityCode === 'conta_receber' ? 'Contas a Receber' : 'Contas a Pagar');
    const { id } = req.params;

    const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: 'Lançamento não encontrado' });

    await prisma.entityRecord.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: req.user?.userId },
    });

    res.json({ success: true });
  };
}

// Receber
contasRouter.get('/contas-receber', entityRouteGuard('conta_receber'), buildListHandler('conta_receber'));
contasRouter.post('/contas-receber', entityRouteGuard('conta_receber'), buildCreateHandler('conta_receber'));
contasRouter.put('/contas-receber/:id', entityRouteGuard('conta_receber'), buildUpdateHandler('conta_receber'));
contasRouter.delete('/contas-receber/:id', entityRouteGuard('conta_receber'), buildDeleteHandler('conta_receber'));

// Pagar
contasRouter.get('/contas-pagar', entityRouteGuard('conta_pagar'), buildListHandler('conta_pagar'));
contasRouter.post('/contas-pagar', entityRouteGuard('conta_pagar'), buildCreateHandler('conta_pagar'));
contasRouter.put('/contas-pagar/:id', entityRouteGuard('conta_pagar'), buildUpdateHandler('conta_pagar'));
contasRouter.delete('/contas-pagar/:id', entityRouteGuard('conta_pagar'), buildDeleteHandler('conta_pagar'));

// Cash flow
contasRouter.get('/cash-flow', entityRouteGuard('conta_receber'), async (req, res) => {
  const cacheKey = 'financial:cash-flow';
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // Placeholder implementation - contas bancárias, agendamentos atraso, projeção
  const contas = await prisma.entityRecord.findMany({
    where: { entity: { code: 'conta_bancaria' }, deletedAt: null },
    select: { data: true },
    take: 100,
  });

  const agendamentosAtraso = await prisma.entityRecord.findMany({
    where: {
      entity: { code: 'conta_receber' },
      deletedAt: null,
      data: { path: ['status'], equals: 'vencido' }
    },
    select: { data: true },
    take: 50,
  });

  const projecao = []; // Placeholder

  const data = {
    contas: contas.map(c => c.data),
    agendamentos_atraso: agendamentosAtraso.map(a => a.data),
    projecao
  };

  const response = { success: true, data };
  await cache.set(cacheKey, response, { ttl: 300 }); // 5 minutes
  res.json(response);
});

