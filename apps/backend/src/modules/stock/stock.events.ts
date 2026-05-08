import { Prisma } from '@prisma/client';
import { eventBus, ERP_EVENTS } from '../../lib/events.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../infra/prisma.js';

let handlersRegistered = false;

async function defaultLocation() {
  const existing = await prisma.location.findUnique({ where: { code: 'DEFAULT' } });
  if (existing) return existing;
  return prisma.location.create({
    data: {
      code: 'DEFAULT',
      name: 'Depósito principal',
      warehouse: 'Principal',
      active: true,
    },
  });
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

export function registrarHandlersEstoque() {
  if (handlersRegistered) return;
  handlersRegistered = true;

  eventBus.on(ERP_EVENTS.COMPRA_RECEBIDA, (payload) => {
    void (async () => {
      try {
        const loc = await defaultLocation();

        for (const item of payload.itens) {
          const product = await prisma.product.findFirst({
            where: { id: item.productId, companyId: payload.companyId },
            select: { id: true, name: true, minStock: true },
          });
          if (!product) continue;

          const qty = new Prisma.Decimal(item.quantidade);

          const row = await prisma.productLocation.findFirst({
            where: { productId: product.id, locationId: loc.id, product: { companyId: payload.companyId } },
            select: { id: true, quantity: true },
          });

          if (!row) {
            await prisma.productLocation.create({
              data: { productId: product.id, locationId: loc.id, quantity: qty },
            });
          } else {
            await prisma.productLocation.update({
              where: { id: row.id },
              data: { quantity: row.quantity.add(qty) },
            });
          }

          await prisma.stockMovement.create({
            data: {
              productId: product.id,
              locationId: loc.id,
              type: 'ENTRADA',
              quantity: qty,
              reference: payload.compraId,
              notes: `Recebimento compra ${payload.compraId}`,
              userId: payload.userId ?? null,
            },
          });

          const allLocations = await prisma.productLocation.findMany({
            where: { productId: product.id, product: { companyId: payload.companyId } },
            select: { quantity: true },
          });
          const totalQty = allLocations.reduce((acc, l) => acc + l.quantity.toNumber(), 0);
          const minStock = product.minStock.toNumber();

          if (totalQty < minStock) {
            eventBus.emit(ERP_EVENTS.ESTOQUE_CRITICO, {
              productId: product.id,
              nomeProduto: product.name,
              estoqueAtual: totalQty,
              estoqueMinimo: minStock,
              companyId: payload.companyId,
            });
          }
        }
      } catch (error) {
        logger.error('Falha na entrada de estoque por compra', { error, payload });
      }
    })();
  });

  eventBus.on(ERP_EVENTS.ESTOQUE_CRITICO, (payload) => {
    void (async () => {
      try {
        await notifyCompanyUsers(
          payload.companyId,
          'warning',
          `${payload.nomeProduto}: ${payload.estoqueAtual} un. (mínimo: ${payload.estoqueMinimo})`,
          'Estoque',
        );
      } catch (error) {
        logger.error('Falha ao notificar estoque crítico', { error, payload });
      }
    })();
  });
}
