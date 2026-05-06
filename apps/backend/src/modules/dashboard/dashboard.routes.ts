import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';
import { rolesCanSeeNotificationSector } from '../../lib/notificationVisibility.js';
import { roleCodesFromUserRoleRows } from '../../lib/roleOrder.js';
import { getDefaultDashboardWidgets, migrateLegacyLayout } from '../../lib/defaultDashboardLayout.js';
import { saleOrdersRestrictedToOwner } from '../../lib/saleOrderScope.js';
import { cache } from '../../lib/cache.js';

export const dashboardRouter = Router();

async function countEntity(code: string) {
  const entity = await prisma.entity.findUnique({ where: { code } });
  if (!entity) return 0;
  return prisma.entityRecord.count({ where: { entityId: entity.id, deletedAt: null } });
}

async function getEntityId(code: string) {
  const entity = await prisma.entity.findUnique({ where: { code } });
  return entity?.id || null;
}

async function countClientesAtivos() {
  const entity = await prisma.entity.findUnique({ where: { code: 'cliente' } });
  if (!entity) return 0;
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    select: { data: true },
    take: 5000,
  });
  return rows.filter((r) => String((r.data as any)?.status || '') === 'Ativo').length;
}

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function lastNMonths(n: number) {
  const months: { key: string; start: Date }[] = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(start.getFullYear(), start.getMonth() - i, 1, 0, 0, 0, 0);
    months.push({ key: monthKey(d), start: d });
  }
  return months;
}

async function countRecordsByMonth(entityId: string, monthsBack = 6) {
  const months = lastNMonths(monthsBack);
  const from = months[0]?.start ?? new Date();

  // Usa SQL para agrupar por mês (mais rápido e consistente)
  const rows = await prisma.$queryRaw<Array<{ ym: string; count: bigint }>>`
    SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS ym,
           COUNT(*)::bigint AS count
    FROM entity_records
    WHERE entity_id = ${entityId}::uuid
      AND deleted_at IS NULL
      AND created_at >= ${from}
    GROUP BY ym
    ORDER BY ym ASC;
  `;

  const map = new Map(rows.map((r) => [r.ym, Number(r.count)]));
  return months.map((m) => ({ ym: m.key, count: map.get(m.key) || 0 }));
}

async function getUserPrimaryRoleCode(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) return 'user';
  return roleCodesFromUserRoleRows(user.roles)[0] || 'user';
}

function inferSectorFromRole(roleCode: string) {
  const map: Record<string, string> = {
    master: 'Diretoria',
    gerente: 'Gerência',
    gerente_producao: 'Produção',
    orcamentista_vendas: 'Vendas',
    projetista: 'Engenharia',
    corte_laser: 'Laser',
    dobra_montagem: 'Dobra/Montagem',
    solda: 'Solda',
    expedicao: 'Expedição',
    qualidade: 'Qualidade',
    user: 'Geral',
  };
  return map[roleCode] || 'Geral';
}

const fmtBRL = (val: number) =>
  `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function getSaleOrdersKpis(ownerUserId?: string | null) {
  try {
    const scope: Prisma.SaleOrderWhereInput =
      ownerUserId != null
        ? { OR: [{ ownerUserId }, { ownerUserId: null }] }
        : {};
    const [totalAtivos, sumResult] = await Promise.all([
      prisma.saleOrder.count({
        where: {
          ...scope,
          status: { in: ['APPROVED', 'IN_PRODUCTION', 'DELIVERED', 'INVOICED'] },
        },
      }),
      prisma.saleOrder.aggregate({
        _sum: { totalAmount: true },
        where: { ...scope, status: { notIn: ['DRAFT', 'CANCELLED'] } },
      }),
    ]);
    const total = Number(sumResult._sum.totalAmount || 0);
    return { count: totalAtivos, totalVendas: fmtBRL(total) };
  } catch {
    return { count: 0, totalVendas: 'R$ 0' };
  }
}

async function getWorkOrdersKpis() {
  try {
    const [emAndamento, atrasadas] = await Promise.all([
      prisma.workOrder.count({ where: { status: { in: ['RELEASED', 'IN_PROGRESS', 'PAUSED'] } } }),
      prisma.workOrder.count({
        where: {
          status: { in: ['RELEASED', 'IN_PROGRESS'] },
          scheduledEnd: { lt: new Date() },
        },
      }),
    ]);
    return { emAndamento, atrasadas };
  } catch {
    return { emAndamento: 0, atrasadas: 0 };
  }
}

async function getPurchaseOrdersKpis() {
  try {
    const pendentes = await prisma.purchaseOrder.count({
      where: { status: { in: ['RASCUNHO', 'ENVIADO', 'PARCIALMENTE_RECEBIDO'] as any } },
    });
    return { pendentes };
  } catch {
    return { pendentes: 0 };
  }
}

async function getEmployeesKpis() {
  try {
    const total = await prisma.employee.count({ where: { active: true } });
    return { total };
  } catch {
    return { total: 0 };
  }
}

async function getWorkOrdersByMonth(monthsBack = 6) {
  try {
    const months = lastNMonths(monthsBack);
    const from = months[0]?.start ?? new Date();
    const rows = await prisma.$queryRaw<Array<{ ym: string; count: bigint }>>`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS ym,
             COUNT(*)::bigint AS count
      FROM work_orders
      WHERE created_at >= ${from}
      GROUP BY ym
      ORDER BY ym ASC;
    `;
    const map = new Map(rows.map((r) => [r.ym, Number(r.count)]));
    return months.map((m) => ({ ym: m.key, count: map.get(m.key) || 0 }));
  } catch {
    return [];
  }
}

async function getSaleOrdersByMonth(monthsBack = 6, ownerUserId?: string | null) {
  try {
    const months = lastNMonths(monthsBack);
    const from = months[0]?.start ?? new Date();
    const rows =
      ownerUserId != null
        ? await prisma.$queryRaw<Array<{ ym: string; count: bigint; total: number }>>`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS ym,
             COUNT(*)::bigint AS count,
             COALESCE(SUM(total_amount), 0)::float AS total
      FROM sale_orders
      WHERE created_at >= ${from}
        AND status NOT IN ('DRAFT','CANCELLED')
        AND (owner_user_id = ${ownerUserId}::uuid OR owner_user_id IS NULL)
      GROUP BY ym
      ORDER BY ym ASC;
    `
        : await prisma.$queryRaw<Array<{ ym: string; count: bigint; total: number }>>`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS ym,
             COUNT(*)::bigint AS count,
             COALESCE(SUM(total_amount), 0)::float AS total
      FROM sale_orders
      WHERE created_at >= ${from}
        AND status NOT IN ('DRAFT','CANCELLED')
      GROUP BY ym
      ORDER BY ym ASC;
    `;
    const map = new Map(rows.map((r) => [r.ym, { count: Number(r.count), total: Number(r.total) }]));
    return months.map((m) => ({ ym: m.key, count: map.get(m.key)?.count || 0, total: map.get(m.key)?.total || 0 }));
  } catch {
    return [];
  }
}

dashboardRouter.get('/', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const roleCode = await getUserPrimaryRoleCode(userId);
  const sector = inferSectorFromRole(roleCode);
  const jwtRoles = Array.isArray((req as { user?: { roles?: string[] } }).user?.roles)
    ? (req as { user: { roles: string[] } }).user.roles
    : [];
  const roleCodesForNotifs = jwtRoles.length > 0 ? jwtRoles : roleCode ? [roleCode] : [];

  const vendasMine =
    jwtRoles.length && saleOrdersRestrictedToOwner(jwtRoles) ? userId : null;

  // Dados em paralelo (tolerante a falhas individuais)
  const [
    totalClientes,
    totalProdutos,
    salesKpis,
    workOrdersKpis,
    purchaseKpis,
    employeesKpis,
    clienteId,
    opsPorMes,
    vendasPorMes,
  ] = await Promise.all([
    countClientesAtivos(),
    countEntity('produto'),
    getSaleOrdersKpis(vendasMine),
    getWorkOrdersKpis(),
    getPurchaseOrdersKpis(),
    getEmployeesKpis(),
    getEntityId('cliente'),
    getWorkOrdersByMonth(6),
    getSaleOrdersByMonth(6, vendasMine),
  ]);

  const clientesPorMes =
    vendasMine != null ? [] : clienteId ? await countRecordsByMonth(clienteId, 6) : [];

  const unreadNotifRows = await prisma.userNotification.findMany({
    where: { userId, readAt: null },
    select: { sector: true },
    take: 2000,
  });
  const unreadNotifs = unreadNotifRows.filter((r) =>
    rolesCanSeeNotificationSector(r.sector, roleCodesForNotifs)
  ).length;

  const layoutRecord = await prisma.dashboardLayout.findUnique({ where: { userId } });
  const rawWidgets = Array.isArray(layoutRecord?.widgets) ? (layoutRecord!.widgets as string[]) : [];
  const migratedWidgets = migrateLegacyLayout(rawWidgets);
  if (migratedWidgets.join(',') !== rawWidgets.join(',') && migratedWidgets.length > 0 && layoutRecord) {
    await prisma.dashboardLayout.update({ where: { userId }, data: { widgets: migratedWidgets } }).catch(() => {});
  }

  res.json({
    success: true,
    data: {
      totalVendas:       salesKpis.totalVendas,
      totalOPs:          String(workOrdersKpis.emAndamento),
      totalOPsAtrasadas: String(workOrdersKpis.atrasadas),
      totalProdutos:     String(totalProdutos),
      totalClientes:     String(totalClientes),
      totalOCs:          String(purchaseKpis.pendentes),
      totalFuncionarios: String(employeesKpis.total),
      saldoFinanceiro:   salesKpis.totalVendas, // fallback; financeiro usa businessLogicApi diretamente
      roleCode,
      sector,
      dashboardScope: vendasMine != null ? ('mine' as const) : ('company' as const),
      unreadNotifs: String(unreadNotifs),
      series: {
        clientesPorMes,
        opsPorMes,
        vendasPorMes,
      },
    },
    layout: {
      widgets: migratedWidgets,
    },
  });
});

dashboardRouter.get('/executivo', async (req, res) => {
  try {
    const cacheKey = 'dashboard:executivo';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // KPIs principais
    const totalVendas = await prisma.saleOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: { notIn: ['DRAFT', 'CANCELLED'] } }
    });

    const totalClientes = await countClientesAtivos();
    const totalProdutos = await countEntity('produto');
    const totalFuncionarios = await getEmployeesKpis();

    // NF-es emitidas este mês
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nfeCount = await prisma.fiscalNfe.count({
      where: {
        issuedAt: { gte: startOfMonth },
        status: 'AUTORIZADA'
      }
    });

    // Receita mensal (últimos 12 meses)
    const monthlyRevenue = await getSaleOrdersByMonth(12);

    // Status de produção
    const productionStats = await prisma.workOrder.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const producaoStatus = {
      emAndamento: productionStats.find(s => s.status === 'IN_PROGRESS')?._count?.id || 0,
      concluidas: productionStats.find(s => s.status === 'COMPLETED')?._count?.id || 0,
      atrasadas: productionStats.find(s => s.status === 'DELAYED')?._count?.id || 0
    };

    // Top produtos mais vendidos
    const topProducts = await prisma.$queryRaw<Array<{ produto: string; quantidade: number; receita: number }>>`
      SELECT p.name as produto, SUM(soi.quantity) as quantidade, SUM(soi.total_price) as receita
      FROM sale_order_items soi
      JOIN products p ON soi.product_id = p.id
      JOIN sale_orders so ON soi.sale_order_id = so.id
      WHERE so.status NOT IN ('DRAFT','CANCELLED')
      GROUP BY p.id, p.name
      ORDER BY receita DESC
      LIMIT 10
    `;

    const data = {
      success: true,
      data: {
        kpis: {
          receitaTotal: totalVendas._sum.totalAmount || 0,
          totalClientes,
          totalProdutos,
          totalFuncionarios: totalFuncionarios.total,
          nfeMesAtual: nfeCount
        },
        producao: producaoStatus,
        receitaMensal: monthlyRevenue,
        topProdutos: topProducts.map(p => ({
          produto: p.produto,
          quantidade: Number(p.quantidade),
          receita: Number(p.receita)
        }))
      }
    };

    await cache.set(cacheKey, data, { ttl: 300 }); // 5 minutes
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar dashboard executivo' });
  }
});

dashboardRouter.get('/layout', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const layout = await prisma.dashboardLayout.findUnique({ where: { userId } });
  const raw = Array.isArray(layout?.widgets) ? (layout!.widgets as string[]) : [];
  const widgets = migrateLegacyLayout(raw);

  // Se o layout foi migrado (diferente do original), persiste a versão limpa
  if (widgets.join(',') !== raw.join(',') && widgets.length > 0) {
    await prisma.dashboardLayout.update({ where: { userId }, data: { widgets } }).catch(() => {});
  }

  res.json({ success: true, data: { widgets } });
});

dashboardRouter.put('/layout', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const raw = Array.isArray(req.body?.widgets) ? req.body.widgets : Array.isArray(req.body) ? req.body : null;
  if (!raw) return res.status(400).json({ error: 'widgets deve ser um array' });
  const widgets = migrateLegacyLayout(raw);

  const saved = await prisma.dashboardLayout.upsert({
    where: { userId },
    update: { widgets },
    create: { userId, widgets },
  });

  res.json({ success: true, data: { widgets: saved.widgets } });
});

dashboardRouter.post('/layout/reset', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const roleCode = roleCodesFromUserRoleRows(user.roles)[0] || 'user';
  const widgets = getDefaultDashboardWidgets(roleCode, user.sector);

  const saved = await prisma.dashboardLayout.upsert({
    where: { userId },
    update: { widgets },
    create: { userId, widgets },
  });

  res.json({ success: true, data: { widgets: saved.widgets } });
});

