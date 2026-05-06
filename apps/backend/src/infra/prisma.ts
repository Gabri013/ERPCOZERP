import { env } from '../config/env.js';
import { PrismaClient } from '@prisma/client';

if (env.DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.DATABASE_URL;
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Apply Prisma middleware to enforce companyId where applicable
import { applyPrismaMiddleware } from './prisma.middleware.js';
applyPrismaMiddleware(prisma);

