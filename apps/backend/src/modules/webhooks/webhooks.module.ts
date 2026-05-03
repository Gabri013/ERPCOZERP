import type { Express } from 'express';
import express from 'express';
import { metaWebhookRouter } from './meta.routes.js';

export function registerWebhooksModule(app: Express) {
  const r = express.Router();
  r.use(express.json({ limit: '2mb' }));
  r.use(metaWebhookRouter);
  app.use('/api/webhooks', r);
}
