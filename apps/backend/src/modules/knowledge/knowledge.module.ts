import type { Express } from 'express';
import { knowledgeRouter } from './knowledge.routes.js';

export function registerKnowledgeModule(app: Express) {
  app.use('/api/knowledge', knowledgeRouter);
}
