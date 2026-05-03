import { sortRolesByPriority } from './roleOrder.js';

/**
 * Orçamentista / vendedor só enxerga PVs em que é responsável (`owner_user_id`).
 * Demais perfis com `ver_pedidos` veem a carteira completa.
 */
export function saleOrdersRestrictedToOwner(roles: string[]): boolean {
  if (!roles?.length) return false;
  if (roles.includes('master')) return false;
  const primary = sortRolesByPriority(roles)[0];
  return primary === 'orcamentista_vendas';
}
