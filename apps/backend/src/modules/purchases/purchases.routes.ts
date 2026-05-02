import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './purchases.service.js';
import {
  createPurchaseOrderSchema,
  createSupplierSchema,
  receivePurchaseOrderSchema,
} from './purchases.schemas.js';

export const purchasesRouter = Router();

purchasesRouter.use(authenticate);

function handleError(res: import('express').Response, e: unknown) {
  const msg = e instanceof Error ? e.message : 'Erro interno';
  if (msg.includes('não encontrad') || msg.includes('não consta') || msg.includes('cancelada') || msg.includes('maior')) {
    return res.status(400).json({ error: msg });
  }
  return res.status(500).json({ error: msg });
}

const view = requirePermission(['ver_compras', 'ordem_compra.view']);
const edit = requirePermission(['criar_oc', 'ordem_compra.edit', 'editar_fornecedores']);

purchasesRouter.get('/suppliers', view, async (_req, res) => {
  try {
    const data = await svc.listSuppliers();
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

purchasesRouter.post('/suppliers', edit, async (req, res) => {
  const parsed = createSupplierSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.createSupplier(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

purchasesRouter.patch('/suppliers/:id', edit, async (req, res) => {
  try {
    const data = await svc.patchSupplier(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

purchasesRouter.get('/orders', view, async (_req, res) => {
  try {
    const data = await svc.listPurchaseOrders();
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

purchasesRouter.get('/orders/:id', view, async (req, res) => {
  try {
    const data = await svc.getPurchaseOrder(req.params.id);
    if (!data) return res.status(404).json({ error: 'OC não encontrada' });
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

purchasesRouter.post('/orders', edit, async (req, res) => {
  const parsed = createPurchaseOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.createPurchaseOrder(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

purchasesRouter.post('/orders/:id/send', edit, async (req, res) => {
  try {
    const data = await svc.sendPurchaseOrder(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});

purchasesRouter.post('/orders/:id/receive', edit, async (req, res) => {
  const parsed = receivePurchaseOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  try {
    const data = await svc.receivePurchaseOrder(req.params.id, parsed.data.lines, req.user?.userId);
    res.json({ success: true, data });
  } catch (e) {
    handleError(res, e);
  }
});
