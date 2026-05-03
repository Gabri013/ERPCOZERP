import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { qualityGateRouter } from './quality-gate.routes.js';

export function registerQualityGateModule(app: Express) {
  app.use('/api/quality-gate', authenticate, qualityGateRouter);
}
