import { prisma } from '../../infra/prisma.js';
import type { Prisma } from '@prisma/client';

export async function listCrmProcesses(filters: { type?: string; stage?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.type) where.type = filters.type;
  if (filters.stage) where.stage = filters.stage;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { clientName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.crmProcess.findMany({
    where,
    include: { notes: { orderBy: { createdAt: 'desc' }, take: 5 }, attachments: true },
    orderBy: { openedAt: 'desc' },
  });
}

export async function getCrmProcess(id: string) {
  return prisma.crmProcess.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: 'desc' } }, attachments: true },
  });
}

export async function createCrmProcess(data: {
  type: string;
  title: string;
  clientName: string;
  responsible?: string;
  stage?: string;
  value?: number;
  probability?: number;
  priority?: string;
  origin?: string;
  forecastAt?: string;
  customFields?: Prisma.InputJsonValue;
}) {
  return prisma.crmProcess.create({ data: data as Prisma.CrmProcessUncheckedCreateInput });
}

export async function updateCrmProcess(id: string, data: Partial<{
  type: string;
  title: string;
  clientName: string;
  responsible: string;
  stage: string;
  value: number;
  probability: number;
  priority: string;
  origin: string;
  forecastAt: string;
  linkedOrderId: string;
  customFields: Prisma.InputJsonValue;
}>) {
  return prisma.crmProcess.update({ where: { id }, data: data as Prisma.CrmProcessUncheckedUpdateInput });
}

export async function changeCrmProcessStage(id: string, stage: string) {
  return prisma.crmProcess.update({ where: { id }, data: { stage } });
}

export async function deleteCrmProcess(id: string) {
  return prisma.crmProcess.delete({ where: { id } });
}

export async function addCrmNote(processId: string, data: { userName?: string; noteType?: string; content: string }) {
  return prisma.crmProcessNote.create({ data: { processId, ...data } });
}

export async function addCrmAttachment(processId: string, data: { fileName: string; fileSize?: string; fileType?: string; path?: string }) {
  return prisma.crmProcessAttachment.create({ data: { processId, ...data } });
}

export async function getCrmDashboard() {
  const [total, byStage, byType, recentNotes] = await Promise.all([
    prisma.crmProcess.count(),
    prisma.crmProcess.groupBy({ by: ['stage'], _count: true }),
    prisma.crmProcess.groupBy({ by: ['type'], _count: true }),
    prisma.crmProcessNote.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);
  return { total, byStage, byType, recentNotes };
}
