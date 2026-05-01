import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { recordsRouter } from './records.routes.js';

export function registerRecordsModule(app: Express) {
  // A autorização por entidade/ação fica dentro do router.
  // Isso permite liberar leitura/apontamento de Produção sem dar CRUD genérico (record.manage) para operadores.
  app.use('/api/records', authenticate, recordsRouter);
}

