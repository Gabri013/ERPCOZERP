import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { platformRouter } from './platform.routes.js';

export function registerPlatformModule(app: Express) {
  app.use('/api/platform', authenticate, platformRouter);
}
