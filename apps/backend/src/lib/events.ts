import EventEmitter from 'node:events';
import { logger } from './logger.js';

export const ERP_EVENTS = {
  PEDIDO_APROVADO: 'pedido.aprovado',
  PEDIDO_ENTREGUE: 'pedido.entregue',
  OP_CRIADA: 'op.criada',
  OP_CONCLUIDA: 'op.concluida',
  COMPRA_RECEBIDA: 'compra.recebida',
  ESTOQUE_CRITICO: 'estoque.critico',
  PAGAMENTO_RECEBIDO: 'pagamento.recebido',
  CONTA_VENCENDO: 'conta.vencendo',
} as const;

export type ERPEvent = (typeof ERP_EVENTS)[keyof typeof ERP_EVENTS];

type EventPayloadMap = {
  [ERP_EVENTS.PEDIDO_APROVADO]: {
    pedidoId: string;
    companyId: string;
    userId: string;
    itens: Array<{ productId: string; quantidade: number }>;
  };
  [ERP_EVENTS.PEDIDO_ENTREGUE]: {
    pedidoId: string;
    companyId: string;
    valorTotal: number;
    customerId: string | null;
  };
  [ERP_EVENTS.OP_CRIADA]: {
    opId: string;
    pedidoId: string;
    companyId: string;
  };
  [ERP_EVENTS.OP_CONCLUIDA]: {
    opId: string;
    companyId: string;
    userId?: string | null;
  };
  [ERP_EVENTS.COMPRA_RECEBIDA]: {
    compraId: string;
    companyId: string;
    valorTotal: number;
    supplierId: string;
    userId?: string | null;
    itens: Array<{ productId: string; quantidade: number }>;
  };
  [ERP_EVENTS.ESTOQUE_CRITICO]: {
    productId: string;
    nomeProduto: string;
    estoqueAtual: number;
    estoqueMinimo: number;
    companyId: string;
  };
  [ERP_EVENTS.PAGAMENTO_RECEBIDO]: {
    companyId: string;
    recordId: string;
    valor: number;
  };
  [ERP_EVENTS.CONTA_VENCENDO]: {
    companyId: string;
    recordId: string;
    dias: number;
  };
};

class ERPEventBus extends EventEmitter {
  emit<E extends ERPEvent>(event: E, payload: EventPayloadMap[E]): boolean {
    logger.info('Evento emitido', { event, payload });
    return super.emit(event, payload);
  }

  on<E extends ERPEvent>(event: E, listener: (payload: EventPayloadMap[E]) => void): this {
    return super.on(event, listener);
  }

  off<E extends ERPEvent>(event: E, listener: (payload: EventPayloadMap[E]) => void): this {
    return super.off(event, listener);
  }
}

export const eventBus = new ERPEventBus();
eventBus.setMaxListeners(50);
