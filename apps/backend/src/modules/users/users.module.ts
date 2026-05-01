import type { Express } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { usersRouter } from './users.routes.js';

export function registerUsersModule(app: Express) {
  app.use('/api/users', authenticate, requirePermission('user.manage'), usersRouter);
}

