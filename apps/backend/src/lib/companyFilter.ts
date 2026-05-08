import type { Request } from 'express';

/**
 * Helper para garantir que queries filtrem por companyId do usuário
 * Uso: where: getCompanyFilter(req)
 */
export function getCompanyFilter(req: Request): { companyId: string } | Record<string, never> {
  if (!req.user?.companyId) {
    return {};
  }
  return { companyId: req.user.companyId };
}

/**
 * Helper para filtrar onde a companyId pode ser optional/nullable
 * Uso em relacionamentos: company: { where: getCompanyFilterOptional(req) }
 */
export function getCompanyFilterOptional(
  req: Request
): { companyId: string } | Record<string, never> {
  if (!req.user?.companyId) {
    return {};
  }
  return { companyId: req.user.companyId };
}

/**
 * Validar que o usuário pertence à empresa antes de atualizar/deletar
 * Retorna true se usuário pode acessar o recurso
 */
export function canAccessCompanyResource(req: Request, resourceCompanyId?: string): boolean {
  // Master pode acessar tudo
  if (req.user?.roles?.includes('master')) {
    return true;
  }

  // Usuário normal pode acessar apenas sua empresa
  if (!resourceCompanyId || !req.user?.companyId) {
    return false;
  }

  return resourceCompanyId === req.user.companyId;
}

/**
 * Middleware para validar companyId em operações de update/delete
 */
export async function validateCompanyAccess(req: Request, resourceCompanyId?: string) {
  if (!canAccessCompanyResource(req, resourceCompanyId)) {
    throw new Error(
      `Acesso negado: você não tem permissão para acessar dados de outra empresa`
    );
  }
}
