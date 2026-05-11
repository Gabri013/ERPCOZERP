import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';
import { entityRouteGuard } from '../../infra/entity-permissions.js';
import { requirePermission } from '../../middleware/auth.js';
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

function buildCompanyFilter(req: any) {
  if (!req.user?.companyId) return {};
  return { data: { path: ['companyId'], equals: req.user.companyId } };
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
        ...buildCompanyFilter(req),
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

    const companyId = req.user?.companyId;
    if (companyId) {
      (data as any).companyId = companyId;
    }

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

    const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null, ...buildCompanyFilter(req) } });
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

function buildSettleHandler(entityCode: 'conta_receber' | 'conta_pagar', statusValue: 'recebido' | 'pago') {
  return async (req: any, res: any) => {
    const entity = await ensureEntity(entityCode, entityCode === 'conta_receber' ? 'Contas a Receber' : 'Contas a Pagar');
    const { id } = req.params;
    const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null, ...buildCompanyFilter(req) } });
    if (!existing) return res.status(404).json({ error: 'Lançamento não encontrado' });

    const body = (req.body?.data ?? req.body) as Record<string, unknown>;
    const dataPagamento = String(body.dataPagamento ?? body.data_pagamento ?? '').trim();
    const valorPago = body.valorPago ?? body.valor_pago ?? (body.valor ? Number(body.valor) : undefined);
    const observacao = String(body.observacao ?? body.observation ?? '').trim();

    if (!dataPagamento) return res.status(400).json({ error: 'dataPagamento é obrigatório' });
    if (valorPago === undefined || typeof valorPago !== 'number' || !Number.isFinite(valorPago) || Number(valorPago) <= 0) {
      return res.status(400).json({ error: 'valorPago é obrigatório e deve ser numérico' });
    }

    const updated = await prisma.entityRecord.update({
      where: { id },
      data: {
        data: {
          ...(existing.data as any),
          status: statusValue,
          data_pagamento: dataPagamento,
          valor_pago: Number(valorPago),
          observacao: observacao || undefined,
          baixado_por: req.user?.userId,
        } as Prisma.InputJsonValue,
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

    const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null, ...buildCompanyFilter(req) } });
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
contasRouter.patch('/contas-pagar/:id/baixar', entityRouteGuard('conta_pagar'), requirePermission('editar_financeiro'), buildSettleHandler('conta_pagar', 'pago'));
contasRouter.delete('/contas-pagar/:id', entityRouteGuard('conta_pagar'), buildDeleteHandler('conta_pagar'));

// Cash flow
contasRouter.get('/cash-flow', entityRouteGuard('conta_receber'), async (req, res) => {
  const cacheKey = `financial:cash-flow:${req.user?.companyId ?? 'global'}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  // Entradas projetadas: contas a receber abertas
  const entradas = await prisma.entityRecord.findMany({
    where: {
      entity: { code: 'conta_receber' },
      deletedAt: null,
      AND: [
        { data: { path: ['status'], not: 'recebido' } },
        buildCompanyFilter(req),
      ],
    },
    select: { data: true },
  });

  // Saídas projetadas: contas a pagar abertas
  const saidas = await prisma.entityRecord.findMany({
    where: {
      entity: { code: 'conta_pagar' },
      deletedAt: null,
      AND: [
        { data: { path: ['status'], not: 'pago' } },
        buildCompanyFilter(req),
      ],
    },
    select: { data: true },
  });

  // Realizado no mês atual
  const entradasRealizadas = entradas.filter(e => {
    const dataPag = (e.data as any).data_pagamento;
    if (!dataPag) return false;
    const d = new Date(dataPag);
    return d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual;
  });

  const saidasRealizadas = saidas.filter(s => {
    const dataPag = (s.data as any).data_pagamento;
    if (!dataPag) return false;
    const d = new Date(dataPag);
    return d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual;
  });

  const realizadoEntradas = entradasRealizadas.reduce((sum, e) => sum + Number((e.data as any).valor_pago || (e.data as any).valor || 0), 0);
  const realizadoSaidas = saidasRealizadas.reduce((sum, s) => sum + Number((s.data as any).valor_pago || (s.data as any).valor || 0), 0);

  // Projetado para os próximos 3 meses
  const projecao = [];
  for (let i = 0; i < 3; i++) {
    const mes = mesAtual + i;
    const ano = anoAtual + Math.floor((mes - 1) / 12);
    const mesReal = ((mes - 1) % 12) + 1;

    const entradasMes = entradas.filter(e => {
      const venc = (e.data as any).data_vencimento;
      if (!venc) return false;
      const d = new Date(venc);
      return d.getMonth() + 1 === mesReal && d.getFullYear() === ano;
    });

    const saidasMes = saidas.filter(s => {
      const venc = (s.data as any).data_vencimento;
      if (!venc) return false;
      const d = new Date(venc);
      return d.getMonth() + 1 === mesReal && d.getFullYear() === ano;
    });

    const projEntradas = entradasMes.reduce((sum, e) => sum + Number((e.data as any).valor || 0), 0);
    const projSaidas = saidasMes.reduce((sum, s) => sum + Number((s.data as any).valor || 0), 0);

    projecao.push({
      mes: mesReal,
      ano,
      entradas: projEntradas,
      saidas: projSaidas,
      saldo: projEntradas - projSaidas
    });
  }

  const data = {
    realizado: {
      mes: mesAtual,
      ano: anoAtual,
      entradas: realizadoEntradas,
      saidas: realizadoSaidas,
      saldo: realizadoEntradas - realizadoSaidas
    },
    projecao
  };

  const response = { success: true, data };
  await cache.set(cacheKey, response, { ttl: 300 }); // 5 minutes
  res.json(response);
});

// DRE - Demonstrativo de Resultado do Exercício
contasRouter.get('/dre', entityRouteGuard('conta_receber'), async (req, res) => {
  const ano = Number(req.query.ano) || new Date().getFullYear();
  const mes = Number(req.query.mes) || new Date().getMonth() + 1;
  const cacheKey = `financial:dre:${req.user?.companyId ?? 'global'}:${ano}:${mes}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // Receitas: contas recebidas no período
  const receitas = await prisma.entityRecord.findMany({
    where: {
      entity: { code: 'conta_receber' },
      deletedAt: null,
      AND: [
        { data: { path: ['status'], equals: 'recebido' } },
        buildCompanyFilter(req),
      ],
    },
    select: { data: true },
  });

  const despesas = await prisma.entityRecord.findMany({
    where: {
      entity: { code: 'conta_pagar' },
      deletedAt: null,
      AND: [
        { data: { path: ['status'], equals: 'pago' } },
        buildCompanyFilter(req),
      ],
    },
    select: { data: true },
  });

  const receitasNoPeriodo = receitas.filter((r) => {
    const data = r.data as any;
    const dataPag = data.data_pagamento;
    if (!dataPag) return false;
    const d = new Date(dataPag);
    return d.getMonth() + 1 === mes && d.getFullYear() === ano;
  });

  const despesasNoPeriodo = despesas.filter((d) => {
    const data = d.data as any;
    const dataPag = data.data_pagamento;
    if (!dataPag) return false;
    const dt = new Date(dataPag);
    return dt.getMonth() + 1 === mes && dt.getFullYear() === ano;
  });

  const receitaBruta = receitasNoPeriodo.reduce((sum, r) => sum + Number((r.data as any).valor_pago || (r.data as any).valor || 0), 0);
  const despesaTotal = despesasNoPeriodo.reduce((sum, d) => sum + Number((d.data as any).valor_pago || (d.data as any).valor || 0), 0);
  const resultado = receitaBruta - despesaTotal;

  const data = {
    periodo: { ano, mes },
    receitaBruta,
    despesaTotal,
    resultado,
    margem: receitaBruta > 0 ? (resultado / receitaBruta) * 100 : 0
  };

  const response = { success: true, data };
  await cache.set(cacheKey, response, { ttl: 300 }); // 5 minutes
  res.json(response);
});


