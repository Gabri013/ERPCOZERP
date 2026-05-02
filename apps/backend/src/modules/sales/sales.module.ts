import type { Express } from 'express';
import { salesRouter } from './sales.routes.js';

export function registerSalesModule(app: Express) {
  app.use('/api/sales', salesRouter);
}
