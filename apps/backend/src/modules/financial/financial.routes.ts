import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './financial.service.js';

export const financialRouter = Router();
financialRouter.use(authenticate);

const gate = requirePermission(['ver_financeiro']);

financialRouter.get('/cashflow', gate, async (req, res) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const data = await svc.cashflow(from, to);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

financialRouter.get('/dre', gate, async (req, res) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const data = await svc.dre(from, to);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

financialRouter.get('/conciliation', gate, async (req, res) => {
  try {
    const data = await svc.conciliation(req.query.bank ? String(req.query.bank) : undefined);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

financialRouter.get('/cost-centers', gate, async (req, res) => {
  try {
    const costCenters = await svc.getCostCenters();
    res.json({ success: true, data: costCenters });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

financialRouter.post('/cost-centers', gate, async (req, res) => {
  try {
    const costCenter = await svc.createCostCenter(req.body);
    res.status(201).json({ success: true, data: costCenter });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
