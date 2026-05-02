import { Router } from 'express';

import { prisma } from '../../infra/prisma.js';

import { sortRolesByPriority } from '../../lib/roleOrder.js';

import { requirePermission } from '../../middleware/auth.js';



export const permissionsRouter = Router();



async function computeEffectiveForUserId(userId: string) {

  const roles = await prisma.userRole.findMany({

    where: { userId },

    include: { role: true },

  });



  const roleIds = roles.map((r) => r.roleId);

  const roleCodes = sortRolesByPriority(roles.map((r) => r.role.code));



  if (roleCodes.includes('master')) {

    const allPerms = await prisma.permission.findMany({ where: { active: true } });

    return {

      user: { id: userId, roles: roleCodes },

      permissions: allPerms.map((p) => p.code),

      modules: { all: true as const },

    };

  }



  const rolePerms = await prisma.rolePermission.findMany({

    where: { roleId: { in: roleIds }, granted: true, permission: { active: true } },

    include: { permission: true },

  });



  const permissions = Array.from(new Set(rolePerms.map((rp) => rp.permission.code)));



  const modules = {

    vendas: permissions.some((p) => p.startsWith('vendas.') || p.includes('vendas') || p.includes('cliente')),

    compras: permissions.some((p) => p.startsWith('compras.') || p.includes('compras') || p.includes('oc')),

    estoque: permissions.some((p) => p.startsWith('estoque.') || p.includes('estoque') || p.includes('produto') || p.includes('mov')),

    financeiro: permissions.some((p) => p.startsWith('financeiro.') || p.includes('financeiro')),

    producao: permissions.some((p) => p.startsWith('producao.') || p.includes('producao') || p.includes('op')),

    rh: permissions.some((p) => p.startsWith('rh.') || p.includes('rh') || p.includes('funcionario')),

    configuracoes: permissions.some(

      (p) => p.includes('entity') || p.includes('permission') || p.includes('role') || p.includes('user'),

    ),

  };



  return {

    user: { id: userId, roles: roleCodes },

    permissions,

    modules,

  };

}



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

});



permissionsRouter.get(
  '/users/:userId/effective',
  requirePermission(['user.manage', 'editar_config', 'gerenciar_usuarios']),
  async (req, res) => {

  const exists = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true } });

  if (!exists) return res.status(404).json({ error: 'Usuário não encontrado' });

  const data = await computeEffectiveForUserId(req.params.userId);

  res.json({ success: true, data });

});


