import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { sortRolesByPriority } from '../../lib/roleOrder.js';

export const authMeRouter = Router();

authMeRouter.get('/me', authenticate, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

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
    roles: sortRolesByPriority(user.roles.map((r) => r.role.code)),
  });
});

authMeRouter.post('/logout', authenticate, async (req, res) => {
  // Por enquanto não há blacklist de token. Logout é client-side (remove token).
  res.json({ success: true });
});

