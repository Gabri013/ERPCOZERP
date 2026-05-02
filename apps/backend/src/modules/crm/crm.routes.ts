import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './crm.service.js';

export const crmRouter = Router();
crmRouter.use(authenticate);

const gate = requirePermission(['ver_crm']);

crmRouter.get('/pipeline', gate, async (_req, res) => {
  try {
    const data = await svc.getPipeline();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.post('/pipeline/move', gate, async (req, res) => {
  try {
    const id = String(req.body?.recordId || req.body?.id || '');
    const stage = String(req.body?.stage || req.body?.estagio || '');
    if (!id || !stage) return res.status(400).json({ error: 'recordId e stage são obrigatórios' });
    const data = await svc.moveOpportunity(id, stage);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.get('/activities/today', gate, async (_req, res) => {
  try {
    const data = await svc.listActivitiesToday();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.get('/dashboard', gate, async (_req, res) => {
  try {
    const data = await svc.getCrmDashboard();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
