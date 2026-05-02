import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './hr.service.js';

export const hrRouter = Router();
hrRouter.use(authenticate);

const view = requirePermission(['ver_rh']);
const edit = requirePermission(['editar_funcionarios', 'ver_rh']);

hrRouter.get('/employees', view, async (_req, res) => {
  try {
    const data = await svc.listEmployees();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

hrRouter.post('/employees', edit, async (req, res) => {
  const schema = z.object({
    code: z.string().min(1),
    fullName: z.string().min(2),
    email: z.string().email().optional().nullable(),
    department: z.string().optional().nullable(),
    hireDate: z.string().optional().nullable(),
    salaryBase: z.number().optional().nullable(),
    active: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await svc.createEmployee(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

hrRouter.patch('/employees/:id', edit, async (req, res) => {
  const schema = z.object({
    code: z.string().min(1).optional(),
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional().nullable(),
    department: z.string().optional().nullable(),
    hireDate: z.string().optional().nullable(),
    salaryBase: z.number().optional().nullable(),
    active: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await svc.updateEmployee(req.params.id, parsed.data);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

hrRouter.get('/time-entries', view, async (req, res) => {
  try {
    const data = await svc.listTimeEntries(req.query.employeeId ? String(req.query.employeeId) : undefined);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

hrRouter.post('/time-entries', edit, async (req, res) => {
  const schema = z.object({
    employeeId: z.string().uuid(),
    workDate: z.string(),
    hours: z.number().positive(),
    notes: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await svc.createTimeEntry(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

hrRouter.get('/leave-requests', view, async (_req, res) => {
  try {
    const data = await svc.listLeaveRequests();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

hrRouter.post('/leave-requests', edit, async (req, res) => {
  const schema = z.object({
    employeeId: z.string().uuid(),
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await svc.createLeaveRequest(parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

hrRouter.post('/payroll/calculate', requirePermission(['ver_folha']), async (req, res) => {
  const month = String(req.body?.month || req.body?.referenceMonth || '');
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'month deve ser YYYY-MM' });
  try {
    const data = await svc.calculatePayroll(month);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

hrRouter.get('/payroll/:month', requirePermission(['ver_folha']), async (req, res) => {
  const month = req.params.month;
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'month deve ser YYYY-MM' });
  try {
    const data = await svc.getPayrollRun(month);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
