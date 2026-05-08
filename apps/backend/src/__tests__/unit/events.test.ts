import { describe, expect, it, vi } from 'vitest';
import { eventBus, ERP_EVENTS } from '../../lib/events.js';

describe('ERPEventBus', () => {
  it('emite e recebe eventos corretamente', () => {
    const handler = vi.fn();
    eventBus.on(ERP_EVENTS.PEDIDO_APROVADO, handler);

    eventBus.emit(ERP_EVENTS.PEDIDO_APROVADO, {
      pedidoId: 'p1',
      companyId: 'c1',
      userId: 'u1',
      itens: [],
    });

    expect(handler).toHaveBeenCalledWith({
      pedidoId: 'p1',
      companyId: 'c1',
      userId: 'u1',
      itens: [],
    });

    eventBus.off(ERP_EVENTS.PEDIDO_APROVADO, handler);
  });

  it('handlers async com erro nao quebram o fluxo de emissao', () => {
    const handler = vi.fn(async () => {
      throw new Error('falha');
    });

    eventBus.on(ERP_EVENTS.OP_CONCLUIDA, handler);

    expect(() => {
      eventBus.emit(ERP_EVENTS.OP_CONCLUIDA, {
        opId: 'op1',
        companyId: 'c1',
        userId: 'u1',
      });
    }).not.toThrow();

    eventBus.off(ERP_EVENTS.OP_CONCLUIDA, handler);
  });
});