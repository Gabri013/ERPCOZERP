import type { Express } from 'express';
import { cozincaRouter } from './cozinca.routes.js';

export function registerCozincaModule(app: Express) {
  app.use('/api/cozinca', cozincaRouter);
}
