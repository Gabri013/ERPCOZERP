import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './fiscal.service.js';

export const fiscalRouter = Router();
fiscalRouter.use(authenticate);

const gate = requirePermission(['ver_fiscal']);

fiscalRouter.get('/nfes', gate, async (_req, res) => {
  try {
    const data = await svc.listNfes();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

fiscalRouter.post('/nfes/issue-mock', gate, async (req, res) => {
  try {
    const data = await svc.issueMockNfe({
      customerName: req.body?.customerName,
      totalAmount: req.body?.totalAmount ? Number(req.body.totalAmount) : undefined,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

fiscalRouter.post('/nfes/:id/cancel', gate, async (req, res) => {
  try {
    const data = await svc.cancelNfe(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

fiscalRouter.get('/nfes/consult/:key', gate, async (req, res) => {
  try {
    const data = await svc.consultByKey(req.params.key);
    if (!data) return res.status(404).json({ error: 'NF-e não encontrada' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

fiscalRouter.get('/bloco-k', gate, async (req, res) => {
  try {
    const mes = req.query.mes !== undefined ? Number(req.query.mes) : new Date().getMonth();
    const ano = req.query.ano !== undefined ? Number(req.query.ano) : new Date().getFullYear();
    const data = await svc.getBlocoKData(mes, ano);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

fiscalRouter.get('/sped/export', gate, async (req, res) => {
  const q = z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .safeParse({ from: req.query.from, to: req.query.to });
  if (!q.success) return res.status(400).json({ error: 'Informe from e to (ISO date)' });
  try {
    const from = new Date(q.data.from);
    const to = new Date(q.data.to);
    const out = await svc.exportSpedMock(from, to);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    res.send(out.content);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
