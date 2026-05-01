import type { Express } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { ordensCompraRouter } from './ordens-compra.routes.js';

export function registerOrdensCompraModule(app: Express) {
  app.use('/api/compras/ordens-compra', authenticate, requirePermission('record.manage'), ordensCompraRouter);
}

