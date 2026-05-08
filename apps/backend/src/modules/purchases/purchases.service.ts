import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';
import { eventBus, ERP_EVENTS } from '../../lib/events.js';

/** Acesso a modelos gerados após `npx prisma generate`. */
function px(): any {
  return prisma;
}

function padSeq(n: number, len = 5) {
  return String(n).padStart(len, '0');
}

async function nextOcNumber(year: number) {
  const start = `OC-${year}-`;
  const rows = await px().purchaseOrder.findMany({
    where: { number: { startsWith: start } },
    select: { number: true },
  });
  let max = 0;
  const re = new RegExp(`^OC-${year}-(\\d+)$`);
  for (const r of rows as { number: string }[]) {
    const m = r.number.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${start}${padSeq(max + 1)}`;
}

export async function listSuppliers() {
  return px().supplier.findMany({ orderBy: { name: 'asc' } });
}

export async function createSupplier(data: {
  code?: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
}) {
  let code = data.code?.trim();
  if (!code) {
    const n = await px().supplier.count();
    code = `FOR-${padSeq(n + 1, 4)}`;
  }
  return px().supplier.create({
    data: {
      code,
      name: data.name,
      document: data.document ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      active: data.active ?? true,
    },
  });
}

export async function patchSupplier(id: string, data: {
  name?: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
}) {
  return px().supplier.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.document !== undefined ? { document: data.document } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });
}

export async function listPurchaseOrders() {
  return px().purchaseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });
}

export async function getPurchaseOrder(id: string) {
  return px().purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });
}

export async function createPurchaseOrder(input: {
  supplierId: string;
  expectedDate?: string | null;
  notes?: string | null;
  items: Array<{ productId: string; quantity: number; unitCost?: number | null }>;
}) {
  const year = new Date().getFullYear();
  const number = await nextOcNumber(year);
  return px().purchaseOrder.create({
    data: {
      number,
      supplierId: input.supplierId,
      status: 'RASCUNHO',
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      notes: input.notes ?? null,
      items: {
        create: input.items.map((it) => ({
          productId: it.productId,
          quantity: new Prisma.Decimal(it.quantity),
          unitCost: it.unitCost != null ? new Prisma.Decimal(it.unitCost) : null,
          receivedQty: new Prisma.Decimal(0),
        })),
      },
    },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });
}

export async function sendPurchaseOrder(id: string) {
  return px().purchaseOrder.update({
    where: { id },
    data: { status: 'ENVIADO' },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });
}

type PoRow = {
  id: string;
  number: string;
  status: string;
  items: Array<{ id: string; productId: string; quantity: Prisma.Decimal; receivedQty: Prisma.Decimal }>;
};

export async function receivePurchaseOrder(
  orderId: string,
  lines: Array<{ productId: string; quantity: number }>,
  userId?: string | null,
) {
  const order = (await px().purchaseOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  })) as PoRow | null;
  if (!order) throw new Error('Ordem de compra não encontrada');
  if (order.status === 'CANCELADO') throw new Error('OC cancelada');

  await prisma.$transaction(async (tx) => {
    const txp = tx as typeof tx & {
      purchaseOrderItem: { update: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]> };
      purchaseOrder: { update: (args: unknown) => Promise<unknown> };
    };
    for (const line of lines) {
      const item = order.items.find((i: { productId: string }) => i.productId === line.productId);
      if (!item) throw new Error('Produto não consta nesta OC');
      const q = new Prisma.Decimal(line.quantity);
      const newRec = item.receivedQty.add(q);
      if (newRec.gt(item.quantity)) {
        throw new Error('Quantidade recebida maior que o pedido');
      }
      await txp.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQty: newRec },
      });
    }

    const refreshed = (await txp.purchaseOrderItem.findMany({
      where: { purchaseOrderId: orderId },
    })) as Array<{ quantity: Prisma.Decimal; receivedQty: Prisma.Decimal }>;
    const allIn = refreshed.every((i) => i.receivedQty.gte(i.quantity));
    const anyIn = refreshed.some((i) => i.receivedQty.gt(0));
    await txp.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: allIn ? 'RECEBIDO' : anyIn ? 'PARCIALMENTE_RECEBIDO' : undefined,
      },
    });
  });

  const updated = await getPurchaseOrder(orderId);
  if (updated) {
    const valorTotal = updated.items.reduce((acc, item) => {
      const qty = item.receivedQty?.toNumber() ?? 0;
      const unit = item.unitCost?.toNumber() ?? 0;
      return acc + qty * unit;
    }, 0);

    eventBus.emit(ERP_EVENTS.COMPRA_RECEBIDA, {
      compraId: updated.id,
      companyId: updated.companyId,
      supplierId: updated.supplierId,
      valorTotal,
      userId: userId ?? null,
      itens: lines.map((line) => ({
        productId: line.productId,
        quantidade: line.quantity,
      })),
    });
  }

  return updated;
}
