import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { requirePermission } from '../../middleware/auth.js';
import { getIO } from '../../realtime/io.js';
import { filterNotificationsByUserRole } from './notifications.service.js';

export const notificationsRouter = Router();

notificationsRouter.get('/me', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const limitRaw = Number(req.query.limit || 20);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

  const sectorFilter = typeof req.query.sector === 'string' ? req.query.sector.trim() : '';
  const moduleFilter = typeof req.query.module === 'string' ? req.query.module.trim() : '';

  const roleCodes = Array.isArray(req.user?.roles) ? req.user.roles : [];

  const fetchTake = sectorFilter ? limit : Math.min(limit * 5, 200);

  const rows = await prisma.userNotification.findMany({
    where: {
      userId,
      ...(sectorFilter ? { sector: sectorFilter } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: fetchTake,
  });

  const visible = filterNotificationsByUserRole(rows, roleCodes, {
    module: moduleFilter || null,
  }).slice(0, limit);

  res.json({
    items: visible.map((n) => ({
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

notificationsRouter.post('/', requirePermission('entity.manage'), async (req, res) => {
  const userIdCaller = req.user?.userId;
  if (!userIdCaller) return res.status(401).json({ error: 'Authentication required' });

  const sector = typeof req.body?.sector === 'string' && req.body.sector.trim() ? req.body.sector.trim() : 'Sistema';
  const typeRaw = typeof req.body?.type === 'string' && req.body.type.trim() ? req.body.type.trim() : 'info';
  const text =
    typeof req.body?.text === 'string'
      ? req.body.text.trim()
      : typeof req.body?.title === 'string'
        ? req.body.title.trim()
        : '';

  if (!text) return res.status(400).json({ error: 'text ou title é obrigatório' });

  let targets: string[] = [];
  if (Array.isArray(req.body?.user_ids) && req.body.user_ids.length > 0) {
    targets = req.body.user_ids.map((x: unknown) => String(x)).filter(Boolean);
  } else if (typeof req.body?.user_id === 'string' && req.body.user_id.trim()) {
    targets = [req.body.user_id.trim()];
  } else {
    targets = [userIdCaller];
  }

  const targetRoles = Array.isArray(req.body?.target_roles) ? req.body.target_roles : undefined;
  const targetModule =
    typeof req.body?.target_module === 'string' && req.body.target_module.trim()
      ? req.body.target_module.trim()
      : undefined;

  await prisma.userNotification.createMany({
    data: targets.map((uid) => ({
      userId: uid,
      sector,
      type: typeRaw,
      text,
      ...(targetRoles !== undefined ? { targetRoles } : {}),
      ...(targetModule !== undefined ? { targetModule } : {}),
    })),
  });

  const io = getIO();
  if (io) {
    io.emit('notification_broadcast', { sector, type: typeRaw, text });
    for (const uid of targets) {
      io.to(`user:${uid}`).emit('notification', { sector, type: typeRaw, text });
    }
  }

  res.status(201).json({ success: true, count: targets.length });
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

