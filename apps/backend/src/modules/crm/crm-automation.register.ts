import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';
import {
  crmAutomationBus,
  type LeadCreatedPayload,
  type MessageReceivedPayload,
  type OpportunityStageChangedPayload,
  type OpportunityUpdatedPayload,
  type OrcamentoApprovedPayload,
} from './crm-events.js';
import { recordOpportunityStageChange } from './crm-analytics.service.js';
import { handleInboundMessageReceived } from './crm-inbox.service.js';
import { appendCrmLog } from './crm-log.service.js';
import { ENT, parseData } from './crm.service.js';
import { normalizeOpportunityStage } from './crm-constants.js';
import { opportunityHasFuturePendingActivity } from './crm-opportunity-activity.js';

let registered = false;

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

async function createAtividadeRecord(data: Record<string, unknown>, userId?: string | null) {
  // Get atividade entity directly by code (workaround for CTX requirement)
  const ent = await prisma.entity.findUnique({ where: { code: 'atividade' } });
  if (!ent) throw new Error('Entity atividade not found');
  const eid = ent.id;
  return prisma.entityRecord.create({
    data: {
      entityId: eid,
      data: data as Prisma.InputJsonValue,
      createdBy: userId ?? undefined,
      updatedBy: userId ?? undefined,
    },
  });
}

async function onLeadCreated(payload: LeadCreatedPayload) {
  const due = addDays(new Date(), 1);
  await createAtividadeRecord(
    {
      titulo: 'Primeiro contato automático',
      tipo: 'Follow-up',
      data_atividade: due.toISOString(),
      data: due.toISOString(),
      relacionamento: `lead:${payload.recordId}`,
      observacao: 'Gerado automaticamente ao criar o lead.',
      status: 'Pendente',
      oportunidade_id: '',
    },
    payload.userId,
  );

  await appendCrmLog({
    eventType: 'automation_activity_auto_created',
    entityCode: ENT.lead,
    entityRecordId: payload.recordId,
    userId: payload.userId,
    payload: { kind: 'lead_followup_d1', automation: 'lead_auto_activity' },
  });
}

async function onOpportunityUpdated(payload: OpportunityUpdatedPayload) {
  const prevSt = normalizeOpportunityStage(String(payload.previous.estagio ?? payload.previous.stage ?? ''));
  const nextSt = normalizeOpportunityStage(String(payload.next.estagio ?? payload.next.stage ?? ''));
  const stageChanged = prevSt !== nextSt;
  const hasFuture = await opportunityHasFuturePendingActivity(payload.recordId);

  if (!stageChanged && hasFuture) return;

  const row = await prisma.entityRecord.findUnique({ where: { id: payload.recordId } });
  if (!row || row.deletedAt) return;
  const cur = parseData(row.data);
  const merged = {
    ...cur,
    ...payload.next,
    precisa_atencao: true,
    crm_automation_atencao_em: new Date().toISOString(),
    crm_automation_motivo:
      stageChanged && !hasFuture
        ? 'estágio_alterado_sem_atividade_futura'
        : !hasFuture
          ? 'sem_atividade_futura'
          : 'estágio_alterado',
  };

  await prisma.entityRecord.update({
    where: { id: payload.recordId },
    data: { data: merged as Prisma.InputJsonValue, updatedBy: payload.userId ?? undefined },
  });

  await appendCrmLog({
    eventType: 'automation_opportunity_attention',
    entityCode: ENT.oportunidade,
    entityRecordId: payload.recordId,
    userId: payload.userId,
    payload: {
      automation: 'needs_attention',
      stageChanged,
      hadFutureActivity: hasFuture,
      from: prevSt,
      to: nextSt,
    },
  });
}

async function onOrcamentoApproved(payload: OrcamentoApprovedPayload) {
  const oppId = String(payload.oportunidadeId ?? '').trim();
  if (!oppId) return;

  const due = addDays(new Date(), 3);
  await createAtividadeRecord(
    {
      titulo: 'Acompanhamento pós-venda',
      tipo: 'Acompanhamento pós-venda',
      data_atividade: due.toISOString(),
      data: due.toISOString(),
      oportunidade_id: oppId,
      relacionamento: `orcamento:${payload.recordId}`,
      observacao: 'Venda concluída — acompanhamento iniciado (automático).',
      status: 'Pendente',
    },
    payload.userId,
  );

  await appendCrmLog({
    eventType: 'automation_orcamento_pos_venda',
    entityCode: 'orcamento',
    entityRecordId: payload.recordId,
    userId: payload.userId,
    payload: {
      automation: 'orcamento_aprovado_pos_venda',
      oportunidadeId: oppId,
      logMessage: 'Venda concluída - acompanhamento iniciado',
      numero: payload.numero ?? null,
    },
  });
}

/** Regista handlers uma vez (crmAutomationBus). */
export function registerCrmAutomationHandlers() {
  if (registered) return;
  registered = true;

  crmAutomationBus.on('lead.created', (p: LeadCreatedPayload) => {
    void onLeadCreated(p).catch(() => undefined);
  });

  crmAutomationBus.on('opportunity.updated', (p: OpportunityUpdatedPayload) => {
    void onOpportunityUpdated(p).catch(() => undefined);
  });

  crmAutomationBus.on('orcamento.approved', (p: OrcamentoApprovedPayload) => {
    void onOrcamentoApproved(p).catch(() => undefined);
  });

  crmAutomationBus.on('message.received', (p: MessageReceivedPayload) => {
    void handleInboundMessageReceived(p).catch(() => undefined);
  });

  crmAutomationBus.on('opportunity.stage.changed', (p: OpportunityStageChangedPayload) => {
    void recordOpportunityStageChange(p).catch(() => undefined);
  });
}
