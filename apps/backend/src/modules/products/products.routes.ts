import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { prisma } from '../../infra/prisma.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './products.service.js';

export const productsRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 85 * 1024 * 1024, files: 24 },
});

function mimeFor(p: string) {
  const e = path.extname(p).toLowerCase();
  const m: Record<string, string> = {
    '.stl': 'model/stl',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.obj': 'model/obj',
    '.pdf': 'application/pdf',
    '.dxf': 'application/dxf',
  };
  return m[e] || 'application/octet-stream';
}

productsRouter.use(authenticate);

productsRouter.get('/pending-bom', requirePermission('ver_roteiros'), async (_req, res) => {
  try {
    const data = await svc.listPendingBomProducts();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

productsRouter.get('/files/:fileId/raw', requirePermission('ver_estoque'), async (req, res) => {
  const row = await prisma.technicalFile.findUnique({ where: { id: req.params.fileId } });
  if (!row) return res.status(404).json({ error: 'Arquivo não encontrado' });
  const abs = svc.resolveStoredFilePath(row.caminhoArquivo);
  try {
    await fs.access(abs);
  } catch {
    return res.status(404).json({ error: 'Arquivo ausente no disco' });
  }
  res.setHeader('Content-Type', mimeFor(row.caminhoArquivo));
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.nomeOriginal)}"`);
  res.sendFile(abs);
});

productsRouter.get(
  '/by-op/:opRecordId/files',
  requirePermission('ver_chao_fabrica'),
  async (req, res) => {
    const files = await svc.listTechnicalFilesForOp(req.params.opRecordId);
    res.json({ success: true, data: files });
  },
);

productsRouter.post(
  '/:id/bom/import',
  requirePermission('editar_produtos'),
  async (req, res) => {
    try {
      const csvText = String(req.body?.csvText || req.body?.text || req.body?.spreadsheet || '');
      const dryRun = Boolean(req.body?.dryRun);
      if (!csvText.trim()) {
        return res.status(400).json({ error: 'Envie csvText (ou text) com a planilha' });
      }
      const out = await svc.importBomForProduct(req.params.id, csvText, req.user?.userId, dryRun);
      res.json({ success: true, data: out });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro na importação';
      res.status(400).json({ error: msg });
    }
  },
);

productsRouter.put('/:id/bom-status', requirePermission('editar_produtos'), async (req, res) => {
  try {
    const status = String(req.body?.status || req.body?.bomStatus || '');
    const data = await svc.updateBomStatus(req.params.id, status, req.user?.userId);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

productsRouter.get(
  '/:id/bom/lines',
  requirePermission('ver_estoque'),
  async (req, res) => {
    const lines = await svc.listBomLines(req.params.id);
    res.json({ success: true, data: lines });
  },
);

productsRouter.get(
  '/:id/files',
  requirePermission('ver_estoque'),
  async (req, res) => {
    const files = await svc.listTechnicalFiles(req.params.id);
    res.json({ success: true, data: files });
  },
);

productsRouter.post(
  '/:id/files',
  requirePermission('editar_produtos'),
  upload.array('files', 20),
  async (req, res) => {
    try {
      const list = req.files as Array<{ originalname: string; buffer: Buffer }> | undefined;
      if (!list?.length) return res.status(400).json({ error: 'Nenhum arquivo' });
      const created = [];
      for (const f of list) {
        const row = await svc.saveTechnicalUpload({
          productRecordId: req.params.id,
          originalName: f.originalname,
          buffer: f.buffer,
          userId: req.user?.userId,
        });
        created.push(row);
      }
      res.status(201).json({ success: true, data: created });
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Upload falhou' });
    }
  },
);

productsRouter.post(
  '/:id/model3d',
  requirePermission('editar_produtos'),
  upload.single('file'),
  async (req, res) => {
    try {
      const f = req.file;
      if (!f) return res.status(400).json({ error: 'Arquivo 3D obrigatório' });
      const data = await svc.attachProductModel3d(req.params.id, f.originalname, f.buffer, req.user?.userId);
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Upload falhou' });
    }
  },
);

productsRouter.get('/:id/model3d', requirePermission('ver_estoque'), async (req, res) => {
  try {
    const info = await svc.getProductModel3dInfo(req.params.id);
    if (!info) return res.status(404).json({ error: 'Modelo 3D não cadastrado' });
    res.setHeader('Content-Type', mimeFor(info.path));
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(info.originalName)}"`);
    res.sendFile(info.absolutePath);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
