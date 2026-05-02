import { prisma } from '../../infra/prisma.js';
import { Decimal } from '@prisma/client/runtime/library.js';
import type { Prisma } from '@prisma/client';

// ─── Account Plan ─────────────────────────────────────────────────────────────
export async function listAccountPlan(filters: { accountType?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.accountType) where.accountType = filters.accountType;
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.accountPlan.findMany({ where, orderBy: { code: 'asc' } });
}

export async function createAccountPlan(data: {
  code: string;
  name: string;
  accountType: string;
  parentCode?: string;
  level?: number;
}) {
  return prisma.accountPlan.create({ data });
}

export async function updateAccountPlan(id: string, data: Partial<{ name: string; active: boolean; parentCode: string }>) {
  return prisma.accountPlan.update({ where: { id }, data });
}

export async function deleteAccountPlan(id: string) {
  return prisma.accountPlan.delete({ where: { id } });
}

// ─── Account Entries ──────────────────────────────────────────────────────────
export async function listEntries(filters: { module?: string; dateFrom?: string; dateTo?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.module) where.module = filters.module;
  if (filters.dateFrom || filters.dateTo) {
    where.entryDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { debitAccount: { contains: filters.search, mode: 'insensitive' } },
      { creditAccount: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.accountEntry.findMany({ where, orderBy: { entryDate: 'desc' }, take: 500 });
}

export async function createEntry(data: {
  entryDate: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  origin?: string;
  module?: string;
  referenceId?: string;
  history?: string;
}) {
  return prisma.accountEntry.create({ data });
}

export async function deleteEntry(id: string) {
  return prisma.accountEntry.delete({ where: { id } });
}

// ─── DRE (Demonstration of Results) ──────────────────────────────────────────
export async function getDRE(year?: number) {
  const targetYear = year ?? new Date().getFullYear();
  const startDate = new Date(`${targetYear}-01-01`);
  const endDate = new Date(`${targetYear}-12-31`);

  const entries = await prisma.accountEntry.findMany({
    where: { entryDate: { gte: startDate, lte: endDate } },
    orderBy: { entryDate: 'asc' },
  });

  const plan = await prisma.accountPlan.findMany({ orderBy: { code: 'asc' } });
  const planMap = new Map<string, typeof plan[number]>(plan.map((p) => [p.code, p]));

  const monthly: Record<number, { receita: number; despesa: number }> = {};
  for (let m = 1; m <= 12; m++) monthly[m] = { receita: 0, despesa: 0 };

  for (const e of entries) {
    const month = new Date(e.entryDate).getMonth() + 1;
    const debitAccount = planMap.get(e.debitAccount);
    const creditAccount = planMap.get(e.creditAccount);
    const amount = Number(e.amount);

    if (creditAccount?.accountType === 'receita') monthly[month].receita += amount;
    if (debitAccount?.accountType === 'despesa') monthly[month].despesa += amount;
  }

  return { year: targetYear, monthly };
}

// ─── Standard Costs ───────────────────────────────────────────────────────────
export async function listStandardCosts() {
  const costs = await prisma.productStandardCost.findMany();
  const productIds = costs.map((c) => c.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, code: true, name: true },
  });
  const productMap = new Map<string, typeof products[number]>(products.map((p) => [p.id, p]));
  return costs.map((c) => ({ ...c, product: productMap.get(c.productId) ?? null }));
}

export async function upsertStandardCost(productId: string, data: {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  salePrice?: number;
  marginPct?: number;
}) {
  const totalCost = (data.materialCost ?? 0) + (data.laborCost ?? 0) + (data.overheadCost ?? 0);
  return prisma.productStandardCost.upsert({
    where: { productId },
    update: { ...data, totalCost: new Decimal(totalCost) },
    create: { productId, ...data, totalCost: new Decimal(totalCost) },
  });
}

export async function getAccountingStats() {
  const [totalEntries, totalAccounts, revenueEntries, expenseEntries] = await Promise.all([
    prisma.accountEntry.count(),
    prisma.accountPlan.count(),
    prisma.accountEntry.aggregate({ _sum: { amount: true }, where: {} }),
    prisma.productStandardCost.count(),
  ]);
  return { totalEntries, totalAccounts, revenueEntries, expenseEntries };
}
