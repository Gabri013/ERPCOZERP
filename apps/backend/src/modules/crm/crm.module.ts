import type { Express } from 'express';
import { crmRouter } from './crm.routes.js';

export function registerCrmModule(app: Express) {
  app.use('/api/crm', crmRouter);
}
