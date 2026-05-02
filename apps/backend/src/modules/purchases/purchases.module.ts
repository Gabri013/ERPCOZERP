import type { Express } from 'express';
import { purchasesRouter } from './purchases.routes.js';

export function registerPurchasesModule(app: Express) {
  app.use('/api/purchases', purchasesRouter);
}
