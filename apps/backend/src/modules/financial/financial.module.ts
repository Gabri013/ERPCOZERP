import type { Express } from 'express';
import { financialRouter } from './financial.routes.js';

export function registerFinancialModule(app: Express) {
  app.use('/api/financial', financialRouter);
}
