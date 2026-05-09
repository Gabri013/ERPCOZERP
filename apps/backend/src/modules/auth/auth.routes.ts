import { Router, type Request, type Response } from 'express';
import { body } from 'express-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import rateLimit from 'express-rate-limit';

import { prisma } from '../../infra/prisma.js';
import { env } from '../../config/env.js';
import { roleCodesFromUserRoleRows } from '../../lib/roleOrder.js';
import { getEffectivePermissionCodesForUserId } from '../../lib/effectivePermissions.js';
import { logInfo } from '../../infra/logger.js';
import { logAudit } from '../../infra/logger.js';
import { validate } from '../../middleware/validate.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post('/login', loginRateLimit, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
], validate, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: { role: true },
        },
        company: true,
      },
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const roles = roleCodesFromUserRoleRows(user.roles);
    const permissions = await getEffectivePermissionCodesForUserId(user.id);
    const secret = env.JWT_SECRET || process.env.JWT_SECRET || 'dev_change_me';
    const expiresIn = env.JWT_EXPIRES_IN;

    const token = jwt.sign(
      { sub: user.id, email: user.email, roles, permissions, companyId: user.companyId },
      secret as jwt.Secret,
      { expiresIn: expiresIn as SignOptions['expiresIn'] }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
    });

    // Detecção de sessão suspeita
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const activeSessions = await prisma.userSession.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() }
      },
      select: { ipAddress: true, lastActivityAt: true }
    });

    const previousIPs = activeSessions.map(s => s.ipAddress).filter(ip => ip && ip !== clientIP);
    const lastLogin = user.lastLoginAt;
    const timeSinceLastLogin = lastLogin ? Date.now() - lastLogin.getTime() : Infinity;

    if (previousIPs.length > 0 && timeSinceLastLogin < 5 * 60 * 1000) { // 5 minutos
      await logAudit('SUSPICIOUS_LOGIN', user.id, {
        newIp: clientIP,
        previousIps: previousIPs,
        timeSinceLastLogin: Math.floor(timeSinceLastLogin / 1000)
      });
    }

    return res.json({
      success: true,
      token,
      accessToken: token,
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        sector: user.sector ?? null,
        roles,
      },
    });
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      logInfo('[auth/login] base de dados indisponível', err);
      return res.status(503).json({
        error:
          'Servidor de base de dados indisponível. Confirme que o PostgreSQL está a correr e que DATABASE_URL em apps/backend/.env está correto.',
      });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError && ['P2021', 'P2010', 'P2022'].includes(err.code)) {
      logInfo('[auth/login] schema Prisma desatualizado ou em falta', { code: err.code });
      return res.status(503).json({
        error:
          'Base de dados sem tabelas ou desatualizada. Na pasta apps/backend execute: npx prisma migrate dev',
      });
    }

    const message = err instanceof Error ? err.message : String(err);
    logInfo('[auth/login] erro interno', { message, stack: err instanceof Error ? err.stack : undefined });

    return res.status(500).json({
      error: 'Erro interno ao iniciar sessão.',
      ...(env.NODE_ENV !== 'production' && { detail: message }),
    });
  }
});

function isDatabaseUnavailable(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1000', 'P1001', 'P1002', 'P1003', 'P1017'].includes(err.code);
  }
  if (!(err instanceof Error)) return false;
  return /Can't reach database|connection refused|ECONNREFUSED|P1001/i.test(err.message);
}

