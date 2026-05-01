import type { Express } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { adminImpersonationRouter } from './impersonation.routes.js';

export function registerAdminModule(app: Express) {
  app.use('/api/admin', authenticate, requireRole('master'), adminImpersonationRouter);
}

