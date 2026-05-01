import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { dashboardRouter } from './dashboard.routes.js';

export function registerDashboardModule(app: Express) {
  app.use('/api/dashboard', authenticate, dashboardRouter);
}

