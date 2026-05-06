import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../../infra/prisma.js';
import { validate } from '../../middleware/validate.js';
import { generateApiKey, validateApiKey } from './webhook.service.js';

export const webhooksRouter = Router();

// Middleware para API Key auth
export function apiKeyAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'API Key required' });
  }

  const key = authHeader.substring(7);
  const validation = validateApiKey(key);

  if (!validation) {
    return res.status(401).json({ error: 'Invalid API Key' });
  }

  req.apiKey = validation;
  next();
}

// API Keys management
webhooksRouter.get('/api-keys', async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const apiKeys = await prisma.apiKey.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        permissions: true,
        active: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    res.json({ success: true, data: apiKeys });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

webhooksRouter.post('/api-keys', [
  body('name').isLength({ min: 1 }).withMessage('Nome obrigatório'),
  body('permissions').isArray().withMessage('Permissões obrigatórias'),
  body('expiresAt').optional().isISO8601(),
], validate, async (req, res) => {
  try {
    const { name, permissions, expiresAt } = req.body;
    const companyId = req.user?.companyId;

    const key = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        companyId,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        active: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    res.status(201).json({ success: true, data: apiKey });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

webhooksRouter.patch('/api-keys/:id', [
  body('active').optional().isBoolean(),
  body('permissions').optional().isArray(),
], validate, async (req, res) => {
  try {
    const { id } = req.params;
    const { active, permissions } = req.body;
    const companyId = req.user?.companyId;

    const apiKey = await prisma.apiKey.update({
      where: { id, companyId },
      data: {
        ...(active !== undefined && { active }),
        ...(permissions && { permissions }),
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        active: true,
        expiresAt: true,
        lastUsedAt: true,
      },
    });

    res.json({ success: true, data: apiKey });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'API Key não encontrada' });
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});

webhooksRouter.delete('/api-keys/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    await prisma.apiKey.delete({
      where: { id, companyId },
    });

    res.json({ success: true });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'API Key não encontrada' });
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Webhooks management
webhooksRouter.get('/webhooks', async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const webhooks = await prisma.webhook.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: webhooks });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

webhooksRouter.post('/webhooks', [
  body('name').isLength({ min: 1 }).withMessage('Nome obrigatório'),
  body('url').isURL().withMessage('URL válida obrigatória'),
  body('events').isArray().withMessage('Eventos obrigatórios'),
], validate, async (req, res) => {
  try {
    const { name, url, events } = req.body;
    const companyId = req.user?.companyId;

    const secret = generateApiKey(); // Reuse function for secret

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events,
        companyId,
        secret,
      },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
      },
    });

    res.status(201).json({ success: true, data: { ...webhook, secret } });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

webhooksRouter.patch('/webhooks/:id', [
  body('active').optional().isBoolean(),
  body('events').optional().isArray(),
], validate, async (req, res) => {
  try {
    const { id } = req.params;
    const { active, events } = req.body;
    const companyId = req.user?.companyId;

    const webhook = await prisma.webhook.update({
      where: { id, companyId },
      data: {
        ...(active !== undefined && { active }),
        ...(events && { events }),
      },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: webhook });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Webhook não encontrado' });
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});

webhooksRouter.delete('/webhooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    await prisma.webhook.delete({
      where: { id, companyId },
    });

    res.json({ success: true });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Webhook não encontrado' });
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});