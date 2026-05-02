import type { Express } from 'express';
import { hrRouter } from './hr.routes.js';

export function registerHrModule(app: Express) {
  app.use('/api/hr', hrRouter);
}
