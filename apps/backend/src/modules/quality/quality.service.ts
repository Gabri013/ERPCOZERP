import { prisma } from '../../infra/prisma.js';
import type { Prisma } from '@prisma/client';

// ─── Inspection Plans ─────────────────────────────────────────────────────────
export async function listInspectionPlans(filters: { stage?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.stage) where.stage = filters.stage;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.qualityInspectionPlan.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createInspectionPlan(data: { code: string; name: string; productCode?: string; stage: string; criteria?: Prisma.InputJsonValue }) {
  return prisma.qualityInspectionPlan.create({ data });
}

export async function updateInspectionPlan(id: string, data: Partial<{ name: string; stage: string; active: boolean; criteria: Prisma.InputJsonValue }>) {
  return prisma.qualityInspectionPlan.update({ where: { id }, data });
}

export async function deleteInspectionPlan(id: string) {
  return prisma.qualityInspectionPlan.delete({ where: { id } });
}

// ─── Inspections ──────────────────────────────────────────────────────────────
export async function listInspections(filters: { type?: string; status?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { productName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.qualityInspection.findMany({ where, orderBy: { inspectedAt: 'desc' } });
}

export async function createInspection(data: {
  code: string;
  type: string;
  planId?: string;
  productCode?: string;
  productName?: string;
  referenceDoc?: string;
  status?: string;
  inspector?: string;
  results?: Prisma.InputJsonValue;
  notes?: string;
}) {
  return prisma.qualityInspection.create({ data: data as Prisma.QualityInspectionUncheckedCreateInput });
}

export async function updateInspection(id: string, data: Partial<{ status: string; results: Prisma.InputJsonValue; notes: string; inspector: string }>) {
  return prisma.qualityInspection.update({ where: { id }, data });
}

export async function deleteInspection(id: string) {
  return prisma.qualityInspection.delete({ where: { id } });
}

// ─── Non-Conformities ─────────────────────────────────────────────────────────
export async function listNonConformities(filters: { status?: string; severity?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { title: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.qualityNonConformity.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createNonConformity(data: {
  code: string;
  title: string;
  description?: string;
  origin?: string;
  severity?: string;
  responsible?: string;
  dueDate?: string;
}) {
  return prisma.qualityNonConformity.create({ data });
}

export async function updateNonConformity(id: string, data: Partial<{
  status: string;
  rootCause: string;
  correctiveAction: string;
  responsible: string;
  dueDate: string;
  closedAt: string;
}>) {
  return prisma.qualityNonConformity.update({ where: { id }, data });
}

export async function deleteNonConformity(id: string) {
  return prisma.qualityNonConformity.delete({ where: { id } });
}

// ─── Instruments ──────────────────────────────────────────────────────────────
export async function listInstruments(filters: { status?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.qualityInstrument.findMany({ where, orderBy: { nextCalibration: 'asc' } });
}

export async function createInstrument(data: {
  code: string;
  name: string;
  instrumentType?: string;
  location?: string;
  calibrationInterval?: number;
  lastCalibration?: string;
  nextCalibration?: string;
  responsible?: string;
  certificate?: string;
}) {
  return prisma.qualityInstrument.create({ data });
}

export async function updateInstrument(id: string, data: Partial<{
  status: string;
  lastCalibration: string;
  nextCalibration: string;
  certificate: string;
  responsible: string;
}>) {
  return prisma.qualityInstrument.update({ where: { id }, data });
}

export async function deleteInstrument(id: string) {
  return prisma.qualityInstrument.delete({ where: { id } });
}

// ─── Documents ────────────────────────────────────────────────────────────────
export async function listDocuments(filters: { documentType?: string; status?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.documentType) where.documentType = filters.documentType;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { title: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.qualityDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createDocument(data: {
  code: string;
  title: string;
  documentType?: string;
  productCode?: string;
  orderRef?: string;
  author?: string;
  content?: Prisma.InputJsonValue;
}) {
  return prisma.qualityDocument.create({ data });
}

export async function updateDocument(id: string, data: Partial<{
  status: string;
  content: Prisma.InputJsonValue;
  signatures: Prisma.InputJsonValue;
  author: string;
}>) {
  return prisma.qualityDocument.update({ where: { id }, data });
}

export async function deleteDocument(id: string) {
  return prisma.qualityDocument.delete({ where: { id } });
}

// ─── Databooks ────────────────────────────────────────────────────────────────
export async function listDatabooks(filters: { status?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { title: { contains: filters.search, mode: 'insensitive' } },
      { clientName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.qualityDatabook.findMany({
    where,
    include: { documents: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createDatabook(data: {
  code: string;
  title: string;
  orderRef?: string;
  productCode?: string;
  clientName?: string;
  template?: string;
}) {
  return prisma.qualityDatabook.create({ data });
}

export async function updateDatabook(id: string, data: Partial<{ status: string; progress: number; template: string }>) {
  return prisma.qualityDatabook.update({ where: { id }, data });
}

export async function deleteDatabook(id: string) {
  return prisma.qualityDatabook.delete({ where: { id } });
}

export async function addDatabookDocument(databookId: string, data: {
  title: string;
  docType?: string;
  required?: boolean;
  sortOrder?: number;
}) {
  return prisma.qualityDatabookDocument.create({ data: { databookId, ...data } });
}

export async function updateDatabookDocument(docId: string, data: Partial<{ status: string; title: string }>) {
  return prisma.qualityDatabookDocument.update({ where: { id: docId }, data });
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getQualityStats() {
  const [totalInspections, totalNCs, totalInstruments, totalDocuments, ncByStatus, inspByStatus] = await Promise.all([
    prisma.qualityInspection.count(),
    prisma.qualityNonConformity.count(),
    prisma.qualityInstrument.count(),
    prisma.qualityDocument.count(),
    prisma.qualityNonConformity.groupBy({ by: ['status'], _count: true }),
    prisma.qualityInspection.groupBy({ by: ['status'], _count: true }),
  ]);
  return { totalInspections, totalNCs, totalInstruments, totalDocuments, ncByStatus, inspByStatus };
}
