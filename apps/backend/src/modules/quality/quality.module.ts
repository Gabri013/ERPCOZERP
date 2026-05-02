import type { Express } from 'express';
import { qualityRouter } from './quality.routes.js';

export function registerQualityModule(app: Express) {
  app.use('/api/quality', qualityRouter);
}
