import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { estoqueRouter } from './estoque.routes.js';

export function registerEstoqueModule(app: Express) {
  app.use('/api/estoque', authenticate, estoqueRouter);
}
