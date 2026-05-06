import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { normalizeOpportunityStage } from './crm-constants.js';
import * as svc from './crm.service.js';
import { crmInboxRouter } from './crm-inbox.routes.js';

export const crmRouter = Router();
crmRouter.use(authenticate);
crmRouter.use(crmInboxRouter);

const gate = requirePermission(['ver_crm']);

crmRouter.get('/pipeline', gate, async (req, res) => {
  try {
    const data = await svc.getPipeline({ companyId: req.user!.companyId }, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.get('/analytics/conversion', gate, async (req, res) => {
  try {
    const data = await svc.getCrmAnalyticsConversion(req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.get('/analytics/loss-reasons', gate, async (req, res) => {
  try {
    const data = await svc.getCrmAnalyticsLossReasons(req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.get('/analytics/sales-performance', gate, async (req, res) => {
  try {
    const data = await svc.getCrmAnalyticsSalesPerformance(req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.post('/pipeline/move', gate, async (req, res) => {
  try {
    const id = String(req.body?.recordId || req.body?.id || '');
    const stageRaw = String(req.body?.stage || req.body?.estagio || '');
    if (!id || !stageRaw) return res.status(400).json({ error: 'recordId e stage são obrigatórios' });
    const stage = normalizeOpportunityStage(stageRaw);
    const data = await svc.moveOpportunity({ companyId: req.user!.companyId }, id, stage, req.user?.userId, req.user?.roles);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.get('/activities/today', gate, async (_req, res) => {
  try {
    const data = await svc.listActivitiesToday({ companyId: _req.user!.companyId });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.get('/dashboard', gate, async (req, res) => {
  try {
    const data = await svc.getCrmDashboard({ companyId: req.user!.companyId }, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmRouter.get('/alerts', gate, async (req, res) => {
  try {
    const data = await svc.getCrmAlerts({ companyId: req.user!.companyId }, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

/** Lista usuários ativos para seleção de responsável (sem expor senha). */
crmRouter.get('/assignable-users', gate, async (_req, res) => {
  try {
    const rows = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
      take: 500,
    });
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
