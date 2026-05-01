import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { entityRouteGuard } from '../../infra/entity-permissions.js';
import { ordensCompraRouter } from './ordens-compra.routes.js';

export function registerOrdensCompraModule(app: Express) {
  app.use('/api/compras/ordens-compra', authenticate, entityRouteGuard('ordem_compra'), ordensCompraRouter);
}

