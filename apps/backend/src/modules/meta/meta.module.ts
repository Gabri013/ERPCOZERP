import type { Express } from 'express';
import { metaRouter } from './meta.routes.js';

export function registerMetaModule(app: Express) {
  app.use('/api/meta', metaRouter);
}
