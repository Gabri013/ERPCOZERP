/**
 * Ordem de precedência para UI e JWT: papel “principal” primeiro.
 * Quando um utilizador tem várias roles no `user_roles`, sem isto `roles[0]` é arbitrário.
 */
export const ROLE_PRIORITY_ORDER = [
  'master',
  'gerente',
  'gerente_producao',
  'financeiro',
  'orcamentista_vendas',
  'projetista',
  'corte_laser',
  'dobra_montagem',
  'solda',
  'expedicao',
  'qualidade',
  'rh',
  'user',
] as const;

export function sortRolesByPriority(codes: string[]): string[] {
  if (!codes?.length) return [];
  const rank = (c: string) => {
    const i = ROLE_PRIORITY_ORDER.indexOf(c as (typeof ROLE_PRIORITY_ORDER)[number]);
    return i === -1 ? 999 : i;
  };
  return [...new Set(codes)].sort((a, b) => rank(a) - rank(b));
}

/** Extrai códigos de papel a partir do include Prisma `roles.role`, ignorando vínculos órfãos. */
export function roleCodesFromUserRoleRows(
  rows: Array<{ role: { code: string } | null } | null> | null | undefined,
): string[] {
  const codes = (rows ?? [])
    .map((r) => r?.role?.code)
    .filter((c): c is string => typeof c === 'string' && c.length > 0);
  return sortRolesByPriority(codes);
}
