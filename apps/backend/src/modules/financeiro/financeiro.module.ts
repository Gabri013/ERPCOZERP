import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { contasRouter } from './contas.routes.js';

export function registerFinanceiroModule(app: Express) {
  app.use('/api/financeiro', authenticate, contasRouter);
}

