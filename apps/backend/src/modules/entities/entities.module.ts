import type { Express } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { entitiesRouter } from './entities.routes.js';

export function registerEntitiesModule(app: Express) {
  app.use('/api/entities', authenticate, requirePermission('entity.manage'), entitiesRouter);
}

