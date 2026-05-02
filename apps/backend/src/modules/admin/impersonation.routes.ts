import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../infra/prisma.js';
import { env } from '../../config/env.js';

export const adminImpersonationRouter = Router();

const startSchema = z.object({
  reason: z.string().max(500).optional().default(''),
});

adminImpersonationRouter.post('/impersonate/:userId', async (req, res) => {
  const by = req.user?.userId;
  if (!by) return res.status(401).json({ error: 'Authentication required' });
  if (!req.user?.roles?.includes('master')) return res.status(403).json({ error: 'Forbidden' });

  const targetUserId = String(req.params.userId || '');
  if (!z.string().uuid().safeParse(targetUserId).success) {
    return res.status(400).json({ error: 'userId inválido' });
  }
  const parsed = startSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { roles: { include: { role: true } } },
  });
  if (!target || !target.active) return res.status(404).json({ error: 'Usuário não encontrado' });

  const roles = target.roles.map((ur) => ur.role.code);
  const secret = env.JWT_SECRET || process.env.JWT_SECRET || 'dev_change_me';
  const expiresIn = env.JWT_EXPIRES_IN;

  const token = jwt.sign(
    {
      sub: target.id,
      email: target.email,
      fullName: target.fullName,
      roles,
      impersonation: true,
      impersonatedBy: by,
      reason: parsed.data.reason || '',
    },
    secret as jwt.Secret,
    { expiresIn: expiresIn as any }
  );

  return res.json({
    success: true,
    token,
    user: { id: target.id, email: target.email, full_name: target.fullName, roles },
  });
});

adminImpersonationRouter.post('/stop-impersonate', async (req, res) => {
  // Stateless: frontend restores original token. Endpoint exists to match UI flow.
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  return res.json({ success: true });
});

