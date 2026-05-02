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

dashboardRouter.get('/', async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const roleCode = await getUserPrimaryRoleCode(userId);
  const sector = inferSectorFromRole(roleCode);
  const jwtRoles = Array.isArray((req as { user?: { roles?: string[] } }).user?.roles)
    ? (req as { user: { roles: string[] } }).user.roles
    : [];
  const roleCodesForNotifs = jwtRoles.length > 0 ? jwtRoles : roleCode ? [roleCode] : [];

  const [totalClientes, totalProdutos, totalOPs, totalOCs] = await Promise.all([
    countClientesAtivos(),
    countEntity('produto'),
    countEntity('ordem_producao'),
    countEntity('ordem_compra'),
  ]);

  // Vendas ainda não modelado no core novo (por enquanto 0)
  const totalVendas = 'R$ 0';

  const layout = await prisma.dashboardLayout.findUnique({ where: { userId } });

  const [produtoId, clienteId, opId] = await Promise.all([
    getEntityId('produto'),
    getEntityId('cliente'),
    getEntityId('ordem_producao'),
  ]);

  const [produtosPorMes, clientesPorMes, opsPorMes] = await Promise.all([
    produtoId ? countRecordsByMonth(produtoId, 6) : Promise.resolve([]),
    clienteId ? countRecordsByMonth(clienteId, 6) : Promise.resolve([]),
    opId ? countRecordsByMonth(opId, 6) : Promise.resolve([]),
  ]);

  const unreadNotifRows = await prisma.userNotification.findMany({
    where: { userId, readAt: null },
    select: { sector: true },
    take: 2000,
  });
  const unreadNotifs = unreadNotifRows.filter((r) =>
    rolesCanSeeNotificationSector(r.sector, roleCodesForNotifs)
  ).length;

  res.json({
    success: true,
    data: {
      totalVendas,
      totalOPs: String(totalOPs),
      totalProdutos: String(totalProdutos),
      totalClientes: String(totalClientes),
      totalOCs: String(totalOCs),
      roleCode,
      sector,
      unreadNotifs: String(unreadNotifs),
      series: {
        produtosPorMes,
        clientesPorMes,
        opsPorMes,
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

