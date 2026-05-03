import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';
import { appendCrmLog } from '../crm/crm-log.service.js';
import { emitOrcamentoApproved } from '../crm/crm-events.js';

export const orcamentosRouter = Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function bypassOportunidadeObrigatoria(req: { user?: { roles?: string[]; permissions?: string[] } }): boolean {
  const r = req.user?.roles ?? [];
  const p = req.user?.permissions ?? [];
  return r.includes('master') || p.includes('editar_config') || p.includes('gerenciar_usuarios');
}

function flattenOrcamentoPayload(body: unknown): Record<string, unknown> {
  const raw = body && typeof body === 'object' && 'data' in body && (body as { data?: unknown }).data
    ? (body as { data: Record<string, unknown> }).data
    : (body as Record<string, unknown>);
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
}

async function assertOportunidadeExists(oportunidadeId: string) {
  const ent = await prisma.entity.findUnique({ where: { code: 'crm_oportunidade' } });
  if (!ent) return;
  const row = await prisma.entityRecord.findFirst({
    where: { id: oportunidadeId, entityId: ent.id, deletedAt: null },
  });
  if (!row) throw new Error('oportunidade_id não encontrado no CRM');
}

async function ensureEntity() {
  return prisma.entity.upsert({
    where: { code: 'orcamento' },
    update: {},
    create: { code: 'orcamento', name: 'Orçamentos' },
  });
}

function normalizeStr(v: unknown) {
  return String(v || '').trim();
}

function nextNumero(existing: any[]) {
  const nums = existing
    .map((r) => String(r.numero || ''))
    .map((n) => {
      const m = n.match(/ORC-(\d+)/i);
      return m ? Number(m[1]) : NaN;
    })
    .filter((n) => Number.isFinite(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `ORC-${String(next).padStart(5, '0')}`;
}

orcamentosRouter.get('/', async (req, res) => {
  const entity = await ensureEntity();
  const search = normalizeStr(req.query.search);
  const status = normalizeStr(req.query.status);
  const take = Math.min(200, Math.max(1, Number(req.query.limit || 200)));

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take,
  });

  const data = rows
    .map((r) => ({ id: r.id, ...(r.data as any) }))
    .filter((o) => {
      if (status && String(o.status || '') !== status) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        String(o.numero || '').toLowerCase().includes(s) ||
        String(o.cliente_nome || '').toLowerCase().includes(s)
      );
    });

  res.json({ success: true, data });
});

orcamentosRouter.post('/', async (req, res) => {
  const entity = await ensureEntity();
  const data = flattenOrcamentoPayload(req.body);

  const oppRaw = String(data.oportunidade_id ?? data.opportunityId ?? '').trim();
  if (oppRaw) {
    data.oportunidade_id = oppRaw;
    delete data.opportunityId;
  }

  if (!bypassOportunidadeObrigatoria(req)) {
    const oid = String(data.oportunidade_id ?? '').trim();
    if (!oid || !UUID_RE.test(oid)) {
      return res.status(400).json({
        error: 'Informe oportunidade_id (UUID da oportunidade CRM). Administradores podem omitir.',
      });
    }
    try {
      await assertOportunidadeExists(oid);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Oportunidade inválida';
      return res.status(400).json({ error: msg });
    }
  } else if (String(data.oportunidade_id ?? '').trim()) {
    try {
      await assertOportunidadeExists(String(data.oportunidade_id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Oportunidade inválida';
      return res.status(400).json({ error: msg });
    }
  }

  if (!normalizeStr((data as any).cliente_nome)) return res.status(400).json({ error: 'cliente_nome é obrigatório' });
  if (!normalizeStr((data as any).data_emissao)) return res.status(400).json({ error: 'data_emissao é obrigatório' });

  const numero = normalizeStr((data as any).numero);
  if (!numero) {
    const existing = await prisma.entityRecord.findMany({
      where: { entityId: entity.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { data: true },
    });
    (data as any).numero = nextNumero(existing.map((r) => r.data));
  }

  const created = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      data: data as Prisma.InputJsonValue,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    },
  });

  void appendCrmLog({
    eventType: 'quote_created',
    entityCode: 'orcamento',
    entityRecordId: created.id,
    userId: req.user?.userId,
    payload: {
      oportunidade_id: String(data.oportunidade_id ?? ''),
      numero: String(data.numero ?? ''),
    },
  });

  res.status(201).json({ success: true, data: { id: created.id, ...(created.data as any) } });
});

orcamentosRouter.put('/:id', async (req, res) => {
  const entity = await ensureEntity();
  const { id } = req.params;
  const patch = flattenOrcamentoPayload(req.body);

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Orçamento não encontrado' });

  const prev = typeof existing.data === 'object' && existing.data ? (existing.data as Record<string, unknown>) : {};
  const data: Record<string, unknown> = { ...prev, ...patch };

  const oppRaw = String(data.oportunidade_id ?? data.opportunityId ?? '').trim();
  if (oppRaw) {
    data.oportunidade_id = oppRaw;
    delete data.opportunityId;
  }

  if (!bypassOportunidadeObrigatoria(req)) {
    const oid = String(data.oportunidade_id ?? '').trim();
    if (!oid || !UUID_RE.test(oid)) {
      return res.status(400).json({
        error: 'Informe oportunidade_id (UUID da oportunidade CRM). Administradores podem omitir.',
      });
    }
    try {
      await assertOportunidadeExists(oid);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Oportunidade inválida';
      return res.status(400).json({ error: msg });
    }
  } else if (String(data.oportunidade_id ?? '').trim()) {
    try {
      await assertOportunidadeExists(String(data.oportunidade_id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Oportunidade inválida';
      return res.status(400).json({ error: msg });
    }
  }

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: data as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  const prevStatus = String(prev.status ?? '').trim();
  const nextStatus = String(data.status ?? '').trim();
  if (nextStatus === 'Aprovado' && prevStatus !== 'Aprovado') {
    void appendCrmLog({
      eventType: 'quote_approved',
      entityCode: 'orcamento',
      entityRecordId: id,
      userId: req.user?.userId,
      payload: {
        oportunidade_id: String(data.oportunidade_id ?? ''),
        numero: String(data.numero ?? ''),
      },
    });
    emitOrcamentoApproved({
      recordId: id,
      userId: req.user?.userId,
      oportunidadeId: String(data.oportunidade_id ?? '').trim() || undefined,
      numero: String(data.numero ?? '').trim() || undefined,
    });
  }

  res.json({ success: true, data: { id: updated.id, ...(updated.data as any) } });
});

orcamentosRouter.delete('/:id', async (req, res) => {
  const entity = await ensureEntity();
  const { id } = req.params;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Orçamento não encontrado' });

  await prisma.entityRecord.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: req.user?.userId },
  });

  res.json({ success: true });
});

