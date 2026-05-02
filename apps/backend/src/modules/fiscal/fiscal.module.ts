import type { Express } from 'express';
import { fiscalRouter } from './fiscal.routes.js';

export function registerFiscalModule(app: Express) {
  app.use('/api/fiscal', fiscalRouter);
}
