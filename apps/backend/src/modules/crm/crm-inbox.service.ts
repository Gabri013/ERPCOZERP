import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

/** Cliente Prisma após `npx prisma generate` (modelos CrmConversation / CrmMessage). */
const db = prisma as unknown as {
  crmConversation: {
    findFirst: (args: unknown) => Promise<any>;
    findUnique: (args: unknown) => Promise<any>;
    findMany: (args: unknown) => Promise<any[]>;
    create: (args: unknown) => Promise<any>;
    update: (args: unknown) => Promise<any>;
  };
  crmMessage: {
    create: (args: unknown) => Promise<any>;
  };
};
import { appendCrmLog } from './crm-log.service.js';
import {
  emitLeadCreated,
  emitMessageReceived,
  type MessageReceivedPayload,
} from './crm-events.js';
import { assignLeadResponsavelIfEmpty } from './crm-assignment.service.js';

const LEAD_ENTITY = 'crm_lead';
const OPP_ENTITY = 'crm_oportunidade';

export const INBOX_CHANNELS = ['whatsapp', 'instagram', 'facebook', 'manual'] as const;
export type InboxChannel = (typeof INBOX_CHANNELS)[number];

export const CONVERSATION_STATUSES = ['novo', 'em_atendimento', 'finalizado'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export function normalizePhoneDigits(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

function channelToLeadOrigem(channel: string): string {
  const c = String(channel || '').toLowerCase();
  if (c === 'whatsapp') return 'WhatsApp';
  if (c === 'instagram') return 'Instagram';
  if (c === 'facebook') return 'Facebook';
  return 'Outro';
}

function parseLeadData(data: Prisma.JsonValue): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  return {};
}

/** Últimos dígitos para matching flexível. */
function phoneSuffix(digits: string, n = 10): string {
  const d = normalizePhoneDigits(digits);
  return d.length <= n ? d : d.slice(-n);
}

export async function findLeadIdByNormalizedPhone(norm: string): Promise<string | null> {
  const ent = await prisma.entity.findUnique({ where: { code: LEAD_ENTITY } });
  if (!ent) return null;
  const suf = phoneSuffix(norm);
  if (!suf) return null;
  const rows = await prisma.entityRecord.findMany({
    where: { entityId: ent.id, deletedAt: null },
    select: { id: true, data: true },
    take: 3000,
  });
  for (const r of rows) {
    const d = parseLeadData(r.data);
    const tel = normalizePhoneDigits(String(d.telefone ?? d.phone ?? ''));
    if (!tel) continue;
    if (tel === norm || phoneSuffix(tel) === suf || tel.endsWith(suf) || suf.endsWith(phoneSuffix(tel))) {
      return r.id;
    }
  }
  return null;
}

export async function createInboxLead(params: {
  nome: string;
  telefoneNorm: string;
  channel: string;
  userId?: string | null;
}): Promise<string> {
  const entity = await prisma.entity.findUnique({ where: { code: LEAD_ENTITY } });
  if (!entity) throw new Error('Entidade crm_lead não configurada');

  const mergedData: Record<string, unknown> = {
    nome: params.nome || 'Contato',
    telefone: params.telefoneNorm,
    origem: channelToLeadOrigem(params.channel),
    qualificacao: 'Morno',
  };
  await assignLeadResponsavelIfEmpty(mergedData);
  delete (mergedData as { _crmAutoAssignMeta?: unknown })._crmAutoAssignMeta;

  const created = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      data: mergedData as Prisma.InputJsonValue,
      createdBy: params.userId ?? undefined,
      updatedBy: params.userId ?? undefined,
    },
  });

  emitLeadCreated({ recordId: created.id, userId: params.userId, data: mergedData });

  await appendCrmLog({
    eventType: 'inbox_lead_auto_created',
    entityCode: LEAD_ENTITY,
    entityRecordId: created.id,
    userId: params.userId,
    payload: { channel: params.channel, telefone: params.telefoneNorm, automation: 'inbox' },
  });

  return created.id;
}

function assertChannel(c: string): asserts c is InboxChannel {
  if (!INBOX_CHANNELS.includes(c as InboxChannel)) {
    throw new Error(`Canal inválido. Use: ${INBOX_CHANNELS.join(', ')}`);
  }
}

function assertStatus(s: string): asserts s is ConversationStatus {
  if (!CONVERSATION_STATUSES.includes(s as ConversationStatus)) {
    throw new Error(`Status inválido. Use: ${CONVERSATION_STATUSES.join(', ')}`);
  }
}

/** Processa mensagem inbound (webhook ou bus `message.received`). */
export async function handleInboundMessageReceived(
  params: MessageReceivedPayload,
): Promise<{ conversationId: string; messageId: string; leadId: string | null; leadCreated: boolean }> {
  const channel = String(params.channel || 'manual').toLowerCase() as InboxChannel;
  assertChannel(channel);
  const phoneNorm = normalizePhoneDigits(params.contatoTelefone);
  if (!phoneNorm) throw new Error('contatoTelefone é obrigatório');

  const preview = String(params.message || '').slice(0, 500);
  const nome = String(params.contatoNome || 'Contato').slice(0, 500);

  let conv = await db.crmConversation.findFirst({
    where: { channel, contatoTelefone: phoneNorm },
  });

  let leadCreated = false;
  let leadId: string | null = null;

  if (!conv) {
    const leadOnCreate = await findLeadIdByNormalizedPhone(phoneNorm);
    conv = await db.crmConversation.create({
      data: {
        channel,
        contatoNome: nome,
        contatoTelefone: phoneNorm,
        contatoId: params.contatoId ?? undefined,
        leadId: leadOnCreate ?? undefined,
        status: 'novo',
        lastMessagePreview: preview || null,
        lastMessageAt: new Date(),
        lastInboundAt: new Date(),
      },
    });
    await appendCrmLog({
      eventType: 'inbox_conversation_created',
      entityCode: 'crm_conversation',
      entityRecordId: conv.id,
      userId: params.userId,
      payload: { channel, phone: phoneNorm, automation: 'inbound' },
    });
  }

  if (!conv.leadId) {
    leadId = await findLeadIdByNormalizedPhone(phoneNorm);
    if (!leadId) {
      leadId = await createInboxLead({
        nome,
        telefoneNorm: phoneNorm,
        channel,
        userId: params.userId,
      });
      leadCreated = true;
    }
    await db.crmConversation.update({
      where: { id: conv.id },
      data: { leadId, status: conv.status === 'finalizado' ? conv.status : 'em_atendimento' },
    });
  }

  const msg = await db.crmMessage.create({
    data: {
      conversationId: conv.id,
      direction: 'inbound',
      message: String(params.message || ''),
      messageType: String(params.messageType || 'text').slice(0, 32),
      externalId: params.externalId ?? undefined,
    },
  });

  await db.crmConversation.update({
    where: { id: conv.id },
    data: {
      lastInboundAt: new Date(),
      lastMessageAt: new Date(),
      lastMessagePreview: preview || null,
      status: conv.status === 'novo' ? 'em_atendimento' : undefined,
    },
  });

  await appendCrmLog({
    eventType: 'inbox_message_received',
    entityCode: 'crm_conversation',
    entityRecordId: conv.id,
    userId: params.userId,
    payload: {
      messageId: msg.id,
      direction: 'inbound',
      preview,
      externalId: params.externalId ?? null,
    },
  });

  const fresh = await db.crmConversation.findUnique({ where: { id: conv.id } });
  return {
    conversationId: conv.id,
    messageId: msg.id,
    leadId: fresh?.leadId ?? null,
    leadCreated,
  };
}

export async function listConversations(filters: {
  status?: string;
  responsavelId?: string;
  take?: number;
}) {
  const take = Math.min(200, Math.max(1, filters.take ?? 80));
  const where: Record<string, unknown> = {};
  if (filters.status) {
    assertStatus(filters.status);
    where.status = filters.status;
  }
  if (filters.responsavelId) where.responsavelId = filters.responsavelId;

  const rows = await db.crmConversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    take,
    include: {
      responsavel: { select: { id: true, fullName: true, email: true } },
    },
  });
  return rows;
}

export async function getConversationWithMessages(id: string) {
  const conv = await db.crmConversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 500 },
      responsavel: { select: { id: true, fullName: true, email: true } },
    },
  });
  return conv;
}

export async function createManualConversation(params: {
  channel: string;
  contatoNome: string;
  contatoTelefone: string;
  contatoId?: string | null;
  responsavelId?: string | null;
  userId?: string | null;
}) {
  const channel = String(params.channel || 'manual').toLowerCase() as InboxChannel;
  assertChannel(channel);
  const phoneNorm = normalizePhoneDigits(params.contatoTelefone);
  if (!phoneNorm) throw new Error('contatoTelefone é obrigatório');

  const existing = await db.crmConversation.findFirst({
    where: { channel, contatoTelefone: phoneNorm },
  });
  if (existing) throw new Error('Já existe conversa para este canal e telefone');

  let leadId = await findLeadIdByNormalizedPhone(phoneNorm);
  if (!leadId) {
    leadId = await createInboxLead({
      nome: params.contatoNome,
      telefoneNorm: phoneNorm,
      channel,
      userId: params.userId,
    });
  }

  const conv = await db.crmConversation.create({
    data: {
      channel,
      contatoNome: params.contatoNome,
      contatoTelefone: phoneNorm,
      contatoId: params.contatoId ?? undefined,
      leadId,
      responsavelId: params.responsavelId ?? undefined,
      status: 'novo',
    },
  });

  await appendCrmLog({
    eventType: 'inbox_conversation_manual',
    entityCode: 'crm_conversation',
    entityRecordId: conv.id,
    userId: params.userId,
    payload: { channel },
  });

  return conv;
}

export async function sendOutboundMessage(params: {
  conversationId: string;
  message: string;
  messageType?: string;
  userId?: string | null;
}) {
  const conv = await db.crmConversation.findUnique({ where: { id: params.conversationId } });
  if (!conv) throw new Error('Conversa não encontrada');

  const preview = String(params.message || '').slice(0, 500);
  const msg = await db.crmMessage.create({
    data: {
      conversationId: params.conversationId,
      direction: 'outbound',
      message: String(params.message || ''),
      messageType: String(params.messageType || 'text').slice(0, 32),
    },
  });

  await db.crmConversation.update({
    where: { id: params.conversationId },
    data: {
      lastOutboundAt: new Date(),
      lastMessageAt: new Date(),
      lastMessagePreview: preview || null,
      status: conv.status === 'finalizado' ? conv.status : 'em_atendimento',
    },
  });

  await appendCrmLog({
    eventType: 'inbox_message_sent',
    entityCode: 'crm_conversation',
    entityRecordId: params.conversationId,
    userId: params.userId,
    payload: { messageId: msg.id, direction: 'outbound', preview },
  });

  return msg;
}

export async function assignConversation(params: {
  conversationId: string;
  responsavelId: string | null;
  userId?: string | null;
}) {
  const updated = await db.crmConversation.update({
    where: { id: params.conversationId },
    data: { responsavelId: params.responsavelId ?? undefined },
  });
  await appendCrmLog({
    eventType: 'inbox_conversation_assigned',
    entityCode: 'crm_conversation',
    entityRecordId: params.conversationId,
    userId: params.userId,
    payload: { responsavelId: params.responsavelId },
  });
  return updated;
}

export async function createOpportunityFromConversation(params: {
  conversationId: string;
  titulo?: string;
  userId?: string | null;
}) {
  const conv = await db.crmConversation.findUnique({ where: { id: params.conversationId } });
  if (!conv) throw new Error('Conversa não encontrada');
  if (conv.opportunityId) throw new Error('Conversa já possui oportunidade vinculada');

  const ent = await prisma.entity.findUnique({ where: { code: OPP_ENTITY } });
  if (!ent) throw new Error('Entidade crm_oportunidade não configurada');

  const titulo =
    (params.titulo && String(params.titulo).trim()) ||
    `Oportunidade — ${conv.contatoNome}`.slice(0, 200);

  const data: Record<string, unknown> = {
    titulo,
    empresa: conv.contatoNome,
    contato: conv.contatoNome,
    valor: 0,
    estagio: 'Novo',
    probabilidade: 10,
    responsavelId: conv.responsavelId ?? params.userId ?? undefined,
    orcamento_id: '',
    pedido_id: '',
  };

  const opp = await prisma.entityRecord.create({
    data: {
      entityId: ent.id,
      data: data as Prisma.InputJsonValue,
      createdBy: params.userId ?? undefined,
      updatedBy: params.userId ?? undefined,
    },
  });

  await db.crmConversation.update({
    where: { id: conv.id },
    data: { opportunityId: opp.id },
  });

  await appendCrmLog({
    eventType: 'inbox_opportunity_created',
    entityCode: OPP_ENTITY,
    entityRecordId: opp.id,
    userId: params.userId,
    payload: { conversationId: conv.id },
  });

  return opp;
}

const NO_RESPONSE_MS = 60 * 60 * 1000;

export async function getInboxAlerts() {
  const now = Date.now();
  const rows = await db.crmConversation.findMany({
    where: { status: { not: 'finalizado' } },
    select: {
      id: true,
      contatoNome: true,
      channel: true,
      responsavelId: true,
      lastInboundAt: true,
      lastOutboundAt: true,
      lastMessageAt: true,
      lastMessagePreview: true,
    },
    take: 300,
  });

  const semResponsavel = rows.filter((r: { responsavelId?: string | null }) => !r.responsavelId);

  const semResposta: typeof rows = [];
  for (const r of rows) {
    if (!r.lastInboundAt) continue;
    const out = r.lastOutboundAt?.getTime() ?? 0;
    const inc = r.lastInboundAt.getTime();
    if (inc > out && now - inc > NO_RESPONSE_MS) semResposta.push(r);
  }

  return { semResponsavel, semRespostaHaMaisDe1h: semResposta };
}

/** Dispara o barramento (webhook / testes) sem processar inline. */
export function dispatchMessageReceived(payload: MessageReceivedPayload) {
  emitMessageReceived(payload);
}
