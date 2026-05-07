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

productsRouter.get('/', requirePermission('ver_estoque'), async (req, res) => {
  try {
    const { search, tipo } = req.query;
    const products = await prisma.product.findMany({
      where: {
        ...(search ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { code: { contains: search as string, mode: 'insensitive' } },
          ]
        } : {}),
        ...(tipo ? { type: tipo as string } : {}),
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: products });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

productsRouter.get('/:id', requirePermission('ver_estoque'), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ success: true, data: product });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

productsRouter.post('/', requirePermission('editar_estoque'), async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: req.body,
    });
    res.json({ success: true, data: product });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

productsRouter.put('/:id', requirePermission('editar_estoque'), async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: product });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

productsRouter.delete('/:id', requirePermission('editar_estoque'), async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

productsRouter.get('/by-code/:code/bom', requirePermission('ver_chao_fabrica'), async (req, res) => {
  try {
    const product = await svc.findProductByCode(req.params.code);
    if (!product) return res.json({ success: true, data: { lines: [], bomStatus: 'EMPTY', lineCount: 0 } });
    const lines = await svc.listBomLines(product.id);
    const meta = await prisma.productIndustrialMeta.findUnique({ where: { entityRecordId: product.id } });
    res.json({
      success: true,
      data: {
        lines,
        bomStatus: meta?.bomStatus ?? 'EMPTY',
        lineCount: lines.length,
        productRecordId: product.id,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

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
  '/:id/bom',
  requirePermission('ver_estoque'),
  async (req, res) => {
    try {
      const lines = await svc.listBomLines(req.params.id);
      const meta = await prisma.productIndustrialMeta.findUnique({
        where: { entityRecordId: req.params.id },
      });
      res.json({
        success: true,
        data: {
          lines,
          bomStatus: meta?.bomStatus ?? 'EMPTY',
          lineCount: lines.length,
        },
      });
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
    }
  },
);

productsRouter.put(
  '/:id/bom',
  requirePermission('editar_produtos'),
  async (req, res) => {
    try {
      const lines: Array<{
        componentCode: string;
        description?: string;
        materialSpec?: string;
        process?: string;
        xMm?: number;
        yMm?: number;
        quantity: number;
        totalQty?: number;
      }> = Array.isArray(req.body?.lines) ? req.body.lines : [];

      if (!lines.length) {
        return res.status(400).json({ error: 'Forneça lines[] com ao menos um item' });
      }

      const data = await svc.replaceBomLines(req.params.id, lines, req.user?.userId);
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      res.status(400).json({ error: msg });
    }
  },
);

productsRouter.delete(
  '/:id/bom',
  requirePermission('editar_produtos'),
  async (req, res) => {
    try {
      await svc.clearBomLines(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
    }
  },
);

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
    const catalog = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (catalog) {
      const files = await svc.listCatalogProductFiles(req.params.id);
      return res.json({ success: true, data: files, source: 'catalog' });
    }
    const files = await svc.listTechnicalFiles(req.params.id);
    res.json({ success: true, data: files, source: 'entity_record' });
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
      const catalog = await prisma.product.findUnique({ where: { id: req.params.id } });
      const created = [];
      for (const f of list) {
        if (catalog) {
          const row = await svc.saveCatalogProductUpload({
            catalogProductId: req.params.id,
            originalName: f.originalname,
            buffer: f.buffer,
            userId: req.user?.userId,
          });
          created.push(row);
        } else {
          const row = await svc.saveTechnicalUpload({
            productRecordId: req.params.id,
            originalName: f.originalname,
            buffer: f.buffer,
            userId: req.user?.userId,
          });
          created.push(row);
        }
      }
      res.status(201).json({ success: true, data: created, source: catalog ? 'catalog' : 'entity_record' });
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Upload falhou' });
    }
  },
);

productsRouter.get('/product-files/:fileId/raw', requirePermission('ver_estoque'), async (req, res) => {
  const row = await prisma.productFile.findUnique({ where: { id: req.params.fileId } });
  if (!row) return res.status(404).json({ error: 'Arquivo não encontrado' });
  const abs = svc.resolveCatalogProductFileAbsPath(row);
  try {
    await fs.access(abs);
  } catch {
    return res.status(404).json({ error: 'Arquivo ausente no disco' });
  }
  res.setHeader('Content-Type', row.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.originalName)}"`);
  res.sendFile(abs);
});

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
