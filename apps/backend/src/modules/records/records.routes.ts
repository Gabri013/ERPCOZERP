import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';
import { checkEntityRecordsAccess } from '../../infra/entity-permissions.js';
import { emitAfterRecordSaved } from '../../realtime/record-hooks.js';
import { appendCrmLog } from '../crm/crm-log.service.js';
import {
  emitLeadCreated,
  emitOpportunityStageChanged,
  emitOpportunityUpdated,
} from '../crm/crm-events.js';
import { assignLeadResponsavelIfEmpty, logCrmAssignment } from '../crm/crm-assignment.service.js';
import { normalizeOpportunityStage } from '../crm/crm-constants.js';
import {
  validateCrmLeadWrite,
  validateCrmOpportunityWrite,
} from '../crm/crm-record-validation.js';

export const recordsRouter = Router();

function coerceEmpty(v: unknown): unknown {
  if (typeof v === 'string' && v.trim() === '') return undefined;
  return v;
}

async function assertRequiredFields(entityCode: string, data: Record<string, unknown>) {
  const entity = await prisma.entity.findUnique({ where: { code: entityCode } });
  const cfg = (entity?.config as { fields?: any[] }) || {};
  const fields = Array.isArray(cfg.fields) ? cfg.fields : [];
  const missing: string[] = [];

  for (const f of fields) {
    if (!f?.required || f?.hidden || f?.readonly) continue;
    const code = String(f.code || '');
    if (!code) continue;
    const v = coerceEmpty(data[code]);
    if (
      v === undefined ||
      v === null ||
      (typeof v === 'number' && !Number.isFinite(v)) ||
      (typeof v === 'string' && v.trim() === '')
    ) {
      missing.push(String(f.label || code));
    }
  }

  if (missing.length > 0) {
    throw new Error(`Campos obrigatórios: ${missing.join(', ')}`);
  }
}

const createSchema = z.object({
  entity: z.string().min(1),
  data: z.record(z.string(), z.any()),
});

const updateSchema = z.object({
  data: z.record(z.string(), z.any()),
});

recordsRouter.get('/', async (req, res) => {
  const entityCode = String(req.query.entity || '');
  if (!entityCode) return res.status(400).json({ error: 'entity é obrigatório' });

  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, entityCode, 'view');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const entity = await prisma.entity.findUnique({ where: { code: entityCode } });
  if (!entity) return res.status(404).json({ error: 'Entidade não encontrada' });

  const takeCap = entityCode === 'produto' ? 5000 : 200;

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: takeCap,
  });

  res.json({
    success: true,
    data: rows.map((r) => ({ id: r.id, data: r.data, created_at: r.createdAt, updated_at: r.updatedAt })),
  });
});

recordsRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, parsed.data.entity, 'create');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const entity = await prisma.entity.findUnique({ where: { code: parsed.data.entity } });
  if (!entity) return res.status(404).json({ error: 'Entidade não encontrada' });

  const roles = req.user?.roles ?? [];
  const mergedCreate = { ...(parsed.data.data as Record<string, unknown>) };
  try {
    const { applyIndustrialCodeOnPayload } = await import('../meta-code/meta-code.service.js');
    await applyIndustrialCodeOnPayload(prisma, parsed.data.entity, mergedCreate);
  } catch {
    /* tabelas de meta-code opcionais */
  }

  try {
    await assertRequiredFields(parsed.data.entity, mergedCreate);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Validação falhou' });
  }
  let crmLeadAutoAssignReason: string | undefined;
  try {
    if (parsed.data.entity === 'crm_lead') {
      await assignLeadResponsavelIfEmpty(mergedCreate);
      const meta = (mergedCreate as { _crmAutoAssignMeta?: { reason: string } })._crmAutoAssignMeta;
      delete (mergedCreate as { _crmAutoAssignMeta?: unknown })._crmAutoAssignMeta;
      crmLeadAutoAssignReason = meta?.reason;
      validateCrmLeadWrite(mergedCreate, roles);
    }
    if (parsed.data.entity === 'crm_oportunidade') {
      await validateCrmOpportunityWrite({
        merged: mergedCreate,
        recordId: null,
        roles,
      });
    }
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Validação CRM falhou' });
  }

  const created = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      data: mergedCreate as Prisma.InputJsonValue,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    },
  });

  void emitAfterRecordSaved({
    entityCode: parsed.data.entity,
    verb: 'create',
    record: { id: created.id, data: created.data },
  });

  if (parsed.data.entity === 'produto') {
    const { onProdutoRecordCreated } = await import('../products/products.service.js');
    void onProdutoRecordCreated(created.id, userId);
  }

  if (parsed.data.entity === 'crm_lead') {
    const rid = String(mergedCreate.responsavelId ?? '').trim();
    if (rid && crmLeadAutoAssignReason) {
      void logCrmAssignment({
        entityCode: 'crm_lead',
        entityRecordId: created.id,
        antigoResponsavel: null,
        novoResponsavel: rid,
        reason:
          crmLeadAutoAssignReason === 'lead_round_robin' ? 'lead_auto_assigned' : crmLeadAutoAssignReason,
      });
      void appendCrmLog({
        eventType: 'automation_lead_assigned',
        entityCode: 'crm_lead',
        entityRecordId: created.id,
        userId,
        payload: { automation: 'lead_auto_assign', reason: crmLeadAutoAssignReason },
      });
    }
    void appendCrmLog({
      eventType: 'lead_created',
      entityCode: 'crm_lead',
      entityRecordId: created.id,
      userId,
      payload: { snapshot: mergedCreate },
    });
    emitLeadCreated({ recordId: created.id, userId, data: mergedCreate });
  }
  if (parsed.data.entity === 'crm_oportunidade') {
    void appendCrmLog({
      eventType: 'opportunity_created',
      entityCode: 'crm_oportunidade',
      entityRecordId: created.id,
      userId,
      payload: { snapshot: mergedCreate },
    });
  }

  res.status(201).json({ success: true, data: { id: created.id, data: created.data } });
});

recordsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const row = await prisma.entityRecord.findUnique({ where: { id } });
  if (!row || row.deletedAt) return res.status(404).json({ error: 'Registro não encontrado' });

  const entity = await prisma.entity.findUnique({ where: { id: row.entityId } });
  const entityCode = entity?.code || '';
  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, entityCode, 'view');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const payload: {
    id: string;
    entity_id: string;
    data: unknown;
    bom_status?: string;
    model3d_path?: string | null;
  } = { id: row.id, entity_id: row.entityId, data: row.data };

  if (entityCode === 'produto') {
    const meta = await prisma.productIndustrialMeta.findUnique({
      where: { entityRecordId: row.id },
    });
    if (meta) {
      payload.bom_status = meta.bomStatus;
      payload.model3d_path = meta.model3dPath;
    }
  }

  res.json({ success: true, data: payload });
});

recordsRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const existing = await prisma.entityRecord.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return res.status(404).json({ error: 'Registro não encontrado' });

  const entity = await prisma.entity.findUnique({ where: { id: existing.entityId } });
  const entityCode = entity?.code || '';
  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, entityCode, 'edit');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const mergedData = {
    ...(typeof existing.data === 'object' && existing.data !== null ? (existing.data as object) : {}),
    ...(parsed.data.data as object),
  } as Record<string, unknown>;

  try {
    await assertRequiredFields(entityCode, mergedData);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Validação falhou' });
  }

  const roles = req.user?.roles ?? [];
  const prevData =
    typeof existing.data === 'object' && existing.data !== null ? (existing.data as Record<string, unknown>) : {};
  try {
    if (entityCode === 'crm_lead') {
      validateCrmLeadWrite(mergedData, roles);
    }
    if (entityCode === 'crm_oportunidade') {
      await validateCrmOpportunityWrite({
        merged: mergedData,
        recordId: id,
        roles,
      });
    }
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Validação CRM falhou' });
  }

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: mergedData as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  void emitAfterRecordSaved({
    entityCode,
    verb: 'update',
    record: { id: updated.id, data: updated.data },
  });

  if (entityCode === 'crm_oportunidade') {
    const prevStage = normalizeOpportunityStage(String(prevData.estagio ?? prevData.stage ?? ''));
    const nextStage = normalizeOpportunityStage(String(mergedData.estagio ?? mergedData.stage ?? ''));
    if (prevStage !== nextStage) {
      void appendCrmLog({
        eventType: 'opportunity_stage_change',
        entityCode: 'crm_oportunidade',
        entityRecordId: id,
        userId,
        payload: { from: prevStage, to: nextStage },
      });
      emitOpportunityStageChanged({
        recordId: id,
        userId,
        from: prevStage,
        to: nextStage,
        data: mergedData,
      });
    }
    const prevOwner = String(prevData.responsavelId ?? prevData.responsavel ?? '').trim();
    const nextOwner = String(mergedData.responsavelId ?? mergedData.responsavel ?? '').trim();
    if (prevOwner !== nextOwner) {
      void appendCrmLog({
        eventType: 'opportunity_owner_change',
        entityCode: 'crm_oportunidade',
        entityRecordId: id,
        userId,
        payload: { from: prevOwner, to: nextOwner },
      });
      if (nextOwner) {
        void logCrmAssignment({
          entityCode: 'crm_oportunidade',
          entityRecordId: id,
          antigoResponsavel: prevOwner || null,
          novoResponsavel: nextOwner,
          reason: 'owner_manual_update',
        });
      }
    }
    emitOpportunityUpdated({
      recordId: id,
      userId,
      previous: prevData,
      next: mergedData,
    });
  }

  if (entityCode === 'crm_lead') {
    const prevOwner = String(prevData.responsavelId ?? prevData.responsavel ?? '').trim();
    const nextOwner = String(mergedData.responsavelId ?? mergedData.responsavel ?? '').trim();
    if (prevOwner !== nextOwner && nextOwner) {
      void logCrmAssignment({
        entityCode: 'crm_lead',
        entityRecordId: id,
        antigoResponsavel: prevOwner || null,
        novoResponsavel: nextOwner,
        reason: 'owner_manual_update',
      });
    }
  }

  res.json({ success: true, data: { id: updated.id, data: updated.data } });
});

recordsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.entityRecord.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return res.status(404).json({ error: 'Registro não encontrado' });

  const entity = await prisma.entity.findUnique({ where: { id: existing.entityId } });
  const entityCode = entity?.code || '';
  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, entityCode, 'delete');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  await prisma.entityRecord.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: req.user?.userId },
  });

  void emitAfterRecordSaved({
    entityCode,
    verb: 'delete',
    record: { id },
  });

  res.json({ success: true });
});
