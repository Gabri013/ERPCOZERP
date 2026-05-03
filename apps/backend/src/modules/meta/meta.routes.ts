import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { createMeta, deleteMeta, listMeta, updateMeta, type MetaKind } from './meta.service.js';

export const metaRouter = Router();

const KINDS = new Set<MetaKind>(['config', 'field', 'layout', 'workflow', 'theme']);
const adminGate = requirePermission(['editar_config']);

function parseKind(v: unknown): MetaKind {
  const k = String(v || '').trim() as MetaKind;
  if (!KINDS.has(k)) throw new Error('kind inválido ou ausente');
  return k;
}

function metaReadGate(req: Request, res: Response, next: NextFunction) {
  try {
    const kind = parseKind(req.query.kind);
    if (kind === 'field' && String(req.query.includeInactive || '') !== '1') return next();
    return adminGate(req, res, next);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
}

const postBodySchema = z.object({
  kind: z.enum(['config', 'field', 'layout', 'workflow', 'theme']),
  payload: z.record(z.string(), z.unknown()),
});

metaRouter.get('/', authenticate, metaReadGate, async (req, res) => {
  try {
    const kind = parseKind(req.query.kind);
    const q = req.query as Record<string, string | undefined>;
    const items = await listMeta(kind, q);
    res.json({ success: true, data: { items } });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

metaRouter.post('/', authenticate, adminGate, async (req, res) => {
  const parsed = postBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Corpo inválido', details: parsed.error.flatten() });
  }
  try {
    const row = await createMeta(parsed.data.kind, parsed.data.payload as Record<string, unknown>);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Registo duplicado (chave única).' });
    }
    res.status(400).json({ error: msg });
  }
});

metaRouter.put('/:id', authenticate, adminGate, async (req, res) => {
  let kind: MetaKind;
  try {
    kind = parseKind(req.query.kind);
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'kind inválido' });
  }
  const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
  try {
    const row = await updateMeta(kind, req.params.id, body);
    res.json({ success: true, data: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    if (msg === 'id inválido') return res.status(400).json({ error: msg });
    if (msg.includes('Record to update not found')) return res.status(404).json({ error: 'Não encontrado' });
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Registo duplicado (chave única).' });
    }
    res.status(400).json({ error: msg });
  }
});

metaRouter.delete('/:id', authenticate, adminGate, async (req, res) => {
  let kind: MetaKind;
  try {
    kind = parseKind(req.query.kind);
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'kind inválido' });
  }
  try {
    await deleteMeta(kind, req.params.id);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    if (msg === 'id inválido') return res.status(400).json({ error: msg });
    if (msg.includes('Record to delete does not exist')) return res.status(404).json({ error: 'Não encontrado' });
    res.status(400).json({ error: msg });
  }
});
