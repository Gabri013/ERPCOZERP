import { Router } from 'express';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';

export const fornecedoresRouter = Router();

async function ensureFornecedorEntity() {
  return prisma.entity.upsert({
    where: { code: 'fornecedor' },
    update: {},
    create: { code: 'fornecedor', name: 'Fornecedores' },
  });
}

function normalizeStr(v: unknown) {
  return String(v || '').trim();
}

fornecedoresRouter.get('/', async (req, res) => {
  const entity = await ensureFornecedorEntity();

  const search = normalizeStr(req.query.search);
  const take = Math.min(200, Math.max(1, Number(req.query.limit || 200)));

  const rows = await prisma.entityRecord.findMany({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take,
  });

  const data = rows
    .map((r) => ({ id: r.id, ...(r.data as any) }))
    .filter((f) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        String(f.nome || f.razao_social || '').toLowerCase().includes(s) ||
        String(f.cnpj || f.cnpj_cpf || '').includes(search) ||
        String(f.codigo || '').toLowerCase().includes(s)
      );
    });

  res.json({ success: true, data });
});

fornecedoresRouter.post('/', async (req, res) => {
  const entity = await ensureFornecedorEntity();
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;

  // Mantém compatível com o frontend (razao_social) e com busca do core (nome/cnpj).
  const nome = normalizeStr((data as any).nome || (data as any).razao_social);
  if (!nome) return res.status(400).json({ error: 'nome/razao_social é obrigatório' });

  (data as any).nome = nome;
  (data as any).cnpj = normalizeStr((data as any).cnpj || (data as any).cnpj_cpf);

  const created = await prisma.entityRecord.create({
    data: {
      entityId: entity.id,
      data: data as Prisma.InputJsonValue,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    },
  });

  res.status(201).json({ success: true, data: { id: created.id, ...(created.data as any) } });
});

fornecedoresRouter.put('/:id', async (req, res) => {
  const entity = await ensureFornecedorEntity();
  const { id } = req.params;
  const data = (req.body?.data ?? req.body) as Record<string, unknown>;

  const nome = normalizeStr((data as any).nome || (data as any).razao_social);
  if (!nome) return res.status(400).json({ error: 'nome/razao_social é obrigatório' });

  (data as any).nome = nome;
  (data as any).cnpj = normalizeStr((data as any).cnpj || (data as any).cnpj_cpf);

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Fornecedor não encontrado' });

  const updated = await prisma.entityRecord.update({
    where: { id },
    data: {
      data: data as Prisma.InputJsonValue,
      updatedBy: req.user?.userId,
    },
  });

  res.json({ success: true, data: { id: updated.id, ...(updated.data as any) } });
});

fornecedoresRouter.delete('/:id', async (req, res) => {
  const entity = await ensureFornecedorEntity();
  const { id } = req.params;

  const existing = await prisma.entityRecord.findFirst({ where: { id, entityId: entity.id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: 'Fornecedor não encontrado' });

  await prisma.entityRecord.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: req.user?.userId },
  });

  res.json({ success: true });
});

