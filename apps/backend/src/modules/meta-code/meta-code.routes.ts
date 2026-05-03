import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import {
  getRuleByEntity,
  listCategoriesActive,
  listCategoriesAll,
  upsertCategory,
  upsertRule,
} from './meta-code.service.js';

export const metaCodeRouter = Router();
const admin = requirePermission(['editar_config']);

metaCodeRouter.get('/categories', async (_req, res) => {
  try {
    const items = await listCategoriesActive();
    res.json({ success: true, data: { items } });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

metaCodeRouter.get('/categories/all', admin, async (_req, res) => {
  try {
    const items = await listCategoriesAll();
    res.json({ success: true, data: { items } });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

const catPutSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(16),
  label: z.string().min(1).max(128),
  color: z.string().min(4).max(16),
  textColor: z.string().min(4).max(16),
  icon: z.string().max(64).nullable().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

metaCodeRouter.put('/categories', authenticate, admin, async (req, res) => {
  const parsed = catPutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const row = await upsertCategory(parsed.data);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

const rulePutSchema = z.object({
  entity: z.string().min(1).max(64),
  prefix: z.string().min(1).max(16),
  categoriaField: z.string().max(64).nullable().optional(),
  useYear: z.boolean().optional(),
  useMonth: z.boolean().optional(),
  sequencePadding: z.number().int().min(1).max(12).optional(),
  resetType: z.enum(['year', 'month', 'never']).optional(),
  format: z.enum(['CAT_PREFIX_YM_SEQ', 'PREFIX_CAT_YM_SEQ', 'PREFIX_YEAR_SEQ']).optional(),
  targetField: z.string().max(32).optional(),
  fallbackCategoryCode: z.string().max(16).optional(),
  active: z.boolean().optional(),
});

metaCodeRouter.put('/rules', admin, async (req, res) => {
  const parsed = rulePutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const row = await upsertRule(parsed.data);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

metaCodeRouter.get('/rules/:entity', admin, async (req, res) => {
  try {
    const row = await getRuleByEntity(req.params.entity);
    if (!row) return res.status(404).json({ error: 'Regra não encontrada' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
