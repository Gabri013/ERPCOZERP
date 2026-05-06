import crypto from 'crypto';
import { prisma } from '../infra/prisma.js';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  companyId: string;
}

export async function triggerWebhooks(companyId: string, event: string, data: any) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      companyId,
      active: true,
      events: { has: event },
    },
  });

  const payload: WebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
    companyId,
  };

  for (const webhook of webhooks) {
    try {
      const signature = generateSignature(JSON.stringify(payload), webhook.secret);

      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'User-Agent': 'ERP-COZ-Webhook/1.0',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(`Erro ao enviar webhook ${webhook.id}:`, error);
      // TODO: implementar retry e logging
    }
  }
}

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// API Key functions
export async function validateApiKey(key: string): Promise<{ companyId: string; permissions: string[] } | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    select: {
      companyId: true,
      permissions: true,
      active: true,
      expiresAt: true,
    },
  });

  if (!apiKey || !apiKey.active) return null;

  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    // Desativar chave expirada
    await prisma.apiKey.update({
      where: { key },
      data: { active: false },
    });
    return null;
  }

  // Atualizar lastUsedAt
  await prisma.apiKey.update({
    where: { key },
    data: { lastUsedAt: new Date() },
  });

  return {
    companyId: apiKey.companyId,
    permissions: apiKey.permissions,
  };
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}