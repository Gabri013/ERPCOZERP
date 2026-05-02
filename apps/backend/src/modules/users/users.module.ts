import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { usersRouter } from './users.routes.js';

/** Permissions are enforced per route in `users.routes.ts` (manage users vs password change). */
export function registerUsersModule(app: Express) {
  app.use('/api/users', authenticate, usersRouter);
}

