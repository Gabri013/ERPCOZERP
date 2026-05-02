import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { rolesCanSeeNotificationSector } from '../../lib/notificationVisibility.js';
import { sortRolesByPriority } from '../../lib/roleOrder.js';
import { getDefaultDashboardWidgets } from '../../lib/defaultDashboardLayout.js';

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
  return sortRolesByPriority(user.roles.map((r) => r.role.code))[0] || 'user';
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

async function getSaleOrdersKpis() {
  try {
    const [totalAtivos, sumResult] = await Promise.all([
      prisma.saleOrder.count({ where: { status: { in: ['APPROVED', 'IN_PRODUCTION', 'DELIVERED', 'INVOICED'] } } }),
      prisma.saleOrder.aggregate({ _sum: { totalAmount: true }, where: { status: { notIn: ['DRAFT', 'CANCELLED'] } } }),
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

async function getSaleOrdersByMonth(monthsBack = 6) {
  try {
    const months = lastNMonths(monthsBack);
    const from = months[0]?.start ?? new Date();
    const rows = await prisma.$queryRaw<Array<{ ym: string; count: bigint; total: number }>>`
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
    getSaleOrdersKpis(),
    getWorkOrdersKpis(),
    getPurchaseOrdersKpis(),
    getEmployeesKpis(),
    getEntityId('cliente'),
    getWorkOrdersByMonth(6),
    getSaleOrdersByMonth(6),
  ]);

  const clientesPorMes = clienteId ? await countRecordsByMonth(clienteId, 6) : [];

  const unreadNotifRows = await prisma.userNotification.findMany({
    where: { userId, readAt: null },
    select: { sector: true },
    take: 2000,
  });
  const unreadNotifs = unreadNotifRows.filter((r) =>
    rolesCanSeeNotificationSector(r.sector, roleCodesForNotifs)
  ).length;

  const layout = await prisma.dashboardLayout.findUnique({ where: { userId } });

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
      unreadNotifs: String(unreadNotifs),
      series: {
        clientesPorMes,
        opsPorMes,
        vendasPorMes,
      },
    },
    layout: {
      widgets: layout?.widgets ?? [],
    },
  });
});

dashboardRouter.get('/layout', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const layout = await prisma.dashboardLayout.findUnique({ where: { userId } });
  res.json({ success: true, data: { widgets: layout?.widgets ?? [] } });
});

dashboardRouter.put('/layout', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const widgets = Array.isArray(req.body?.widgets) ? req.body.widgets : Array.isArray(req.body) ? req.body : null;
  if (!widgets) return res.status(400).json({ error: 'widgets deve ser um array' });

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

  const roleCode = sortRolesByPriority(user.roles.map((r) => r.role.code))[0] || 'user';
  const widgets = getDefaultDashboardWidgets(roleCode, user.sector);

  const saved = await prisma.dashboardLayout.upsert({
    where: { userId },
    update: { widgets },
    create: { userId, widgets },
  });

  res.json({ success: true, data: { widgets: saved.widgets } });
});

