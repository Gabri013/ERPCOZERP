import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';

export const permissionsRouter = Router();

permissionsRouter.get('/me', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  const roleIds = roles.map((r) => r.roleId);
  const roleCodes = roles.map((r) => r.role.code);

  if (roleCodes.includes('master')) {
    const allPerms = await prisma.permission.findMany({ where: { active: true } });
    return res.json({
      user: { id: userId, roles: roleCodes },
      permissions: allPerms.map((p) => p.code),
      modules: { all: true },
    });
  }

  const rolePerms = await prisma.rolePermission.findMany({
    where: { roleId: { in: roleIds }, granted: true, permission: { active: true } },
    include: { permission: true },
  });

  const permissions = Array.from(new Set(rolePerms.map((rp) => rp.permission.code)));

  // Mapeamento simples: habilita módulos por prefixo de permissão
  const modules = {
    vendas: permissions.some((p) => p.startsWith('vendas.') || p.includes('vendas') || p.includes('cliente')),
    compras: permissions.some((p) => p.startsWith('compras.') || p.includes('compras') || p.includes('oc')),
    estoque: permissions.some((p) => p.startsWith('estoque.') || p.includes('estoque') || p.includes('produto') || p.includes('mov')),
    financeiro: permissions.some((p) => p.startsWith('financeiro.') || p.includes('financeiro')),
    producao: permissions.some((p) => p.startsWith('producao.') || p.includes('producao') || p.includes('op')),
    rh: permissions.some((p) => p.startsWith('rh.') || p.includes('rh') || p.includes('funcionario')),
    configuracoes: permissions.some((p) => p.includes('entity') || p.includes('permission') || p.includes('role') || p.includes('user')),
  };

  return res.json({
    user: { id: userId, roles: roleCodes },
    permissions,
    modules,
  });
});

