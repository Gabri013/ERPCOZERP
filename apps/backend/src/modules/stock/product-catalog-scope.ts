import type { Prisma } from '@prisma/client';

/**
 * Tipos de produto tratados como insumo / matéria-prima — fora da visão comercial (pronta entrega).
 * Valores alinhados ao seed e ao campo `product_type` livre no cadastro.
 */
const EXCLUDED_EXAMPLES = ['Insumo', 'Matéria-Prima', 'Matéria Prima', 'Materia-Prima', 'Materia Prima'] as const;

function norm(s: string) {
  return s.trim().toLowerCase();
}

/** Indica se o tipo não deve aparecer na lista de estoque comercial nem ser cadastrado pelo perfil comercial. */
export function isExcludedSalesCatalogProductType(productType: string | null | undefined): boolean {
  if (productType == null || !String(productType).trim()) return false;
  const n = norm(String(productType));
  return (EXCLUDED_EXAMPLES as readonly string[]).some((ex) => norm(ex) === n);
}

/** Restringe Prisma a itens vendáveis (exclui insumo / matéria-prima por igualdade case-insensitive). */
export function prismaWhereSalesCatalogOnly(): Prisma.ProductWhereInput {
  return {
    AND: (EXCLUDED_EXAMPLES as readonly string[]).map((ex) => ({
      OR: [{ productType: null }, { NOT: { productType: { equals: ex, mode: 'insensitive' as const } } }],
    })),
  };
}
