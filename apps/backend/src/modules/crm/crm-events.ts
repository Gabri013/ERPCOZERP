import { EventEmitter } from 'events';

/** Barramento simples para automações futuras (webhooks, bots, inbox). */
export const crmAutomationBus = new EventEmitter();
crmAutomationBus.setMaxListeners(50);

export type LeadCreatedPayload = {
  recordId: string;
  userId?: string | null;
  data: Record<string, unknown>;
};

export type OpportunityUpdatedPayload = {
  recordId: string;
  userId?: string | null;
  previous: Record<string, unknown>;
  next: Record<string, unknown>;
};

export type OrcamentoApprovedPayload = {
  recordId: string;
  userId?: string | null;
  oportunidadeId?: string;
  numero?: string;
};

export type OpportunityStageChangedPayload = {
  recordId: string;
  userId?: string | null;
  from: string;
  to: string;
  data: Record<string, unknown>;
};

/** Inbox / Meta stub — inbound message normalizado. */
export type MessageReceivedPayload = {
  channel: string;
  contatoTelefone: string;
  contatoNome: string;
  message: string;
  messageType?: string;
  externalId?: string | null;
  contatoId?: string | null;
  userId?: string | null;
};

export function emitLeadCreated(payload: LeadCreatedPayload) {
  crmAutomationBus.emit('lead.created', payload);
}

export function emitOpportunityUpdated(payload: OpportunityUpdatedPayload) {
  crmAutomationBus.emit('opportunity.updated', payload);
}

export function emitOpportunityStageChanged(payload: OpportunityStageChangedPayload) {
  crmAutomationBus.emit('opportunity.stage.changed', payload);
}

export function emitOrcamentoApproved(payload: OrcamentoApprovedPayload) {
  crmAutomationBus.emit('orcamento.approved', payload);
}

export function emitMessageReceived(payload: MessageReceivedPayload) {
  crmAutomationBus.emit('message.received', payload);
}
