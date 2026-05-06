import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  listAccountPlan, createAccountPlan, updateAccountPlan, deleteAccountPlan,
  listEntries, createEntry, deleteEntry,
  getDRE,
  listStandardCosts, upsertStandardCost,
  getAccountingStats,
} from './accounting.service.js';

export const accountingRouter = Router();
accountingRouter.use(authenticate);

accountingRouter.get('/stats', async (_req, res) => {
  try { res.json(await getAccountingStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Account Plan
accountingRouter.get('/account-plan', async (req, res) => {
  try { res.json(await listAccountPlan(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
accountingRouter.post('/account-plan', async (req, res) => {
  try { res.status(201).json(await createAccountPlan(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
accountingRouter.put('/account-plan/:id', async (req, res) => {
  try { res.json(await updateAccountPlan(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
accountingRouter.delete('/account-plan/:id', async (req, res) => {
  try { await deleteAccountPlan(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// Entries
accountingRouter.get('/entries', async (req, res) => {
  try { res.json(await listEntries(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
accountingRouter.post('/entries', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que 0'),
  body('date').isISO8601().withMessage('Data deve ser válida'),
  body('description').trim().isLength({ min: 3 }).withMessage('Descrição deve ter pelo menos 3 caracteres')
], validate, async (req, res) => {
  try { res.status(201).json(await createEntry(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
accountingRouter.delete('/entries/:id', async (req, res) => {
  try { await deleteEntry(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// DRE
accountingRouter.get('/dre', async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    res.json(await getDRE(year));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Standard Costs
accountingRouter.get('/standard-costs', async (_req, res) => {
  try { res.json(await listStandardCosts()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
accountingRouter.put('/standard-costs/:productId', async (req, res) => {
  try { res.json(await upsertStandardCost(req.params.productId, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
