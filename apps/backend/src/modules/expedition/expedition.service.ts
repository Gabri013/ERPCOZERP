import { prisma } from '../../infra/prisma.js';
import type { Prisma } from '@prisma/client';

export async function listExpeditionOrders(filters: { status?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { clientName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.expeditionOrder.findMany({
    where,
    include: {
      loads: true,
      _count: { select: { manifests: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getExpeditionOrder(id: string) {
  return prisma.expeditionOrder.findUnique({
    where: { id },
    include: { loads: true, manifests: true },
  });
}

export async function createExpeditionOrder(data: {
  code: string;
  clientName: string;
  saleOrderId?: string;
  scheduledAt?: string;
  carrier?: string;
  notes?: string;
  items?: Prisma.InputJsonValue;
}) {
  return prisma.expeditionOrder.create({ data: data as Prisma.ExpeditionOrderUncheckedCreateInput });
}

export async function updateExpeditionOrder(id: string, data: Partial<{
  status: string;
  carrier: string;
  scheduledAt: string;
  shippedAt: string;
  notes: string;
  items: Prisma.InputJsonValue;
}>) {
  return prisma.expeditionOrder.update({ where: { id }, data: data as Prisma.ExpeditionOrderUncheckedUpdateInput });
}

export async function deleteExpeditionOrder(id: string) {
  return prisma.expeditionOrder.delete({ where: { id } });
}

export async function addLoad(orderId: string, data: {
  code: string;
  loadType?: string;
  description?: string;
  weight?: number;
  items?: Prisma.InputJsonValue;
}) {
  const load = await prisma.expeditionLoad.create({ data: { orderId, ...data } as Prisma.ExpeditionLoadUncheckedCreateInput });
  await prisma.expeditionOrder.update({
    where: { id: orderId },
    data: { status: 'em_separacao' },
  });
  return load;
}

export async function updateLoad(id: string, data: Partial<{ loadType: string; description: string; weight: number; items: Prisma.InputJsonValue }>) {
  return prisma.expeditionLoad.update({ where: { id }, data });
}

export async function deleteLoad(id: string) {
  return prisma.expeditionLoad.delete({ where: { id } });
}

export async function listManifests(filters: { status?: string; orderId?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.orderId) where.orderId = filters.orderId;
  return prisma.expeditionManifest.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createManifest(orderId: string, data: {
  code: string;
  carrier?: string;
  driverName?: string;
  vehiclePlate?: string;
  loads?: Prisma.InputJsonValue;
  nfeRef?: string;
}) {
  const manifest = await prisma.expeditionManifest.create({ data: { orderId, ...data } as Prisma.ExpeditionManifestUncheckedCreateInput });
  await prisma.expeditionOrder.update({ where: { id: orderId }, data: { status: 'carregado' } });
  return manifest;
}

export async function updateManifest(id: string, data: Partial<{
  status: string;
  carrier: string;
  driverName: string;
  vehiclePlate: string;
  nfeRef: string;
  issuedAt: string;
}>) {
  return prisma.expeditionManifest.update({ where: { id }, data });
}

export async function getExpeditionStats() {
  const [total, byStatus] = await Promise.all([
    prisma.expeditionOrder.count(),
    prisma.expeditionOrder.groupBy({ by: ['status'], _count: true }),
  ]);
  return { total, byStatus };
}
