import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { env } from '../../config/env.js';
import { redisPingDetailed } from '../../infra/redis-health.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  let postgres = 'down';

  if (env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      postgres = 'ok';
    } catch {
      postgres = 'down';
    }
  } else {
    postgres = 'missing';
  }

  const redis = env.REDIS_URL ? 'configured' : 'disabled';

  res.status(200).json({
    ok: true,
    service: 'erpcoz-backend-core',
    env: env.NODE_ENV,
    postgres,
    redis,
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return res.status(503).json({ ok: false, postgres: false, redis: false, prisma_migrations: null });
  }

  let latest: { migration_name?: string | null; finished_at?: Date | string | null } | null = null;
  let migrationCount = 0;

  try {
    const counted = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL AND finished_at IS NOT NULL;
    `;
    migrationCount = Number(counted?.[0]?.count ?? 0);

    const rows = await prisma.$queryRaw<
      Array<{ migration_name?: string | null; finished_at?: Date | string | null }>
    >`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL AND finished_at IS NOT NULL
      ORDER BY finished_at DESC
      LIMIT 1;
    `;
    latest = rows?.[0] ?? null;
  } catch {
    latest = null;
    migrationCount = 0;
  }

  if (migrationCount < 1) {
    return res.status(503).json({
      ok: false,
      postgres: true,
      prisma_migrations: null,
      message: 'Nenhuma migração aplicada',
    });
  }

  let redis: { ok: boolean; detail: string };
  if (env.REDIS_URL) {
    redis = await redisPingDetailed();
    if (!redis.ok) {
      return res.status(503).json({
        ok: false,
        postgres: true,
        redis,
        prisma_migrations: {
          migration_name: latest?.migration_name,
          finished_at: latest?.finished_at,
          total: migrationCount,
        },
        message: 'Redis indisponível',
      });
    }
  } else {
    // Sem REDIS_URL: não falha readiness (Redis é opcional até ser configurado).
    redis = { ok: true, detail: 'skipped_no_redis_url' };
  }

  return res.status(200).json({
    ok: true,
    postgres: true,
    redis,
    prisma_migrations: {
      migration_name: latest?.migration_name,
      finished_at: latest?.finished_at,
      total: migrationCount,
    },
  });
});
