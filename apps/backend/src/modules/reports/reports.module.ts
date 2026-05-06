import type { Express } from 'express';
import { reportsRouter } from './reports.routes.js';

export function registerReportsModule(app: Express) {
  app.use('/api/reports', reportsRouter);
}