/** Mesma precedência que apps/backend/src/lib/roleOrder.ts — manter em sync */
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
];

export function sortRolesByPriority(codes) {
  if (!codes?.length) return [];
  const rank = (c) => {
    const i = ROLE_PRIORITY_ORDER.indexOf(c);
    return i === -1 ? 999 : i;
  };
  return [...new Set(codes)].sort((a, b) => rank(a) - rank(b));
}

/** Papel único a usar em UI quando há várias roles */
export function primaryRole(codes) {
  const sorted = sortRolesByPriority(codes);
  return sorted[0] || 'user';
}
