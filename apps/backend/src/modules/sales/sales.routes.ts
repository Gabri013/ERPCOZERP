import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './sales.service.js';
import {
  createCustomerSchema,
  createPriceTableSchema,
  createQuoteSchema,
  createSaleOrderSchema,
  kanbanPatchSchema,
  listSaleOrdersQuerySchema,
  patchCustomerSchema,
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

salesRouter.post('/customers', canEdit, async (req, res) => {
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
    const data = await svc.listSaleOrders(parsed.data);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.get('/sale-orders/:id', canView, async (req, res) => {
  try {
    const data = await svc.getSaleOrder(req.params.id);
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
    const data = await svc.createSaleOrder(parsed.data);
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
    const data = await svc.patchSaleOrder(req.params.id, parsed.data);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/sale-orders/:id/approve', canApprove, async (req, res) => {
  try {
    const uid = req.user?.userId;
    if (!uid) return res.status(401).json({ error: 'Authentication required' });
    const data = await svc.approveSaleOrder(req.params.id, uid);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

salesRouter.post('/sale-orders/:id/generate-work-order', canEdit, async (req, res) => {
  try {
    const data = await svc.generateWorkOrderStub(req.params.id);
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

salesRouter.post('/quotes/:id/convert', canEdit, async (req, res) => {
  try {
    const data = await svc.convertQuoteToSaleOrder(req.params.id);
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
