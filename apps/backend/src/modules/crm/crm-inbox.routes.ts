import { Router } from 'express';
import { z } from 'zod';
import { requirePermission } from '../../middleware/auth.js';
import * as inbox from './crm-inbox.service.js';

export const crmInboxRouter = Router();
const gate = requirePermission(['ver_crm']);

const listQuery = z.object({
  status: z.string().optional(),
  responsavelId: z.string().uuid().optional(),
});

crmInboxRouter.get('/conversations', gate, async (req, res) => {
  try {
    const q = listQuery.safeParse(req.query);
    if (!q.success) return res.status(400).json({ error: 'Parâmetros inválidos' });
    const data = await inbox.listConversations({
      status: q.data.status,
      responsavelId: q.data.responsavelId,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmInboxRouter.get('/conversations/:id', gate, async (req, res) => {
  try {
    const row = await inbox.getConversationWithMessages(req.params.id);
    if (!row) return res.status(404).json({ error: 'Conversa não encontrada' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

const createConv = z.object({
  channel: z.string().min(1),
  contatoNome: z.string().min(1),
  contatoTelefone: z.string().min(1),
  contatoId: z.string().uuid().optional().nullable(),
  responsavelId: z.string().uuid().optional().nullable(),
});

crmInboxRouter.post('/conversations', gate, async (req, res) => {
  try {
    const p = createConv.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: 'Dados inválidos', details: p.error.flatten() });
    const data = await inbox.createManualConversation({
      ...p.data,
      userId: req.user?.userId,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

const postMessage = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1),
  messageType: z.string().optional(),
});

crmInboxRouter.post('/messages', gate, async (req, res) => {
  try {
    const p = postMessage.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: 'Dados inválidos', details: p.error.flatten() });
    const msg = await inbox.sendOutboundMessage({
      conversationId: p.data.conversationId,
      message: p.data.message,
      messageType: p.data.messageType,
      userId: req.user?.userId,
    });
    res.status(201).json({ success: true, data: msg });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

const assignBody = z.object({
  responsavelId: z.string().uuid().nullable(),
});

crmInboxRouter.patch('/conversations/:id/assign', gate, async (req, res) => {
  try {
    const p = assignBody.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: 'Dados inválidos' });
    const data = await inbox.assignConversation({
      conversationId: req.params.id,
      responsavelId: p.data.responsavelId,
      userId: req.user?.userId,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

const oppBody = z.object({
  titulo: z.string().optional(),
});

crmInboxRouter.post('/conversations/:id/opportunity', gate, async (req, res) => {
  try {
    const p = oppBody.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: 'Dados inválidos' });
    const data = await inbox.createOpportunityFromConversation({
      conversationId: req.params.id,
      titulo: p.data.titulo,
      userId: req.user?.userId,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});

crmInboxRouter.get('/inbox/alerts', gate, async (_req, res) => {
  try {
    const data = await inbox.getInboxAlerts();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro' });
  }
});
