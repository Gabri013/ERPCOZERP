import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './fiscal.service.js';
import * as nfeSvc from './nfe.service.js';

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

fiscalRouter.post('/nfe', gate, async (req, res) => {
  try {
    const result = await nfeSvc.emitirNFe(req.body);
    // Salvar referencia no FiscalNfe
    await svc.saveNfeReference(result.referencia, result);
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro ao emitir NF-e' });
  }
});

fiscalRouter.get('/nfe/:id', gate, async (req, res) => {
  try {
    const result = await nfeSvc.consultarNFe(req.params.id);
    // Atualizar status no FiscalNfe
    await svc.updateNfeStatus(req.params.id, result);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro ao consultar NF-e' });
  }
});

fiscalRouter.delete('/nfe/:id', gate, async (req, res) => {
  try {
    const justificativa = req.body.justificativa;
    const result = await nfeSvc.cancelarNFe(req.params.id, justificativa);
    // Atualizar status no FiscalNfe
    await svc.updateNfeCancel(req.params.id, justificativa);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro ao cancelar NF-e' });
  }
});

fiscalRouter.get('/nfe/:id/xml', gate, async (req, res) => {
  try {
    const xml = await nfeSvc.downloadXML(req.params.id);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}.xml"`);
    res.send(xml);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro ao baixar XML' });
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
      ano: z.string().transform(Number),
      mes: z.string().transform(Number),
    })
    .safeParse({ ano: req.query.ano, mes: req.query.mes });
  if (!q.success) return res.status(400).json({ error: 'Informe ano e mes' });
  try {
    const { ano, mes } = q.data;
    const content = await svc.exportSped(ano, mes);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="SPED_EFD_${ano}${mes.toString().padStart(2, '0')}.txt"`);
    res.send(content);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
