import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../infra/prisma.js';

export const usersRouter = Router();

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  password: z.string().min(6),
  roles: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  roles: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

usersRouter.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { roles: { include: { role: true } } },
    take: 200,
  });

  res.json({
    success: true,
    data: users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.fullName,
      active: u.active,
      roles: u.roles.map((r) => r.role.code),
      created_at: u.createdAt,
    })),
  });
});

usersRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const hash = await bcrypt.hash(parsed.data.password, 12);
  const created = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: hash,
      fullName: parsed.data.full_name,
      active: parsed.data.active ?? true,
      emailVerified: true,
    },
  });

  const roles = parsed.data.roles || [];
  for (const roleCode of roles) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: created.id, roleId: role.id } },
      update: {},
      create: { userId: created.id, roleId: role.id, assignedBy: req.user?.userId },
    });
  }

  res.status(201).json({ success: true, data: { id: created.id } });
});

usersRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });

  const data: any = {};
  if (parsed.data.full_name !== undefined) data.fullName = parsed.data.full_name;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({ where: { id }, data });

  if (parsed.data.roles) {
    const roles = await prisma.role.findMany({ where: { code: { in: parsed.data.roles } } });
    await prisma.userRole.deleteMany({ where: { userId: id } });
    for (const role of roles) {
      await prisma.userRole.create({ data: { userId: id, roleId: role.id, assignedBy: req.user?.userId } });
    }
  }

  res.json({ success: true });
});

usersRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });

  // evita auto-deletar a si mesmo
  if (req.user?.userId && req.user.userId === id) {
    return res.status(400).json({ error: 'Não é permitido remover o próprio usuário' });
  }

  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

