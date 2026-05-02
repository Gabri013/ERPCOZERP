import type { Express } from 'express';
import { accountingRouter } from './accounting.routes.js';

export function registerAccountingModule(app: Express) {
  app.use('/api/accounting', accountingRouter);
}
