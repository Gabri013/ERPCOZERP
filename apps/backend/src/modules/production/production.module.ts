import type { Express } from 'express';
import { productionRouter, workOrdersRouter } from './production.routes.js';

export function registerProductionModule(app: Express) {
  app.use('/api/work-orders', workOrdersRouter);
  app.use('/api/production', productionRouter);
}
