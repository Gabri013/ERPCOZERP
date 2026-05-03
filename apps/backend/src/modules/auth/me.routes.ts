import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { roleCodesFromUserRoleRows } from '../../lib/roleOrder.js';

export const authMeRouter = Router();

authMeRouter.get('/me', authenticate, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId || !z.string().uuid().safeParse(userId).success) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.active) return res.status(401).json({ error: 'Authentication required' });

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      sector: user.sector ?? null,
      roles: roleCodesFromUserRoleRows(user.roles),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.error('[auth/me]', message, e instanceof Prisma.PrismaClientKnownRequestError ? e.code : '');

    if (e instanceof Prisma.PrismaClientKnownRequestError && ['P2021', 'P2022', 'P2010'].includes(e.code)) {
      return res.status(503).json({
        error: 'Esquema da base de dados desatualizado. Execute na pasta apps/backend: npx prisma migrate deploy',
        ...(env.NODE_ENV !== 'production' && { code: e.code, detail: message }),
      });
    }

    res.status(500).json({
      error: 'Falha ao carregar utilizador.',
      ...(env.NODE_ENV !== 'production' && { detail: message }),
    });
  }
});

authMeRouter.post('/logout', authenticate, async (req, res) => {
  // Por enquanto não há blacklist de token. Logout é client-side (remove token).
  res.json({ success: true });
});

