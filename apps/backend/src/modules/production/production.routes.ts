import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './production.service.js';
import { createMachineSchema, createRoutingSchema, createWorkOrderSchema, kanbanReorderSchema, patchWorkOrderSchema } from './production.schemas.js';

export const workOrdersRouter = Router();
export const productionRouter = Router();

workOrdersRouter.use(authenticate);
productionRouter.use(authenticate);

const view = requirePermission(['ver_op', 'ordem_producao.view']);
const edit = requirePermission(['criar_op', 'editar_op', 'ordem_producao.edit', 'ordem_producao.create']);
const apontar = requirePermission(['apontar', 'editar_op']);

function err(res: import('express').Response, e: unknown, status = 400) {
  const msg = e instanceof Error ? e.message : 'Erro interno';
  return res.status(status).json({ error: msg });
}

workOrdersRouter.get('/', view, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(String(req.query.limit)) : undefined;
    const sector = req.query.sector ? String(req.query.sector) : undefined;
    const data = await svc.listWorkOrders({
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
      sector,
    });
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

workOrdersRouter.get('/:id', view, async (req, res) => {
  try {
    const data = await svc.getWorkOrder(req.params.id);
    if (!data) return res.status(404).json({ error: 'OP não encontrada' });
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

workOrdersRouter.get('/status-history/all', view, async (_req, res) => {
  try {
    const data = await svc.listWorkOrderStatusHistories();
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

workOrdersRouter.post('/status-history', edit, async (req, res) => {
  try {
    const data = await svc.createWorkOrderStatusHistory(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    err(res, e);
  }
});

workOrdersRouter.post('/', edit, async (req, res) => {
  const parsed = createWorkOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await svc.createWorkOrder(parsed.data, req.user?.userId);
    res.status(201).json({ success: true, data });
  } catch (e) {
    err(res, e);
  }
});

workOrdersRouter.patch('/:id', edit, async (req, res) => {
  const parsed = patchWorkOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await svc.updateWorkOrder(req.params.id, parsed.data, req.user?.userId);
    res.json({ success: true, data });
  } catch (e) {
    err(res, e);
  }
});

workOrdersRouter.post('/:id/finish', apontar, async (req, res) => {
  try {
    const completionData = req.body?.itens;
    const data = await svc.finishWorkOrder(req.params.id, req.user?.userId, completionData);
    res.json({ success: true, data });
  } catch (e) {
    err(res, e);
  }
});

productionRouter.get('/machines', requirePermission(['ver_maquinas']), async (_req, res) => {
  try {
    const data = await svc.listMachines();
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

productionRouter.get('/machine-sectors', requirePermission(['ver_kanban']), async (_req, res) => {
  try {
    const machines = await svc.listMachines();
    const sectors = Array.from(new Set(machines.map((m) => m.sector).filter(Boolean))).sort();
    res.json({ success: true, data: sectors });
  } catch (e) {
    err(res, e, 500);
  }
});

productionRouter.get('/machines/:id/oee', requirePermission(['ver_maquinas']), async (req, res) => {
  const { mes, ano } = req.query;
  const mesNum = parseInt(mes as string, 10);
  const anoNum = parseInt(ano as string, 10);
  if (!mesNum || !anoNum || mesNum < 1 || mesNum > 12 || anoNum < 2020) {
    return res.status(400).json({ error: 'Parâmetros mes e ano obrigatórios (mes 1-12, ano >=2020)' });
  }
  try {
    const data = await svc.calcularOEE(req.params.id, mesNum, anoNum);
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

productionRouter.post('/machines', requirePermission(['editar_op']), async (req, res) => {
  const parsed = createMachineSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await svc.createMachine(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    err(res, e);
  }
});

productionRouter.get('/routings', requirePermission(['ver_roteiros']), async (_req, res) => {
  try {
    const data = await svc.listRoutings();
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

productionRouter.post('/routings', requirePermission(['editar_op']), async (req, res) => {
  const parsed = createRoutingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await svc.createRouting(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    err(res, e);
  }
});

productionRouter.get('/pcp', requirePermission(['ver_pcp']), async (req, res) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const data = await svc.getPcpSchedule(from, to);
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

productionRouter.get('/floor', requirePermission(['ver_chao_fabrica']), async (_req, res) => {
  try {
    const data = await svc.listFloorSnapshot();
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

productionRouter.get('/refugo/summary', requirePermission(['ver_qualidade']), async (req, res) => {
  try {
    const mes = req.query.mes ? Number(req.query.mes) : undefined;
    const ano = req.query.ano ? Number(req.query.ano) : undefined;
    const groupBy = req.query.groupBy ? String(req.query.groupBy) : undefined;
    const data = await svc.getRefugoSummary({ mes, ano, groupBy });
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

productionRouter.post('/kanban/reorder', requirePermission(['ver_kanban']), async (req, res) => {
  const parsed = kanbanReorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await svc.reorderKanban(parsed.data.column, parsed.data.orderedIds);
    res.json({ success: true, data });
  } catch (e) {
    err(res, e);
  }
});

productionRouter.get('/appointments', apontar, async (_req, res) => {
  try {
    const data = await svc.listProductionAppointments();
    res.json({ success: true, data });
  } catch (e) {
    err(res, e, 500);
  }
});

productionRouter.post('/appointments', apontar, async (req, res) => {
  try {
    const data = await svc.createProductionAppointment(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    err(res, e);
  }
});

productionRouter.patch('/appointments/:id', apontar, async (req, res) => {
  try {
    const data = await svc.updateProductionAppointment(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) {
    err(res, e);
  }
});
