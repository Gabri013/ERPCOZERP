import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { notificationsRouter } from './notifications.routes.js';

export function registerNotificationsModule(app: Express) {
  app.use('/api/notifications', authenticate, notificationsRouter);
}

