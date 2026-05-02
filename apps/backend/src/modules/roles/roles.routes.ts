import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';

export const rolesRouter = Router();

rolesRouter.get('/', async (_req, res) => {
  const rows = await prisma.role.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true, description: true },
  });
  res.json({ success: true, data: rows });
});
