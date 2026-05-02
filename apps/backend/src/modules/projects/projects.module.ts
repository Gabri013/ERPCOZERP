import type { Express } from 'express';
import { projectsRouter } from './projects.routes.js';

export function registerProjectsModule(app: Express) {
  app.use('/api/projects', projectsRouter);
}
