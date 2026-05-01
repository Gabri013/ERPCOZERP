import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { prisma } from '../../infra/prisma.js';
import { env } from '../../config/env.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user || !user.active) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const roles = user.roles.map((ur) => ur.role.code);
  const secret = env.JWT_SECRET || process.env.JWT_SECRET || 'dev_change_me';
  const expiresIn = env.JWT_EXPIRES_IN;

  const token = jwt.sign(
    { sub: user.id, email: user.email, roles },
    secret as jwt.Secret,
    { expiresIn: expiresIn as any }
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
  });

  return res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, full_name: user.fullName, roles },
  });
});

