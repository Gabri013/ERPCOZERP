import { Prisma } from '@prisma/client';
import { eventBus, ERP_EVENTS } from '../../lib/events.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../infra/prisma.js';

let handlersRegistered = false;

function padSeq(n: number, len = 5) {
  return String(n).padStart(len, '0');
}

async function nextWorkOrderNumber() {
  const year = new Date().getFullYear();
  const start = `OP-${year}-`;
  const rows = await prisma.workOrder.findMany({
    where: { number: { startsWith: start } },
    select: { number: true },
  });
  const re = new RegExp(`^OP-${year}-(\\d+)$`);
  let max = 0;
  for (const row of rows) {
    const m = row.number.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${start}${padSeq(max + 1)}`;
}

async function notifyCompanyUsers(companyId: string, type: string, text: string, sector: string) {
  const users = await prisma.user.findMany({
    where: { companyId, active: true },
    select: { id: true },
    take: 300,
  });
  if (!users.length) return;
  await prisma.userNotification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type,
      text,
      sector,
    })),
  });
}

async function notifyRoleUsers(companyId: string, roleCodes: string[], type: string, text: string, sector: string) {
  const users = await prisma.user.findMany({
    where: {
      companyId,
      active: true,
      roles: {
        some: {
          role: {
            code: { in: roleCodes },
          },
        },
      },
    },
    select: { id: true },
    take: 300,
  });
  if (!users.length) return;
  await prisma.userNotification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type,
      text,
      sector,
    })),
  });
}

export function registrarHandlersProducao() {
  if (handlersRegistered) return;
  handlersRegistered = true;

  eventBus.on(ERP_EVENTS.PEDIDO_APROVADO, (payload) => {
    void (async () => {
      try {
        const existing = await prisma.workOrder.findFirst({ where: { saleOrderId: payload.pedidoId } });
        if (existing) return;

        const number = await nextWorkOrderNumber();
        const created = await prisma.workOrder.create({
          data: {
            number,
            status: 'OPEN',
            saleOrderId: payload.pedidoId,
            companyId: payload.companyId,
            items: {
              create: payload.itens.map((i) => ({
                productId: i.productId,
                quantity: new Prisma.Decimal(i.quantidade),
              })),
            },
          },
        });

        eventBus.emit(ERP_EVENTS.OP_CRIADA, {
          opId: created.id,
          pedidoId: payload.pedidoId,
          companyId: payload.companyId,
        });
      } catch (error) {
        logger.error('Falha ao gerar OP para pedido aprovado', { error, payload });
      }
    })();
  });

  eventBus.on(ERP_EVENTS.OP_CONCLUIDA, (payload) => {
    void (async () => {
      try {
        await notifyCompanyUsers(
          payload.companyId,
          'info',
          `Ordem de produção ${payload.opId} concluída com sucesso`,
          'Produção',
        );
      } catch (error) {
        logger.error('Falha no handler de OP concluída', { error, payload });
      }
    })();
  });

  eventBus.on(ERP_EVENTS.PRODUTO_BOM_COMPLETO, (payload) => {
    void (async () => {
      try {
        await notifyRoleUsers(
          payload.companyId,
          ['gerente_producao'],
          'warning',
          `BOM de produto concluída: ${payload.productRecordId}`,
          'Produção',
        );
      } catch (error) {
        logger.error('Falha no handler de BOM completa', { error, payload });
      }
    })();
  });
}
