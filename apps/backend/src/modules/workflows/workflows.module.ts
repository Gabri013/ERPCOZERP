import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { entityRouteGuard } from '../../infra/entity-permissions.js';
import { workflowsRouter } from './workflows.routes.js';

export function registerWorkflowsModule(app: Express) {
  app.use('/api/workflows', authenticate, entityRouteGuard('workflow'), workflowsRouter);
}

