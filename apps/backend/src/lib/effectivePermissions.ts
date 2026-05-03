import { prisma } from '../infra/prisma.js';
import { sortRolesByPriority } from './roleOrder.js';
import { listUserGrantCodesRaw } from './userPermissionGrantsRaw.js';

type GrantRow = { permission: { code: string; active: boolean } };

/** Extras por usuário: ORM se disponível; senão SQL direto (tabela migrada + client antigo). */
export async function getUserExtraPermissionCodes(userId: string): Promise<string[]> {
  const delegate = (prisma as { userPermissionGrant?: { findMany: (args: unknown) => Promise<GrantRow[]> } })
    .userPermissionGrant;

  if (delegate?.findMany) {
    try {
      const rows = await delegate.findMany({
        where: { userId, permission: { active: true } },
        include: { permission: true },
      });
      return rows.map((g) => g.permission.code);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[effectivePermissions] ORM grants falhou, a usar SQL bruto:', msg);
      }
    }
  }

  const raw = await listUserGrantCodesRaw(userId);
  return raw ?? [];
}

export type EffectiveUserPayload = {
  user: { id: string; roles: string[] };
  permissions: string[];
  modules:
    | { all: true }
    | {
        vendas: boolean;
        compras: boolean;
        estoque: boolean;
        financeiro: boolean;
        producao: boolean;
        rh: boolean;
        configuracoes: boolean;
      };
};

/** Permissões efetivas (papéis + extras por usuário + master), alinhadas ao `/api/permissions/me`. */
export async function computeEffectiveForUserId(userId: string): Promise<EffectiveUserPayload> {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  const roleIds = roles.map((r) => r.roleId);
  const roleCodes = sortRolesByPriority(
    roles.map((r) => r.role?.code).filter((c): c is string => typeof c === 'string' && c.length > 0),
  );

  if (roleCodes.includes('master')) {
    const allPerms = await prisma.permission.findMany({ where: { active: true } });
    return {
      user: { id: userId, roles: roleCodes },
      permissions: allPerms.map((p) => p.code),
      modules: { all: true as const },
    };
  }

  const rolePerms =
    roleIds.length === 0
      ? []
      : await prisma.rolePermission.findMany({
          where: { roleId: { in: roleIds }, granted: true, permission: { active: true } },
          include: { permission: true },
        });

  const fromGrants = await getUserExtraPermissionCodes(userId);

  const fromRoles = rolePerms.map((rp) => rp.permission.code);
  const permissions = Array.from(new Set([...fromRoles, ...fromGrants]));

  const modules = {
    vendas: permissions.some((p) => p.startsWith('vendas.') || p.includes('vendas') || p.includes('cliente')),
    compras: permissions.some((p) => p.startsWith('compras.') || p.includes('compras') || p.includes('oc')),
    estoque: permissions.some((p) => p.startsWith('estoque.') || p.includes('estoque') || p.includes('produto') || p.includes('mov')),
    financeiro: permissions.some((p) => p.startsWith('financeiro.') || p.includes('financeiro')),
    producao: permissions.some((p) => p.startsWith('producao.') || p.includes('producao') || p.includes('op')),
    rh: permissions.some((p) => p.startsWith('rh.') || p.includes('rh') || p.includes('funcionario')),
    configuracoes: permissions.some((p) => p.includes('entity') || p.includes('permission') || p.includes('role') || p.includes('user')),
  };

  return {
    user: { id: userId, roles: roleCodes },
    permissions,
    modules,
  };
}

export async function getEffectivePermissionCodesForUserId(userId: string): Promise<string[]> {
  const e = await computeEffectiveForUserId(userId);
  return e.permissions;
}
