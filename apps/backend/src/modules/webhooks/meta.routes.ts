import { Router } from 'express';
import { appendCrmLog } from '../crm/crm-log.service.js';
import { emitMessageReceived, type MessageReceivedPayload } from '../crm/crm-events.js';
import { logInfo } from '../../infra/logger.js';

export const metaWebhookRouter = Router();

const SYSTEM_LOG_ENTITY = 'meta_webhook';
const SYSTEM_LOG_ID = '00000000-0000-4000-8000-000000000001';

function extractInboundPayload(body: unknown): MessageReceivedPayload | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.from === 'string' && b.text !== undefined) {
    return {
      channel: String(b.channel || 'whatsapp'),
      contatoTelefone: b.from,
      contatoNome: String(b.profileName ?? b.name ?? 'Contato'),
      message: String(b.text),
      messageType: typeof b.messageType === 'string' ? b.messageType : 'text',
      externalId: typeof b.messageId === 'string' ? b.messageId : null,
      contatoId: null,
      userId: null,
    };
  }
  const entry = Array.isArray(b.entry) ? b.entry[0] : null;
  const changes = entry && typeof entry === 'object' && Array.isArray((entry as { changes?: unknown }).changes)
    ? (entry as { changes: unknown[] }).changes[0]
    : null;
  const value =
    changes && typeof changes === 'object' && (changes as { value?: unknown }).value
      ? ((changes as { value: Record<string, unknown> }).value as Record<string, unknown>)
      : null;
  const messages = value && Array.isArray(value.messages) ? value.messages : null;
  const msg = messages && messages[0] && typeof messages[0] === 'object' ? (messages[0] as Record<string, unknown>) : null;
  if (!msg) return null;
  const from = typeof msg.from === 'string' ? msg.from : '';
  const text =
    typeof (msg as { text?: { body?: string } }).text?.body === 'string'
      ? (msg as { text: { body: string } }).text.body
      : typeof msg.body === 'string'
        ? msg.body
        : '';
  if (!from || !text) return null;
  const contacts = value && Array.isArray(value.contacts) ? value.contacts : [];
  const c0 = contacts[0] && typeof contacts[0] === 'object' ? (contacts[0] as Record<string, unknown>) : null;
  const profile =
    c0?.profile && typeof c0.profile === 'object' ? (c0.profile as Record<string, unknown>) : null;
  const profileName = typeof profile?.name === 'string' ? profile.name : 'Contato';
  return {
    channel: 'whatsapp',
    contatoTelefone: from,
    contatoNome: profileName,
    message: text,
    messageType: 'text',
    externalId: typeof msg.id === 'string' ? msg.id : null,
    contatoId: null,
    userId: null,
  };
}

metaWebhookRouter.post('/meta', async (req, res) => {
  const secret = process.env.META_WEBHOOK_SECRET?.trim();
  if (secret) {
    const hdr = String(req.get('x-meta-webhook-secret') || req.get('x-webhook-secret') || '');
    if (hdr !== secret) {
      return res.status(401).json({ error: 'Webhook secret inválido' });
    }
  }

  const payload = extractInboundPayload(req.body);
  if (!payload) {
    logInfo('[webhooks/meta] payload não reconhecido (stub)', { keys: req.body && typeof req.body === 'object' ? Object.keys(req.body as object) : [] });
    await appendCrmLog({
      eventType: 'meta_webhook_unparsed',
      entityCode: SYSTEM_LOG_ENTITY,
      entityRecordId: SYSTEM_LOG_ID,
      userId: null,
      payload: { bodyType: typeof req.body },
    });
    return res.status(400).json({
      error: 'Payload inválido. Use formato stub: { from, text, channel?, profileName?, messageId? }',
    });
  }

  await appendCrmLog({
    eventType: 'meta_webhook_received',
    entityCode: SYSTEM_LOG_ENTITY,
    entityRecordId: SYSTEM_LOG_ID,
    userId: null,
    payload: { channel: payload.channel, preview: String(payload.message).slice(0, 120) },
  });

  emitMessageReceived(payload);
  return res.status(202).json({ ok: true, accepted: true });
});
