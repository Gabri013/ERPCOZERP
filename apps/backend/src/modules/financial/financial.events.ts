import { eventBus, ERP_EVENTS } from '../../lib/events.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../infra/prisma.js';

let handlersRegistered = false;

async function ensureEntity(code: string, name: string) {
  return prisma.entity.upsert({
    where: { code },
    update: {},
    create: { code, name },
  });
}

export function registrarHandlersFinanceiro() {
  if (handlersRegistered) return;
  handlersRegistered = true;

  eventBus.on(ERP_EVENTS.PEDIDO_ENTREGUE, (payload) => {
    void (async () => {
      try {
        const entity = await ensureEntity('conta_receber', 'Contas a Receber');
        await prisma.entityRecord.create({
          data: {
            entityId: entity.id,
            createdBy: null,
            updatedBy: null,
            data: {
              origem: 'pedido_entregue',
              companyId: payload.companyId,
              pedidoId: payload.pedidoId,
              customerId: payload.customerId,
              valor: payload.valorTotal,
              status: 'aberto',
              data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              descricao: `Receber do pedido ${payload.pedidoId}`,
            },
          },
        });
      } catch (error) {
        logger.error('Falha ao criar conta a receber via evento', { error, payload });
      }
    })();
  });

  eventBus.on(ERP_EVENTS.COMPRA_RECEBIDA, (payload) => {
    void (async () => {
      try {
        const entity = await ensureEntity('conta_pagar', 'Contas a Pagar');
        await prisma.entityRecord.create({
          data: {
            entityId: entity.id,
            createdBy: payload.userId ?? null,
            updatedBy: payload.userId ?? null,
            data: {
              origem: 'compra_recebida',
              companyId: payload.companyId,
              compraId: payload.compraId,
              supplierId: payload.supplierId,
              valor: payload.valorTotal,
              status: 'aberto',
              data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              descricao: `Pagar da compra ${payload.compraId}`,
            },
          },
        });
      } catch (error) {
        logger.error('Falha ao criar conta a pagar via evento', { error, payload });
      }
    })();
  });
}
