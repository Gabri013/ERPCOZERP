import type { Express } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { fornecedoresRouter } from './fornecedores.routes.js';

export function registerFornecedoresModule(app: Express) {
  app.use('/api/compras/fornecedores', authenticate, requirePermission('record.manage'), fornecedoresRouter);
}

