import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { searchRouter } from './search.routes.js';

export function registerSearchModule(app: Express) {
  app.use('/api/search', authenticate, searchRouter);
}
