import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { metaCodeRouter } from './meta-code.routes.js';

export function registerMetaCodeModule(app: Express) {
  app.use('/api/meta-code', authenticate, metaCodeRouter);
}
