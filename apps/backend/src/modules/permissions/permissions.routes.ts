import { Router } from 'express';
import { z } from 'zod';

import { computeEffectiveForUserId, getUserExtraPermissionCodes } from '../../lib/effectivePermissions.js';
import {
  deleteAllUserGrantsRaw,
  replaceUserGrantCodesRaw,
  userPermissionGrantsTableExists,
} from '../../lib/userPermissionGrantsRaw.js';
import { prisma } from '../../infra/prisma.js';

import { requirePermission } from '../../middleware/auth.js';

export const permissionsRouter = Router();

const grantsPutSchema = z.object({
  codes: z.array(z.string()),
});

permissionsRouter.get('/me', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const data = await computeEffectiveForUserId(userId);
  return res.json(data);
});

permissionsRouter.get(
  '/catalog',
  requirePermission(['user.manage', 'editar_config', 'gerenciar_usuarios']),
  async (_req, res) => {
    const rows = await prisma.permission.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
      select: { id: true, code: true, name: true, category: true, description: true, type: true },
    });

    const byCategory: Record<string, typeof rows> = {};

    for (const p of rows) {
      const c = p.category || 'outros';
      if (!byCategory[c]) byCategory[c] = [];
      byCategory[c].push(p);
    }

    res.json({ success: true, data: { flat: rows, byCategory } });
  },
);

permissionsRouter.get(
  '/users/:userId/effective',
  requirePermission(['user.manage', 'editar_config', 'gerenciar_usuarios']),
  async (req, res) => {
    const exists = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true } });

    if (!exists) return res.status(404).json({ error: 'Usuário não encontrado' });

    const data = await computeEffectiveForUserId(req.params.userId);

    res.json({ success: true, data });
  },
);

/** Permissões atribuídas diretamente ao usuário (além dos papéis). */
permissionsRouter.get(
  '/users/:userId/grants',
  requirePermission(['user.manage', 'gerenciar_usuarios']),
  async (req, res) => {
    const { userId } = req.params;
    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Usuário não encontrado' });

    const codes = await getUserExtraPermissionCodes(userId);
    res.json({ success: true, data: { codes } });
  },
);

permissionsRouter.put(
  '/users/:userId/grants',
  requirePermission(['user.manage', 'gerenciar_usuarios']),
  async (req, res) => {
    const { userId } = req.params;
    const parsed = grantsPutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido', details: parsed.error.flatten() });
    }

    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Usuário não encontrado' });

    const tableOk = await userPermissionGrantsTableExists();
    if (!tableOk) {
      return res.status(503).json({
        error:
          'Tabela user_permission_grants não encontrada. Na pasta apps/backend execute: npx prisma migrate deploy e reinicie o servidor.',
      });
    }

    const uniqueCodes = [...new Set(parsed.data.codes.map((c) => String(c || '').trim()).filter(Boolean))];
    if (uniqueCodes.length === 0) {
      const cleared = await deleteAllUserGrantsRaw(userId);
      if (!cleared.ok) {
        return res.status(503).json({
          error: 'Não foi possível limpar permissões extras.',
        });
      }
      return res.json({ success: true, data: { codes: [] } });
    }

    const perms = await prisma.permission.findMany({
      where: { code: { in: uniqueCodes }, active: true },
      select: { id: true, code: true },
    });
    const found = new Set(perms.map((p) => p.code));
    const missing = uniqueCodes.filter((c) => !found.has(c));
    if (missing.length) {
      return res.status(400).json({
        error: 'Alguns códigos não existem no catálogo ou estão inativos.',
        missing,
      });
    }

    const replaced = await replaceUserGrantCodesRaw(
      userId,
      perms.map((p) => p.id),
      req.user?.userId ?? null,
    );
    if (!replaced.ok) {
      return res.status(503).json({
        error: 'Não foi possível gravar permissões extras.',
      });
    }

    res.json({ success: true, data: { codes: perms.map((p) => p.code) } });
  },
);
