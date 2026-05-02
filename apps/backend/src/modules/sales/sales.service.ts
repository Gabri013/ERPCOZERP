import type { QuoteStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';
import { decimalToNumber } from '../stock/stock.service.js';

function padSeq(n: number, len = 5) {
  return String(n).padStart(len, '0');
}

async function nextNumber(prefix: string, year: number, table: 'sale' | 'quote' | 'wo') {
  const start = `${prefix}-${year}-`;
  let rows: { number: string }[] = [];
  if (table === 'sale') {
    rows = await prisma.saleOrder.findMany({
      where: { number: { startsWith: start } },
      select: { number: true },
    });
  } else if (table === 'quote') {
    rows = await prisma.quote.findMany({
      where: { number: { startsWith: start } },
      select: { number: true },
    });
  } else {
    rows = await prisma.workOrder.findMany({
      where: { number: { startsWith: start } },
      select: { number: true },
    });
  }
  let max = 0;
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  for (const r of rows) {
    const m = r.number.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${start}${padSeq(max + 1)}`;
}

function lineTotal(qty: Prisma.Decimal, unit: Prisma.Decimal, discPct: Prisma.Decimal | null) {
  const q = qty.toNumber();
  const u = unit.toNumber();
  const d = discPct?.toNumber() ?? 0;
  const gross = q * u * (1 - d / 100);
  return new Prisma.Decimal(Math.round(gross * 100) / 100);
}

export async function listCustomers() {
  return prisma.customer.findMany({ orderBy: { name: 'asc' } });
}

export async function createCustomer(data: {
  code?: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active?: boolean;
}) {
  let code = data.code?.trim();
  if (!code) {
    const n = await prisma.customer.count();
    code = `CLI-${padSeq(n + 1, 4)}`;
  }
  return prisma.customer.create({
    data: {
      code,
      name: data.name,
      document: data.document ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      active: data.active ?? true,
    },
  });
}

export async function patchCustomer(
  id: string,
  data: Partial<{
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    active: boolean;
  }>,
) {
  return prisma.customer.update({ where: { id }, data });
}

export async function listSaleOrders(q: { status?: string; customerId?: string; take?: number }) {
  const take = q.take ?? 200;
  return prisma.saleOrder.findMany({
    where: {
      ...(q.status ? { status: q.status } : {}),
      ...(q.customerId ? { customerId: q.customerId } : {}),
    },
    take,
    orderBy: [{ kanbanColumn: 'asc' }, { kanbanOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      customer: true,
      items: { include: { product: true } },
      quote: { select: { id: true, number: true } },
    },
  });
}

export async function getSaleOrder(id: string) {
  return prisma.saleOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      quote: true,
      workOrders: { select: { id: true, number: true, status: true } },
      approvedBy: { select: { id: true, fullName: true, email: true } },
    },
  });
}

function parseOptDate(s: string | undefined | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createSaleOrder(input: {
  customerId: string;
  status?: string;
  kanbanColumn?: string;
  orderDate?: string;
  deliveryDate?: string | null;
  notes?: string | null;
  items: Array<{ productId: string; quantity: number; unitPrice: number; discountPct?: number | null }>;
}) {
  const year = new Date().getFullYear();
  const number = await nextNumber('PV', year, 'sale');
  let total = new Prisma.Decimal(0);
  const itemRows = input.items.map((it) => {
    const qty = new Prisma.Decimal(it.quantity);
    const unit = new Prisma.Decimal(it.unitPrice);
    const disc =
      it.discountPct != null && it.discountPct !== undefined
        ? new Prisma.Decimal(it.discountPct)
        : null;
    const lt = lineTotal(qty, unit, disc);
    total = total.add(lt);
    return {
      productId: it.productId,
      quantity: qty,
      unitPrice: unit,
      discountPct: disc,
      lineTotal: lt,
    };
  });

  return prisma.saleOrder.create({
    data: {
      number,
      customerId: input.customerId,
      status: input.status ?? 'DRAFT',
      kanbanColumn: input.kanbanColumn ?? 'PEDIDO',
      orderDate: parseOptDate(input.orderDate) ?? new Date(),
      deliveryDate: parseOptDate(input.deliveryDate ?? undefined),
      notes: input.notes ?? null,
      totalAmount: total,
      items: { create: itemRows },
    },
    include: { customer: true, items: { include: { product: true } } },
  });
}

export async function patchSaleOrder(
  id: string,
  input: Partial<{
    customerId: string;
    status: string;
    kanbanColumn: string;
    kanbanOrder: number;
    deliveryDate: string | null;
    notes: string | null;
    items: Array<{ productId: string; quantity: number; unitPrice: number; discountPct?: number | null }>;
  }>,
) {
  const existing = await prisma.saleOrder.findUnique({ where: { id } });
  if (!existing) throw new Error('Pedido não encontrado');

  return prisma.$transaction(async (tx) => {
    if (input.items && input.items.length) {
      await tx.saleOrderItem.deleteMany({ where: { saleOrderId: id } });
      let total = new Prisma.Decimal(0);
      for (const it of input.items) {
        const qty = new Prisma.Decimal(it.quantity);
        const unit = new Prisma.Decimal(it.unitPrice);
        const disc =
          it.discountPct != null && it.discountPct !== undefined
            ? new Prisma.Decimal(it.discountPct)
            : null;
        const lt = lineTotal(qty, unit, disc);
        total = total.add(lt);
        await tx.saleOrderItem.create({
          data: {
            saleOrderId: id,
            productId: it.productId,
            quantity: qty,
            unitPrice: unit,
            discountPct: disc,
            lineTotal: lt,
          },
        });
      }
      await tx.saleOrder.update({
        where: { id },
        data: {
          customerId: input.customerId ?? undefined,
          status: input.status ?? undefined,
          kanbanColumn: input.kanbanColumn ?? undefined,
          kanbanOrder: input.kanbanOrder ?? undefined,
          deliveryDate:
            input.deliveryDate === undefined
              ? undefined
              : input.deliveryDate
                ? new Date(input.deliveryDate)
                : null,
          notes: input.notes === undefined ? undefined : input.notes,
          totalAmount: total,
        },
      });
    } else {
      await tx.saleOrder.update({
        where: { id },
        data: {
          customerId: input.customerId ?? undefined,
          status: input.status ?? undefined,
          kanbanColumn: input.kanbanColumn ?? undefined,
          kanbanOrder: input.kanbanOrder ?? undefined,
          deliveryDate:
            input.deliveryDate === undefined
              ? undefined
              : input.deliveryDate
                ? new Date(input.deliveryDate)
                : null,
          notes: input.notes === undefined ? undefined : input.notes,
        },
      });
    }
    return tx.saleOrder.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } } },
    });
  });
}

export async function approveSaleOrder(id: string, userId: string) {
  const o = await prisma.saleOrder.findUnique({ where: { id } });
  if (!o) throw new Error('Pedido não encontrado');
  return prisma.saleOrder.update({
    where: { id },
    data: {
      status: 'APPROVED',
      kanbanColumn: 'PRODUCAO',
      approvedAt: new Date(),
      approvedById: userId,
    },
    include: { customer: true, items: { include: { product: true } } },
  });
}

export async function patchKanban(id: string, kanbanColumn: string, kanbanOrder?: number) {
  return prisma.saleOrder.update({
    where: { id },
    data: {
      kanbanColumn,
      ...(kanbanOrder !== undefined ? { kanbanOrder } : {}),
    },
    include: { customer: true, items: { include: { product: true } } },
  });
}

export async function generateWorkOrderStub(saleOrderId: string) {
  const so = await prisma.saleOrder.findUnique({
    where: { id: saleOrderId },
    include: { items: true, workOrders: true },
  });
  if (!so) throw new Error('Pedido não encontrado');
  if (so.workOrders.length) {
    return prisma.workOrder.findFirst({
      where: { saleOrderId },
      include: { items: { include: { product: true } } },
    });
  }
  const year = new Date().getFullYear();
  const number = await nextNumber('OP', year, 'wo');
  return prisma.workOrder.create({
    data: {
      number,
      status: 'OPEN',
      saleOrderId,
      items: {
        create: so.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });
}

export async function listQuotes() {
  return prisma.quote.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
}

export async function getQuote(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } }, saleOrder: true },
  });
}

export async function createQuote(input: {
  customerId: string;
  validUntil?: string | null;
  notes?: string | null;
  items: Array<{ productId: string; quantity: number; unitPrice: number; discountPct?: number | null }>;
}) {
  const year = new Date().getFullYear();
  const number = await nextNumber('ORC', year, 'quote');
  let total = new Prisma.Decimal(0);
  const itemRows = input.items.map((it) => {
    const qty = new Prisma.Decimal(it.quantity);
    const unit = new Prisma.Decimal(it.unitPrice);
    const disc =
      it.discountPct != null && it.discountPct !== undefined
        ? new Prisma.Decimal(it.discountPct)
        : null;
    total = total.add(lineTotal(qty, unit, disc));
    return {
      productId: it.productId,
      quantity: qty,
      unitPrice: unit,
      discountPct: disc,
    };
  });

  return prisma.quote.create({
    data: {
      number,
      customerId: input.customerId,
      status: 'RASCUNHO',
      validUntil: parseOptDate(input.validUntil ?? undefined),
      notes: input.notes ?? null,
      totalAmount: total,
      items: { create: itemRows },
    },
    include: { customer: true, items: { include: { product: true } } },
  });
}

export async function patchQuote(
  id: string,
  input: Partial<{
    status: QuoteStatus;
    validUntil: string | null;
    notes: string | null;
    items: Array<{ productId: string; quantity: number; unitPrice: number; discountPct?: number | null }>;
  }>,
) {
  const existing = await prisma.quote.findUnique({ where: { id } });
  if (!existing) throw new Error('Orçamento não encontrado');

  return prisma.$transaction(async (tx) => {
    if (input.items?.length) {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      let total = new Prisma.Decimal(0);
      for (const it of input.items) {
        const qty = new Prisma.Decimal(it.quantity);
        const unit = new Prisma.Decimal(it.unitPrice);
        const disc =
          it.discountPct != null && it.discountPct !== undefined
            ? new Prisma.Decimal(it.discountPct)
            : null;
        const lt = lineTotal(qty, unit, disc);
        total = total.add(lt);
        await tx.quoteItem.create({
          data: {
            quoteId: id,
            productId: it.productId,
            quantity: qty,
            unitPrice: unit,
            discountPct: disc,
          },
        });
      }
      await tx.quote.update({
        where: { id },
        data: {
          status: input.status ?? undefined,
          validUntil:
            input.validUntil === undefined
              ? undefined
              : input.validUntil
                ? new Date(input.validUntil)
                : null,
          notes: input.notes === undefined ? undefined : input.notes,
          totalAmount: total,
        },
      });
    } else {
      await tx.quote.update({
        where: { id },
        data: {
          status: input.status ?? undefined,
          validUntil:
            input.validUntil === undefined
              ? undefined
              : input.validUntil
                ? new Date(input.validUntil)
                : null,
          notes: input.notes === undefined ? undefined : input.notes,
        },
      });
    }
    return tx.quote.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } } },
    });
  });
}

export async function convertQuoteToSaleOrder(quoteId: string) {
  const q = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true, saleOrder: true },
  });
  if (!q) throw new Error('Orçamento não encontrado');
  if (q.status === 'CONVERTIDO' || q.saleOrder) throw new Error('Orçamento já convertido');

  const year = new Date().getFullYear();
  const number = await nextNumber('PV', year, 'sale');
  let total = new Prisma.Decimal(0);
  const itemCreates = q.items.map((it) => {
    const lt = lineTotal(it.quantity, it.unitPrice, it.discountPct);
    total = total.add(lt);
    return {
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discountPct: it.discountPct,
      lineTotal: lt,
    };
  });

  return prisma.$transaction(async (tx) => {
    const so = await tx.saleOrder.create({
      data: {
        number,
        customerId: q.customerId,
        quoteId: q.id,
        status: 'DRAFT',
        kanbanColumn: 'PEDIDO',
        orderDate: new Date(),
        totalAmount: total,
        items: { create: itemCreates },
      },
      include: { items: { include: { product: true } }, customer: true },
    });
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: 'CONVERTIDO' },
    });
    return so;
  });
}

export async function listPriceTables() {
  return prisma.priceTable.findMany({
    orderBy: { name: 'asc' },
    include: {
      items: { include: { product: { select: { id: true, code: true, name: true } } } },
    },
  });
}

export async function createPriceTable(input: {
  code?: string;
  name: string;
  currency?: string;
  active?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  items?: Array<{ productId: string; price: number; minQty?: number | null }>;
}) {
  let code = input.code?.trim();
  if (!code) {
    const n = await prisma.priceTable.count();
    code = `TAB-${padSeq(n + 1, 3)}`;
  }
  const pt = await prisma.priceTable.create({
    data: {
      code,
      name: input.name,
      currency: input.currency ?? 'BRL',
      active: input.active ?? true,
      validFrom: parseOptDate(input.validFrom ?? undefined),
      validTo: parseOptDate(input.validTo ?? undefined),
    },
  });
  if (input.items?.length) {
    await prisma.priceTableItem.createMany({
      data: input.items.map((it) => ({
        priceTableId: pt.id,
        productId: it.productId,
        price: new Prisma.Decimal(it.price),
        minQty: it.minQty != null ? new Prisma.Decimal(it.minQty) : null,
      })),
    });
  }
  return prisma.priceTable.findUnique({
    where: { id: pt.id },
    include: {
      items: { include: { product: { select: { id: true, code: true, name: true } } } },
    },
  });
}

export async function patchPriceTable(
  id: string,
  input: Partial<{
    name: string;
    currency: string;
    active: boolean;
    validFrom: string | null;
    validTo: string | null;
    items: Array<{ productId: string; price: number; minQty?: number | null }>;
  }>,
) {
  const existing = await prisma.priceTable.findUnique({ where: { id } });
  if (!existing) throw new Error('Tabela não encontrada');

  await prisma.priceTable.update({
    where: { id },
    data: {
      name: input.name ?? undefined,
      currency: input.currency ?? undefined,
      active: input.active ?? undefined,
      validFrom:
        input.validFrom === undefined
          ? undefined
          : input.validFrom
            ? new Date(input.validFrom)
            : null,
      validTo:
        input.validTo === undefined ? undefined : input.validTo ? new Date(input.validTo) : null,
    },
  });

  if (input.items) {
    await prisma.priceTableItem.deleteMany({ where: { priceTableId: id } });
    if (input.items.length) {
      await prisma.priceTableItem.createMany({
        data: input.items.map((it) => ({
          priceTableId: id,
          productId: it.productId,
          price: new Prisma.Decimal(it.price),
          minQty: it.minQty != null ? new Prisma.Decimal(it.minQty) : null,
        })),
      });
    }
  }

  return prisma.priceTable.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, code: true, name: true } } } },
    },
  });
}

export async function salesReportSummary() {
  const orders = await prisma.saleOrder.findMany({
    where: { totalAmount: { not: null } },
    select: { orderDate: true, totalAmount: true, status: true, kanbanColumn: true },
  });
  const byMonth = new Map<string, number>();
  let total = 0;
  for (const o of orders) {
    const amt = decimalToNumber(o.totalAmount) ?? 0;
    total += amt;
    const key = `${o.orderDate.getFullYear()}-${padSeq(o.orderDate.getMonth() + 1, 2)}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + amt);
  }
  const monthly = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
  const byStatus: Record<string, number> = {};
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  }
  return { totalRevenue: total, monthly, byStatus, orderCount: orders.length };
}
