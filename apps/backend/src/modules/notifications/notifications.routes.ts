import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';

export const notificationsRouter = Router();

notificationsRouter.get('/me', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const limitRaw = Number(req.query.limit || 20);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

  const sector = typeof req.query.sector === 'string' ? req.query.sector.trim() : '';

  const items = await prisma.userNotification.findMany({
    where: {
      userId,
      ...(sector ? { sector } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  res.json({
    items: items.map((n) => ({
      id: n.id,
      sector: n.sector,
      type: n.type,
      text: n.text,
      created_at: n.createdAt,
      read_at: n.readAt,
      read: Boolean(n.readAt),
    })),
  });
});

notificationsRouter.post('/:id/read', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const id = String(req.params.id || '');
  const existing = await prisma.userNotification.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const updated = await prisma.userNotification.update({
    where: { id },
    data: { readAt: existing.readAt ? existing.readAt : new Date() },
  });

  res.json({
    id: updated.id,
    read_at: updated.readAt,
  });
});

notificationsRouter.post('/read-all', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  await prisma.userNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  res.json({ success: true });
});

