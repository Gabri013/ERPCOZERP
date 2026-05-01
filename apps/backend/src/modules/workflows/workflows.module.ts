import type { Express } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { workflowsRouter } from './workflows.routes.js';

export function registerWorkflowsModule(app: Express) {
  app.use('/api/workflows', authenticate, requirePermission('record.manage'), workflowsRouter);
}

