import { prisma } from '../../infra/prisma.js';
import type { Prisma } from '@prisma/client';

export async function listProjects(filters: { status?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { clientName: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.project.findMany({
    where,
    include: {
      tasks: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { timeEntries: true, costEntries: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { sortOrder: 'asc' } },
      timeEntries: { orderBy: { workDate: 'desc' } },
      costEntries: { orderBy: { entryDate: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function createProject(data: {
  code: string;
  name: string;
  clientName: string;
  linkedOrderId?: string;
  startDate?: string;
  dueDate?: string;
  status?: string;
  revenue?: number;
  budgetedCost?: number;
  responsible?: string;
  description?: string;
  team?: Prisma.InputJsonValue;
}) {
  return prisma.project.create({ data: data as Prisma.ProjectUncheckedCreateInput });
}

export async function updateProject(id: string, data: Partial<{
  name: string;
  clientName: string;
  linkedOrderId: string;
  startDate: string;
  dueDate: string;
  status: string;
  progress: number;
  revenue: number;
  budgetedCost: number;
  responsible: string;
  description: string;
  team: Prisma.InputJsonValue;
}>) {
  return prisma.project.update({ where: { id }, data: data as Prisma.ProjectUncheckedUpdateInput });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

export async function addProjectTask(projectId: string, data: {
  name: string;
  level?: number;
  durationDays?: number;
  startOffset?: number;
  progress?: number;
  responsible?: string;
  predecessor?: number;
  hoursPlanned?: number;
  sortOrder?: number;
}) {
  return prisma.projectTask.create({ data: { projectId, ...data } });
}

export async function updateProjectTask(taskId: string, data: Partial<{
  name: string;
  progress: number;
  hoursReal: number;
  responsible: string;
}>) {
  return prisma.projectTask.update({ where: { id: taskId }, data });
}

export async function deleteProjectTask(taskId: string) {
  return prisma.projectTask.delete({ where: { id: taskId } });
}

export async function addTimeEntry(projectId: string, data: {
  personName: string;
  workDate: string;
  hours: number;
  taskId?: string;
  notes?: string;
}) {
  return prisma.projectTimeEntry.create({ data: { projectId, ...data } });
}

export async function addCostEntry(projectId: string, data: {
  entryDate: string;
  description: string;
  category: string;
  amount: number;
}) {
  return prisma.projectCostEntry.create({ data: { projectId, ...data } });
}

export async function addProjectNote(projectId: string, data: { userName: string; noteType?: string; content: string }) {
  return prisma.projectNote.create({ data: { projectId, ...data } });
}

export async function getProjectStats() {
  const [total, byStatus] = await Promise.all([
    prisma.project.count(),
    prisma.project.groupBy({ by: ['status'], _count: true }),
  ]);
  return { total, byStatus };
}
