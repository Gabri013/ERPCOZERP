import type { AuthUser } from '../../middleware/auth.js';

/**
 * Visão completa de pedido (financeiro + operacional + estoque + aprovação).
 * Usa **permissões** do JWT (banco), não códigos de papel — alinhado ao `PermissaoContext`.
 */
export function pedidoVendaSeesFullDetail(user: Pick<AuthUser, 'roles' | 'permissions'> | null | undefined): boolean {
  const roles = user?.roles ?? [];
  const perms = user?.permissions ?? [];
  if (roles.includes('master')) return true;
  return (
    perms.includes('ver_financeiro') ||
    perms.includes('ver_op') ||
    perms.includes('ver_estoque') ||
    perms.includes('aprovar_financeiro')
  );
}

/** Campos que não devem ser aceitos do cliente (margem/custo). */
const SENSITIVE_TOP = new Set([
  'custo_total',
  'margem_bruta',
  'margem_liquida',
  'margem_percentual',
  'margem_pct',
  'lucro_estimado',
  'lucro_bruto',
  'valor_custo',
  'total_custo',
  'preco_custo_total',
  'indice_margem',
  'cmv',
  'markup',
]);

const SENSITIVE_ITEM = new Set([
  'preco_custo',
  'custo_unitario',
  'custo_total',
  'margem',
  'margem_pct',
  'lucro_linha',
]);

/** Remove dados sensíveis de custo/margem — aplicar a todo POST/PUT. */
export function stripCostMarginFromPayload(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const k of SENSITIVE_TOP) delete out[k];
  if (Array.isArray(out.itens)) {
    out.itens = (out.itens as unknown[]).map((row) => {
      if (!row || typeof row !== 'object') return row;
      const it = { ...(row as Record<string, unknown>) };
      for (const k of SENSITIVE_ITEM) delete it[k];
      return it;
    });
  }
  return out;
}

/** Campos ocultos na resposta para perfil só comercial (sem financeiro/op/estoque). */
const HIDDEN_COMMERCIAL_ONLY_TOP = new Set([
  'forma_pagamento',
  'observacoes',
  'vendedor',
  'data_emissao',
]);

export function sanitizePedidoForResponse(
  record: Record<string, unknown>,
  fullDetail: boolean,
): Record<string, unknown> {
  let out = stripCostMarginFromPayload(record);
  if (fullDetail) return out;
  out = { ...out };
  for (const k of HIDDEN_COMMERCIAL_ONLY_TOP) delete out[k];
  return out;
}

/** Em PUT, usuário comercial não pode alterar estes campos — remove do incoming para o merge preservar o existente. */
const PUT_BLOCKED_COMMERCIAL_TOP = new Set([
  'forma_pagamento',
  'observacoes',
  'vendedor',
  'data_emissao',
]);

export function stripCommercialBlockedFromIncoming(
  data: Record<string, unknown>,
  fullDetail: boolean,
): Record<string, unknown> {
  const out = stripCostMarginFromPayload(data);
  if (fullDetail) return out;
  const next = { ...out };
  for (const k of PUT_BLOCKED_COMMERCIAL_TOP) delete next[k];
  return next;
}
