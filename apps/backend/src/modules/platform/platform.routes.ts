import { Router } from 'express';
import { z } from 'zod';
import { requirePermission } from '../../middleware/auth.js';
import { getPlatformSettings, updatePlatformSettings } from './platform.service.js';

export const platformRouter = Router();

const gate = requirePermission(['editar_config']);

platformRouter.get('/settings', gate, async (req, res) => {
  try {
    const data = await getPlatformSettings(req.user?.userId);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

const patchSchema = z.object({
  company: z.record(z.string(), z.string()).optional(),
  parametros: z.record(z.string(), z.unknown()).optional(),
  modeloOpHtml: z.string().optional(),
  modeloOpElements: z.array(z.unknown()).optional(),
});

platformRouter.put('/settings', gate, async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  try {
    const data = await updatePlatformSettings(parsed.data, req.user?.userId);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
