import type { Express } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { rolesRouter } from './roles.routes.js';

export function registerRolesModule(app: Express) {
  app.use('/api/roles', authenticate, requirePermission(['user.manage', 'editar_config']), rolesRouter);
}
