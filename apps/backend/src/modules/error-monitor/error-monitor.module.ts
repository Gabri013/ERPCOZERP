import type { Express, NextFunction, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { errorMonitorRouter } from './error-monitor.routes.js';
import { enqueueFromHttpError } from './error-monitor.service.js';

export function registerErrorMonitorModule(app: Express) {
  app.use('/api/error-monitor', authenticate, errorMonitorRouter);
}

/**
 * Handler Express 4 args — deve ser registado **depois** de todas as rotas.
 * Não altera regras de negócio: apenas regista 5xx na fila e devolve JSON genérico.
 */
export function attachErrorMonitorExpressHandler(app: Express) {
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    const status =
      err && typeof err === 'object' && 'status' in err && typeof (err as { status?: unknown }).status === 'number'
        ? (err as { status: number }).status
        : err && typeof err === 'object' && 'statusCode' in err && typeof (err as { statusCode?: unknown }).statusCode === 'number'
          ? (err as { statusCode: number }).statusCode
          : 500;

    if (status >= 500) {
      void enqueueFromHttpError(req, err, status);
    }

    if (res.headersSent) {
      return next(err);
    }

    const message = err instanceof Error ? err.message : 'Erro interno';
    res.status(status).json({ error: message });
  });
}
