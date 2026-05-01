import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { entityRouteGuard } from '../../infra/entity-permissions.js';
import { fornecedoresRouter } from './fornecedores.routes.js';

export function registerFornecedoresModule(app: Express) {
  app.use('/api/compras/fornecedores', authenticate, entityRouteGuard('fornecedor'), fornecedoresRouter);
}

