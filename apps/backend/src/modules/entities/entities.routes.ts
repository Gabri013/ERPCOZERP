import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../infra/prisma.js';

export const entitiesRouter = Router();

const entityCreateSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  config: z.any().optional(),
});

entitiesRouter.get('/', async (req, res) => {
  const entities = await prisma.entity.findMany({ orderBy: { code: 'asc' } });
  const shaped = entities.map((e: any) => ({
    ...e,
    // Compat com frontend: ele espera `entity.fields` direto no objeto.
    // Persistimos no banco em `config.fields`.
    fields: Array.isArray(e?.config?.fields) ? e.config.fields : [],
  }));
  res.json({ success: true, data: shaped });
});

entitiesRouter.post('/', async (req, res) => {
  const parsed = entityCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  const created = await prisma.entity.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description,
      config: parsed.data.config ?? undefined,
    },
  });
  res.status(201).json({ success: true, data: created });
});

entitiesRouter.get('/:code', async (req, res) => {
  const { code } = req.params;
  const entity = await prisma.entity.findUnique({ where: { code } });
  if (!entity) return res.status(404).json({ error: 'Entidade não encontrada' });
  res.json({
    success: true,
    data: {
      ...(entity as any),
      fields: Array.isArray((entity as any)?.config?.fields) ? (entity as any).config.fields : [],
    },
  });
});

