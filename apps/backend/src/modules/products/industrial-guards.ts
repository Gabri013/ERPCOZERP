import { prisma } from '../../infra/prisma.js';

/** Verifica se o produto (por código) pode ser usado em pedido/produção — exige BOM industrial COMPLETE ou legado com bom_json preenchido. */
export async function assertProdutoBomCompletoParaUso(codigo: string): Promise<void> {
  const code = String(codigo || '').trim();
  if (!code || code === 'GEN') return;

  const entity = await prisma.entity.findUnique({ where: { code: 'produto' } });
  if (!entity) return;

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    take: 8000,
  });

  const row = rows.find((r) => String((r.data as Record<string, unknown>).codigo || '') === code);
  if (!row) return;

  const data = row.data as Record<string, unknown>;
  const legacyBom = Array.isArray(data.bom_json) && (data.bom_json as unknown[]).length > 0;

  const meta = await prisma.productIndustrialMeta.findUnique({
    where: { entityRecordId: row.id },
  });

  if (!meta) {
    if (legacyBom) return;
    throw new Error(
      `Produto ${code}: sem BOM de engenharia. Importe a lista no módulo Produto / Engenharia antes de reservar estoque ou gerar OP.`,
    );
  }

  if (meta.bomStatus === 'COMPLETE') return;
  if (legacyBom && meta.bomStatus !== 'EMPTY') return;

  throw new Error(
    `Produto ${code}: BOM incompleta (status ${meta.bomStatus}). Conclua a validação de engenharia antes de continuar.`,
  );
}

export async function assertPedidoItensBomCompleto(itens: unknown): Promise<void> {
  const list = Array.isArray(itens) ? itens : [];
  for (const it of list) {
    const o = it as Record<string, unknown>;
    const cod = String(o.codigo || o.codigoProduto || '').trim();
    if (!cod) continue;
    await assertProdutoBomCompletoParaUso(cod);
  }
}
