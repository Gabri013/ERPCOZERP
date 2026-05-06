import { Router } from 'express';
import { body } from 'express-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from 'express';
import { prisma } from '../../infra/prisma.js';
import { roleCodesFromUserRoleRows } from '../../lib/roleOrder.js';
import { requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

export const usersRouter = Router();

/** List/create/delete and non-password updates — matches UI “Gerenciar usuários”. */
const manageUsersGate: RequestHandler = requirePermission(['user.manage', 'gerenciar_usuarios']);
const manageUsersStrictGate: RequestHandler = requirePermission('user.manage');

function wantsPasswordChange(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const p = (body as Record<string, unknown>).password;
  return typeof p === 'string' && p.length > 0;
}

/** Password change requires `user.manage`; other fields allow `gerenciar_usuarios`. */
const putUserPermissionGate: RequestHandler = (req, res, next) => {
  const mw = wantsPasswordChange(req.body) ? manageUsersStrictGate : manageUsersGate;
  return mw(req, res, next);
};

async function replaceUserRoles(userId: string, roleCodes: string[], assignedBy?: string) {
  const roles = await prisma.role.findMany({ where: { code: { in: roleCodes } } });
  await prisma.userRole.deleteMany({ where: { userId } });
  for (const role of roles) {
    await prisma.userRole.create({
      data: { userId, roleId: role.id, assignedBy },
    });
  }
}

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

const rolesOnlySchema = z.object({
  roles: z.array(z.string()).min(1, 'Selecione ao menos um papel.'),
});

usersRouter.get('/', manageUsersGate, async (req, res) => {
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
      roles: roleCodesFromUserRoleRows(u.roles),
      created_at: u.createdAt,
    })),
  });
});

usersRouter.post('/', manageUsersGate, [
  body('email').isEmail().normalizeEmail().custom(async (email) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email já cadastrado');
    return true;
  }),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('full_name').trim().isLength({ min: 2 }).withMessage('Nome completo deve ter pelo menos 2 caracteres'),
  body('role').isIn(['admin', 'manager', 'user', 'viewer']).withMessage('Role inválido')
], validate, async (req, res) => {
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

/** Assign roles only (same gate as manage users; no password / profile fields). */
usersRouter.put('/:id/roles', manageUsersGate, async (req, res) => {
  const { id } = req.params;
  const parsed = rolesOnlySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });

  await replaceUserRoles(id, parsed.data.roles, req.user?.userId);
  res.json({ success: true });
});

usersRouter.put('/:id', putUserPermissionGate, async (req, res) => {
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
    await replaceUserRoles(id, parsed.data.roles, req.user?.userId);
  }

  res.json({ success: true });
});

usersRouter.delete('/:id', manageUsersGate, async (req, res) => {
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

