import type { Express } from 'express';
import { authRouter } from './auth.routes.js';
import { authMeRouter } from './me.routes.js';
import { impersonateRouter } from './impersonate.routes.js';

export function registerAuthModule(app: Express) {
  app.use('/api/auth', authRouter);
  app.use('/api/auth', authMeRouter);
  app.use('/api/auth/impersonate', impersonateRouter);
}


