import type { NextFunction, Request, Response } from 'express';
import { prisma } from './prisma.js';

export type EntityVerb = 'view' | 'create' | 'edit' | 'delete';

/** Entidades com permissões granulares seeded (suffix .view|.create|.edit|.delete). */
export const GRANULAR_ENTITY_CODES = [
  'cliente',
  'fornecedor',
  'produto',
  'movimentacao_estoque',
  'pedido_venda',
  'orcamento',
  'ordem_compra',
  'tabela_preco',
  'conta_receber',
  'conta_pagar',
  'ordem_producao',
  'apontamento_producao',
  'rh_funcionario',
  'fiscal_nfe',
  'crm_lead',
  'crm_oportunidade',
  'cotacao_compra',
  'historico_op',
  'workflow',
] as const;

const LEGACY: Partial<Record<string, Partial<Record<EntityVerb, readonly string[]>>>> = {
  ordem_producao: {
    view: ['ver_op'],
    create: ['criar_op'],
    edit: ['editar_op'],
    delete: ['editar_op'],
  },
  apontamento_producao: {
    view: ['apontar'],
    create: ['apontar'],
    edit: ['apontar'],
    delete: ['apontar'],
  },
  historico_op: {
    view: ['ver_kanban'],
    create: ['ver_kanban'],
    edit: ['ver_kanban'],
    delete: ['ver_kanban'],
  },
  pedido_venda: {
    view: ['ver_pedidos'],
    create: ['criar_pedidos'],
    edit: ['editar_pedidos'],
    delete: ['editar_pedidos'],
  },
  cliente: {
    view: ['ver_clientes'],
    create: ['editar_clientes'],
    edit: ['editar_clientes'],
    delete: ['editar_clientes'],
  },
  orcamento: {
    view: ['ver_orcamentos'],
    create: ['criar_orcamentos'],
    edit: ['criar_orcamentos'],
    delete: ['criar_orcamentos'],
  },
  movimentacao_estoque: {
    view: ['ver_estoque'],
    create: ['movimentar_estoque'],
    edit: ['movimentar_estoque'],
    delete: ['movimentar_estoque'],
  },
  produto: {
    view: ['ver_estoque'],
    create: ['editar_produtos'],
    edit: ['editar_produtos'],
    delete: ['editar_produtos'],
  },
  fornecedor: {
    view: ['ver_compras'],
    create: ['editar_fornecedores'],
    edit: ['editar_fornecedores'],
    delete: ['editar_fornecedores'],
  },
  ordem_compra: {
    view: ['ver_compras'],
    create: ['criar_oc'],
    edit: ['criar_oc'],
    delete: ['criar_oc'],
  },
  conta_receber: {
    view: ['ver_financeiro'],
    create: ['editar_financeiro'],
    edit: ['editar_financeiro'],
    delete: ['aprovar_financeiro', 'editar_financeiro'],
  },
  conta_pagar: {
    view: ['ver_financeiro'],
    create: ['editar_financeiro'],
    edit: ['editar_financeiro'],
    delete: ['aprovar_financeiro', 'editar_financeiro'],
  },
  rh_funcionario: {
    view: ['ver_rh'],
    create: ['editar_funcionarios'],
    edit: ['editar_funcionarios'],
    delete: ['editar_funcionarios'],
  },
  fiscal_nfe: {
    view: ['ver_fiscal'],
    create: ['ver_fiscal', 'record.manage'],
    edit: ['ver_fiscal', 'record.manage'],
    delete: ['ver_fiscal', 'record.manage'],
  },
  crm_lead: {
    view: ['ver_crm'],
    create: ['ver_crm', 'record.manage'],
    edit: ['ver_crm', 'record.manage'],
    delete: ['ver_crm', 'record.manage'],
  },
  workflow: {
    view: ['record.manage'],
    create: ['record.manage'],
    edit: ['record.manage'],
    delete: ['record.manage'],
  },
  tabela_preco: {
    view: ['ver_orcamentos'],
    create: ['criar_orcamentos'],
    edit: ['criar_orcamentos'],
    delete: ['criar_orcamentos'],
  },
  crm_oportunidade: {
    view: ['ver_crm'],
    create: ['ver_crm', 'record.manage'],
    edit: ['ver_crm', 'record.manage'],
    delete: ['ver_crm', 'record.manage'],
  },
  cotacao_compra: {
    view: ['ver_compras'],
    create: ['criar_oc'],
    edit: ['criar_oc'],
    delete: ['criar_oc'],
  },
};

async function permissionGranted(userId: string, permissionCode: string): Promise<boolean> {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true, role: { select: { code: true } } },
  });

  if (roles.some((r) => r.role.code === 'master')) return true;
  const roleIds = roles.map((r) => r.roleId);
  if (!roleIds.length) return false;

  const row = await prisma.rolePermission.findFirst({
    where: {
      roleId: { in: roleIds },
      granted: true,
      permission: { code: permissionCode, active: true },
    },
    select: { id: true },
  });
  return Boolean(row);
}

function methodToVerb(method: string): EntityVerb {
  const m = method.toUpperCase();
  if (m === 'POST') return 'create';
  if (m === 'PUT' || m === 'PATCH') return 'edit';
  if (m === 'DELETE') return 'delete';
  return 'view';
}

/**
 * Verifica acesso ao CRUD dinâmico (/api/records e equivalentes por entidade).
 * Ordem: master (JWT ou DB) → permissão granular → record.manage → legado vendas/PCP/etc.
 */
export async function checkEntityRecordsAccess(
  userId: string | undefined,
  jwtRoles: string[] | undefined,
  entityCode: string,
  verb: EntityVerb
): Promise<boolean> {
  if (!userId) return false;
  const rolesJwt = jwtRoles || [];
  if (rolesJwt.includes('master')) return true;

  const granular = `${entityCode}.${verb}`;
  if (await permissionGranted(userId, granular)) return true;
  if (await permissionGranted(userId, 'record.manage')) return true;

  const fallback = LEGACY[entityCode]?.[verb];
  if (fallback) {
    for (const code of fallback) {
      if (await permissionGranted(userId, code)) return true;
    }
  }

  return false;
}

export function entityRouteGuard(entityCode: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
      try {
        if (req.method === 'OPTIONS' || req.method === 'HEAD') {
          return next();
        }
        if (!req.user) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }
        const verb = methodToVerb(req.method);
        const ok = await checkEntityRecordsAccess(req.user.userId, req.user.roles, entityCode, verb);
        if (!ok) {
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
        next();
      } catch (e) {
        next(e);
      }
    })();
  };
}
