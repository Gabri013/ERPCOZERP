import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { permissionsRouter } from './permissions.routes.js';

export function registerPermissionsModule(app: Express) {
  app.use('/api/permissions', authenticate, permissionsRouter);
}

