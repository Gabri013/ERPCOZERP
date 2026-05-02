import { prisma } from '../../infra/prisma.js';

const takeDefault = 8;

export async function globalSearch(raw: string, maxPerType = takeDefault) {
  const q = raw.trim();
  if (q.length < 2) {
    return {
      query: q,
      products: [] as Array<{ id: string; title: string; subtitle: string; href: string }>,
      saleOrders: [] as Array<{ id: string; title: string; subtitle: string; href: string }>,
      customers: [] as Array<{ id: string; title: string; subtitle: string; href: string }>,
      workOrders: [] as Array<{ id: string; title: string; subtitle: string; href: string }>,
    };
  }

  const take = Math.min(Math.max(maxPerType, 1), 15);
  const mode = 'insensitive' as const;

  const [products, saleOrders, customers, workOrders] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [{ code: { contains: q, mode } }, { name: { contains: q, mode } }],
      },
      take,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, code: true, name: true },
    }),
    prisma.saleOrder.findMany({
      where: {
        OR: [
          { number: { contains: q, mode } },
          { customer: { name: { contains: q, mode } } },
        ],
      },
      take,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode } },
          { code: { contains: q, mode } },
          { document: { contains: q, mode } },
        ],
      },
      take,
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    }),
    prisma.workOrder.findMany({
      where: {
        OR: [
          { number: { contains: q, mode } },
          { notes: { contains: q, mode } },
        ],
      },
      take,
      orderBy: { updatedAt: 'desc' },
      include: {
        product: { select: { code: true, name: true } },
        saleOrder: { include: { customer: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    query: q,
    products: products.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: p.code,
      href: `/estoque/produtos/${p.id}`,
    })),
    saleOrders: saleOrders.map((s) => ({
      id: s.id,
      title: s.number,
      subtitle: s.customer?.name ?? 'Pedido',
      href: `/vendas/pedidos`,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.code,
      href: `/vendas/clientes`,
    })),
    workOrders: workOrders.map((w) => ({
      id: w.id,
      title: w.number,
      subtitle: w.product?.name ?? w.saleOrder?.customer?.name ?? 'OP',
      href: `/producao/ordens/${w.id}`,
    })),
  };
}
