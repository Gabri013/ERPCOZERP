import type { Express } from 'express';
import { crmProcessesRouter } from './crm-processes.routes.js';

export function registerCrmProcessesModule(app: Express) {
  app.use('/api/crm-processes', crmProcessesRouter);
}
