import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';
import { checkEntityRecordsAccess } from '../../infra/entity-permissions.js';
import { emitAfterRecordSaved } from '../../realtime/record-hooks.js';
import { onProdutoRecordCreated } from '../products/products.service.js';
import { getCompanyFilter } from '../../lib/companyFilter.js';

export const estoqueRouter = Router();

async function getProdutoEntity() {
  const entity = await prisma.entity.findUnique({ where: { code: 'produto' } });
  return entity;
}

function flattenRecord(row: { id: string; data: unknown }): Record<string, unknown> {
  const d = (row.data as Record<string, unknown>) || {};
  return { id: row.id, ...d };
}

/** Lista produtos — formato array na raiz (compatível com frontend legado). */
estoqueRouter.get('/', async (req, res) => {
  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, 'produto', 'view');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const entity = await getProdutoEntity();
  if (!entity) return res.json([]);

  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const tipo = typeof req.query.tipo === 'string' ? req.query.tipo.trim() : '';

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null, companyId: req.user?.companyId },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  let list = rows.map(flattenRecord);
  if (search) {
    list = list.filter(
      (p) =>
        String(p.codigo || '')
          .toLowerCase()
          .includes(search) ||
        String(p.descricao || '')
          .toLowerCase()
          .includes(search),
    );
  }
  if (tipo) {
    list = list.filter((p) => String(p.tipo || '') === tipo);
  }

  res.json(list);
});

estoqueRouter.get('/:id', async (req, res) => {
  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, 'produto', 'view');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const row = await prisma.entityRecord.findFirst({
    where: { id: req.params.id, deletedAt: null, companyId: req.user?.companyId },
  });
  if (!row) return res.status(404).json({ error: 'Não encontrado' });
  const entity = await prisma.entity.findUnique({ where: { id: row.entityId } });
  if (entity?.code !== 'produto') return res.status(404).json({ error: 'Não encontrado' });

  const flat = flattenRecord(row);
  const meta = await prisma.productIndustrialMeta.findUnique({
    where: { entityRecordId: row.id },
  });
  if (meta) {
    flat.bom_status = meta.bomStatus;
    flat.model3d_path = meta.model3dPath;
  }

  res.json(flat);
});

estoqueRouter.post('/', async (req, res) => {
  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, 'produto', 'create');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const entity = await getProdutoEntity();
  if (!entity) return res.status(404).json({ error: 'Entidade produto não configurada' });

  const body = { ...(typeof req.body === 'object' && req.body ? (req.body as Record<string, unknown>) : {}) };
  try {
    const { applyIndustrialCodeOnPayload } = await import('../meta-code/meta-code.service.js');
    await applyIndustrialCodeOnPayload(prisma, 'produto', body);
  } catch {
    /* opcional */
  }

  const created = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      companyId: req.user?.companyId,
      data: body as Prisma.InputJsonValue,
      createdBy: userId,
      updatedBy: userId,
    },
  });

  void onProdutoRecordCreated(created.id, userId);

  void emitAfterRecordSaved({
    entityCode: 'produto',
    verb: 'create',
    record: { id: created.id, data: created.data },
  });

  res.status(201).json(flattenRecord(created));
});

estoqueRouter.put('/:id', async (req, res) => {
  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, 'produto', 'edit');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  const entity = await getProdutoEntity();
  if (!entity) return res.status(404).json({ error: 'Entidade produto não configurada' });

  const updated = await prisma.entityRecord.update({
    where: { id: req.params.id },
    data: {
      data: req.body as Prisma.InputJsonValue,
      updatedBy: userId,
    },
  });

  void emitAfterRecordSaved({
    entityCode: 'produto',
    verb: 'update',
    record: { id: updated.id, data: updated.data },
  });

  res.json(flattenRecord(updated));
});

estoqueRouter.delete('/:id', async (req, res) => {
  const userId = req.user?.userId;
  const can = await checkEntityRecordsAccess(userId, req.user?.roles, 'produto', 'delete');
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  await prisma.entityRecord.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), updatedBy: userId },
  });

  res.json({ ok: true });
});
