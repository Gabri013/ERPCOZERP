import type { Request } from 'express';
import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import * as svc from './stock.service.js';
import { isExcludedSalesCatalogProductType } from './product-catalog-scope.js';
import { cache } from '../../lib/cache.js';
import {
  createInventoryCountSchema,
  createLocationSchema,
  createMovementSchema,
  createProductSchema,
  listMovementsQuerySchema,
  listProductsQuerySchema,
  patchInventoryCountSchema,
  patchInventoryItemSchema,
  updateLocationSchema,
  updateProductSchema,
} from './stock.schemas.js';

export const stockRouter = Router();

stockRouter.use(authenticate);

/** Perfil comercial: vê catálogo para venda sem permissão operacional de estoque — lista só produtos pronta entrega (sem insumo/MP). */
function isSalesCatalogOnlyUser(req: Request): boolean {
  if (!req.user?.permissions?.length) return false;
  if (req.user.roles?.includes('master')) return false;
  const p = req.user.permissions;
  return p.includes('produto.view') && !p.includes('ver_estoque');
}

function handleError(res: import('express').Response, e: unknown) {
  const msg = e instanceof Error ? e.message : 'Erro interno';
  if (msg.includes('Sem permissão')) {
    return res.status(403).json({ error: msg });
  }
  if (
    msg.includes('não encontrad') ||
    msg.includes('já em uso') ||
    msg.includes('insuficiente') ||
    msg.includes('Tipo não permitido')
  ) {
    return res.status(400).json({ error: msg });
  }
  return res.status(500).json({ error: msg });
}

stockRouter.get(
  '/products',
  requirePermission(['produto.view', 'ver_estoque']),
  async (req, res) => {
    const parsed = listProductsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Parâmetros inválidos', details: parsed.error.flatten() });
    }
    try {
      const { search, status, take, skip } = parsed.data;
      const salesCatalogOnly = isSalesCatalogOnlyUser(req);

      // Cache only if no search or status filters
      if (!search && !status) {
        const cacheKey = `stock:products:${salesCatalogOnly}:${take || 'default'}:${skip || 0}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
          return res.json(cached);
        }
      }

      const data = await svc.listProducts({ ...parsed.data, salesCatalogOnly });

      const response = { success: true, data };
      if (!search && !status) {
        const cacheKey = `stock:products:${salesCatalogOnly}:${take || 'default'}:${skip || 0}`;
        await cache.set(cacheKey, response, { ttl: 300 }); // 5 minutes
      }

      res.json(response);
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.post(
  '/products',
  requirePermission(['produto.create', 'editar_produtos']),
  async (req, res) => {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    try {
      let body = parsed.data;
      if (isSalesCatalogOnlyUser(req)) {
        if (isExcludedSalesCatalogProductType(body.productType ?? null)) {
          return res.status(400).json({
            error:
              'Tipo não permitido para cadastro comercial. Cadastre apenas produtos para venda (ex.: Produto ou Serviço), não insumos ou matéria-prima.',
          });
        }
        body = {
          ...body,
          productType: body.productType?.trim() ? body.productType : 'Produto',
        };
      }
      const data = await svc.createProduct(body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.get(
  '/products/:id',
  requirePermission(['produto.view', 'ver_estoque']),
  async (req, res) => {
    try {
      const salesCatalogOnly = isSalesCatalogOnlyUser(req);
      const data = await svc.getProductById(req.params.id, { salesCatalogOnly });
      if (!data) return res.status(404).json({ error: 'Produto não encontrado' });
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.patch(
  '/products/:id',
  requirePermission(['produto.update', 'editar_produtos']),
  async (req, res) => {
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    try {
      const salesCatalogOnly = isSalesCatalogOnlyUser(req);
      const data = await svc.updateProduct(req.params.id, parsed.data, { salesCatalogOnly });
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.delete(
  '/products/:id',
  requirePermission(['produto.delete', 'editar_produtos']),
  async (req, res) => {
    try {
      const data = await svc.inactivateProduct(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.get(
  '/movements',
  requirePermission(['movimentacao.view', 'ver_estoque']),
  async (req, res) => {
    const parsed = listMovementsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Parâmetros inválidos', details: parsed.error.flatten() });
    }
    try {
      const data = await svc.listMovements(parsed.data);
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.post(
  '/movements',
  requirePermission(['movimentacao.create', 'movimentar_estoque']),
  async (req, res) => {
    const parsed = createMovementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    try {
      const data = await svc.createMovement({
        ...parsed.data,
        userId: req.user?.userId,
      });
      res.status(201).json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.get(
  '/locations',
  requirePermission(['enderecamento.view', 'ver_estoque']),
  async (_req, res) => {
    try {
      const data = await svc.listLocations();
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.post(
  '/locations',
  requirePermission(['enderecamento.manage', 'editar_produtos']),
  async (req, res) => {
    const parsed = createLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    try {
      const data = await svc.createLocation(parsed.data);
      res.status(201).json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.patch(
  '/locations/:id',
  requirePermission(['enderecamento.manage', 'editar_produtos']),
  async (req, res) => {
    const parsed = updateLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    try {
      const data = await svc.updateLocation(req.params.id, parsed.data);
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.delete(
  '/locations/:id',
  requirePermission(['enderecamento.manage', 'editar_produtos']),
  async (req, res) => {
    try {
      await svc.deleteLocation(req.params.id);
      res.json({ success: true });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.get(
  '/product-locations',
  requirePermission(['produto.view', 'ver_estoque']),
  async (req, res) => {
    const productId = typeof req.query.productId === 'string' ? req.query.productId : '';
    if (!productId) return res.status(400).json({ error: 'productId é obrigatório' });
    try {
      const data = await svc.listProductLocations(productId);
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.get(
  '/inventory-counts',
  requirePermission(['inventario.view', 'ver_estoque']),
  async (_req, res) => {
    try {
      const data = await svc.listInventoryCounts();
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.post(
  '/inventory-counts',
  requirePermission(['inventario.create', 'movimentar_estoque']),
  async (req, res) => {
    const parsed = createInventoryCountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    try {
      const data = await svc.createInventoryCount(parsed.data);
      res.status(201).json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.get(
  '/inventory-counts/:id',
  requirePermission(['inventario.view', 'ver_estoque']),
  async (req, res) => {
    try {
      const data = await svc.getInventoryCount(req.params.id);
      if (!data) return res.status(404).json({ error: 'Inventário não encontrado' });
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.patch(
  '/inventory-counts/:id',
  requirePermission(['inventario.create', 'movimentar_estoque']),
  async (req, res) => {
    const parsed = patchInventoryCountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    try {
      const data = await svc.patchInventoryCount(req.params.id, parsed.data);
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.patch(
  '/inventory-counts/items/:itemId',
  requirePermission(['inventario.create', 'movimentar_estoque']),
  async (req, res) => {
    const parsed = patchInventoryItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }
    try {
      const data = await svc.patchInventoryItem(req.params.itemId, { ...parsed.data, qtyCounted: parsed.data.qtyCounted ?? 0 } as any);
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);

stockRouter.post(
  '/inventory-counts/:id/approve',
  requirePermission(['inventario.approve', 'movimentar_estoque']),
  async (req, res) => {
    try {
      const data = await svc.approveInventoryCount(req.params.id, req.user?.userId);
      res.json({ success: true, data });
    } catch (e) {
      handleError(res, e);
    }
  },
);
