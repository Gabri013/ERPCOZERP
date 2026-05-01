import type { Express } from 'express';
import { healthRouter } from './health.routes.js';

export function registerHealthModule(app: Express) {
  app.use('/health', healthRouter);
  app.use('/api/health', healthRouter);
}

