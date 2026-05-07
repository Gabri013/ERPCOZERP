import { env } from '../config/env.js';
import { PrismaClient } from '@prisma/client';
import { applyPrismaMiddleware } from './prisma.middleware.js';

if (env.DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.DATABASE_URL;
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const basePrisma =
  global.__prisma ??
  new PrismaClient({
    log: ['error'],
  });

const prisma = applyPrismaMiddleware(basePrisma) as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export { prisma };

