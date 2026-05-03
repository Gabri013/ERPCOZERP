import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.js';

export const qualityGateRouter = Router();

const gate = requirePermission(['editar_config']);

const REPORT = path.join(
  fileURLToPath(new URL('../../../../reports/quality-gate-last.json', import.meta.url)),
);

qualityGateRouter.get('/report', gate, (_req, res) => {
  try {
    if (!fs.existsSync(REPORT)) {
      return res.json({
        success: true,
        message: 'Execute `npm run quality:gate` na raiz do monorepo para gerar reports/quality-gate-last.json.',
        data: null,
      });
    }
    const raw = fs.readFileSync(REPORT, 'utf8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Erro ao ler relatório' });
  }
});
