import type { Express } from 'express';
import { expeditionRouter } from './expedition.routes.js';

export function registerExpeditionModule(app: Express) {
  app.use('/api/expedition', expeditionRouter);
}
