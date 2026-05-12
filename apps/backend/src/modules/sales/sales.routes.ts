import { Router, type Request, type Response } from 'express';
import { body } from 'express-validator';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as svc from './sales.service.js';
import {
  addSalesActivitySchema,
  createCustomerSchema,
  createOpportunitySchema,
  createPriceTableSchema,
  createQuoteSchema,
  createSaleOrderSchema,
  kanbanPatchSchema,
  listSaleOrdersQuerySchema,
  patchCustomerSchema,
  patchOpportunitySchema,
  patchPriceTableSchema,
  patchQuoteSchema,
  patchSaleOrderSchema,
  priceTableItemBodySchema,
} from './sales.schemas.js';

export const salesRouter = Router();

salesRouter.use(authenticate);

function handleError(res: import('express').Response, e: unknown) {
  const msg = e instanceof Error ? e.message : 'Erro interno';
  if (
    msg.includes('não encontrad') ||
    msg.includes('já convertido') ||
    msg.includes('bloqueada') ||
    msg.includes('obrigatório')
  ) {
    return res.status(400).json({ error: msg });
  }
  return res.status(500).json({ error: msg });
}

const canView = requirePermission(['ver_pedidos', 'pedido_venda.view']);
const canEdit = requirePermission(['editar_pedidos', 'pedido_venda.edit', 'criar_pedidos']);
const canApprove = requirePermission(['aprovar_pedidos']);

salesRouter.get('/customers', canView, async (_req, res) => {
  try {
    const data = await svc.listCustomers();
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/customers', canEdit, [
  body('name').trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('email').optional().isEmail().normalizeEmail(),
  body('cnpj').optional().isLength({ min: 14, max: 14 }).withMessage('CNPJ deve ter 14 dígitos')
], validate, async (req: Request, res: Response) => {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.createCustomer(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.patch('/customers/:id', canEdit, async (req, res) => {
  const parsed = patchCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.patchCustomer(req.params.id, parsed.data);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/sale-orders', canView, async (req, res) => {
  const parsed = listSaleOrdersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Parâmetros inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.listSaleOrders(parsed.data, req.user);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/sale-orders/:id', canView, async (req, res) => {
  try {
    const data = await svc.getSaleOrder(req.params.id, req.user);
    if (!data) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/sale-orders', canEdit, async (req, res) => {
  const parsed = createSaleOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.createSaleOrder(parsed.data, req.user?.userId ?? null, req.user?.companyId);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.patch('/sale-orders/:id', canEdit, async (req, res) => {
  const parsed = patchSaleOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.patchSaleOrder(req.params.id, parsed.data, req.user);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/sale-orders/:id/approve', canApprove, async (req, res) => {
  try {
    const uid = req.user?.userId;
    if (!uid) return res.status(401).json({ error: 'Authentication required' });
    const data = await svc.approveSaleOrder(req.params.id, uid, req.user);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/sale-orders/:id/generate-work-order', canEdit, async (req, res) => {
  try {
    const data = await svc.generateWorkOrderStub(req.params.id, req.user);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.patch('/sale-orders/:id/kanban', canEdit, async (req, res) => {
  const parsed = kanbanPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.patchKanban(
      req.params.id,
      parsed.data.kanbanColumn,
      parsed.data.kanbanOrder,
      req.user,
    );
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/quotes', canView, async (_req, res) => {
  try {
    const data = await svc.listQuotes();
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/quotes/:id', canView, async (req, res) => {
  try {
    const data = await svc.getQuote(req.params.id);
    if (!data) return res.status(404).json({ error: 'Orçamento não encontrado' });
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/quotes', canEdit, async (req, res) => {
  const parsed = createQuoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.createQuote(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.patch('/quotes/:id', canEdit, async (req, res) => {
  const parsed = patchQuoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.patchQuote(req.params.id, parsed.data);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/quotes/:id/approve', canApprove, async (req, res) => {
  try {
    const uid = req.user?.userId;
    if (!uid) return res.status(401).json({ error: 'Authentication required' });
    const data = await svc.approveQuote(req.params.id, uid);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/quotes/:id/convert', canEdit, async (req, res) => {
  try {
    const data = await svc.convertQuoteToSaleOrder(req.params.id, req.user?.userId ?? null);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/quotes/:id/revision', canEdit, async (req, res) => {
  try {
    const data = await svc.createQuoteRevision(req.params.id, req.user?.userId ?? null);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/quotes/:id/activities', canView, async (req, res) => {
  try {
    const data = await svc.listQuoteActivities(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/opportunities', canView, async (req, res) => {
  try {
    const data = await svc.listOpportunities(req.user ?? undefined);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/opportunities/:id', canView, async (req, res) => {
  try {
    const data = await svc.getOpportunity(req.params.id);
    if (!data) return res.status(404).json({ error: 'Oportunidade não encontrada' });
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/opportunities', canEdit, async (req, res) => {
  const parsed = createOpportunitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.createOpportunity(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.patch('/opportunities/:id', canEdit, async (req, res) => {
  const parsed = patchOpportunitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.patchOpportunity(req.params.id, parsed.data, req.user?.userId ?? null);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/activities', canEdit, async (req, res) => {
  const parsed = addSalesActivitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  if (!parsed.data.opportunityId && !parsed.data.quoteId) {
    return res.status(400).json({ error: 'Informe opportunityId ou quoteId' });
  }
  try {
    const data = await svc.addSalesActivity({
      ...parsed.data,
      userId: req.user?.userId ?? null,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/price-tables', canView, async (_req, res) => {
  try {
    const data = await svc.listPriceTables();
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/price-tables', canEdit, async (req, res) => {
  const parsed = createPriceTableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.createPriceTable(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.patch('/price-tables/:id', canEdit, async (req, res) => {
  const parsed = patchPriceTableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.patchPriceTable(req.params.id, parsed.data);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/price-tables/:id/items', canEdit, async (req, res) => {
  const parsed = priceTableItemBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const table = await svc.listPriceTables();
    const t = table.find((x) => x.id === req.params.id);
    if (!t) return res.status(404).json({ error: 'Tabela não encontrada' });
    const items = t.items.map((i) => ({
      productId: i.productId,
      price: i.price.toNumber(),
      minQty: i.minQty?.toNumber() ?? null,
    }));
    const next = items.filter((i) => i.productId !== parsed.data.productId);
    next.push({
      productId: parsed.data.productId,
      price: parsed.data.price,
      minQty: parsed.data.minQty ?? null,
    });
    const data = await svc.patchPriceTable(req.params.id, { items: next });
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/reports/summary', canView, async (_req, res) => {
  try {
    const data = await svc.salesReportSummary();
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});
