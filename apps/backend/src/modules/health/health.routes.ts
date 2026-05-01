import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { env } from '../../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  let postgres = 'down';

  try {
    await prisma.$queryRaw`SELECT 1`;
    postgres = 'ok';
  } catch {
    postgres = 'down';
  }

  // Redis entra na próxima etapa (fila/cache); aqui só validamos que o env existe
  const redis = env.REDIS_URL ? 'configured' : 'disabled';

  res.json({
    ok: true,
    service: 'erpcoz-backend-core',
    env: env.NODE_ENV,
    postgres,
    redis,
    timestamp: new Date().toISOString(),
  });
});

