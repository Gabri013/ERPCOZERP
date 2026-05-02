import { randomUUID } from 'node:crypto';
import { prisma } from '../../infra/prisma.js';

export async function listNfes() {
  return prisma.fiscalNfe.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
}

export async function issueMockNfe(input: { customerName?: string; totalAmount?: number }) {
  const accessKey = `${Date.now()}`.padStart(44, '0').slice(-44);
  return prisma.fiscalNfe.create({
    data: {
      id: randomUUID(),
      number: String(Math.floor(Math.random() * 999999)),
      series: '1',
      accessKey,
      status: 'AUTORIZADA',
      customerName: input.customerName ?? 'Cliente mock',
      totalAmount: input.totalAmount ?? 100,
      issuedAt: new Date(),
    },
  });
}

export async function cancelNfe(id: string) {
  return prisma.fiscalNfe.update({
    where: { id },
    data: { status: 'CANCELADA', cancelledAt: new Date() },
  });
}

export async function consultByKey(key: string) {
  return prisma.fiscalNfe.findUnique({ where: { accessKey: key } });
}

/** Dados reais para Bloco K (EFD-ICMS/IPI) a partir do banco de dados. */
export async function getBlocoKData(mes: number, ano: number) {
  const dtIni = new Date(ano, mes, 1);
  const dtFin = new Date(ano, mes + 1, 0, 23, 59, 59);

  // K200 — estoque escriturado: saldo atual via ProductLocation
  const locations = await prisma.productLocation.findMany({
    where: { quantity: { gt: 0 } },
    include: { product: { select: { code: true, unit: true } } },
  });
  const k200Map = new Map<string, { codigo: string; unid: string; qtd_final: number }>();
  for (const loc of locations) {
    const key = loc.product.code;
    const prev = k200Map.get(key);
    k200Map.set(key, {
      codigo: key,
      unid: loc.product.unit ?? 'UN',
      qtd_final: (prev?.qtd_final ?? 0) + Number(loc.quantity),
    });
  }
  const k200 = Array.from(k200Map.values()).map((r) => ({ ...r, ind_part: '0' }));

  // K230 — ordens de produção concluídas no período
  const workOrders = await prisma.workOrder.findMany({
    where: { finishedAt: { gte: dtIni, lte: dtFin } },
    include: { product: { select: { code: true, unit: true } } },
  });
  const k230 = workOrders.map((wo) => ({
    cod_op: wo.number,
    codigo_prod: wo.product?.code ?? '',
    unid: wo.product?.unit ?? 'UN',
    qtd_prod: Number(wo.quantityPlanned ?? 0),
    data_ini: (wo.scheduledStart ?? wo.createdAt).toISOString().slice(0, 10),
    data_fin: (wo.finishedAt ?? wo.updatedAt).toISOString().slice(0, 10),
  }));

  // K235 — saídas de estoque (consumo de insumos no período)
  const saidas = await prisma.stockMovement.findMany({
    where: {
      type: 'SAIDA',
      createdAt: { gte: dtIni, lte: dtFin },
    },
    include: { product: { select: { code: true, unit: true } } },
  });
  const k235 = saidas.map((r) => ({
    cod_op: r.reference ?? '',
    data: r.createdAt.toISOString().slice(0, 10),
    codigo_insumo: r.product?.code ?? '',
    qtd_consumida: Math.abs(Number(r.quantity ?? 0)),
    unid: r.product?.unit ?? 'UN',
    qtd_perda: 0,
  }));

  // H010 — inventário (estoque físico para Bloco H)
  const h010 = k200.slice(0, 500).map((p) => ({
    codigo: p.codigo,
    unid: p.unid,
    qtd: p.qtd_final,
    custo_unit: 0,
    ind_part: '0',
  }));

  return { k200, k230, k235, h010, k220: [], k250: [], k255: [], reg0210: [], periodo: { mes, ano, dtIni: dtIni.toISOString(), dtFin: dtFin.toISOString() } };
}

/** Exportação SPED simplificada (texto mock). */
export async function exportSpedMock(from: Date, to: Date) {
  const nfes = await prisma.fiscalNfe.findMany({
    where: { issuedAt: { gte: from, lte: to }, status: 'AUTORIZADA' },
  });
  const lines = nfes.map((n, i) => `|C100|${i + 1}|${n.accessKey ?? ''}|${n.totalAmount ?? 0}|`);
  return {
    filename: `sped_mock_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.txt`,
    content: ['|0000|LEIAUTE MOCK 2026', ...lines].join('\n'),
    count: nfes.length,
  };
}
