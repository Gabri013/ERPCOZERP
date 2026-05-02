import type { Express } from 'express';
import { stockRouter } from './stock.routes.js';

export function registerStockModule(app: Express) {
  app.use('/api/stock', stockRouter);
}
