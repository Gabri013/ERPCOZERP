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
