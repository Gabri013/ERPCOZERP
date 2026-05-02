import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

const ENTITY_CODE = 'platform_settings';

export type PlatformPayload = {
  company: Record<string, string>;
  parametros: Record<string, unknown>;
  modeloOpHtml: string;
  modeloOpElements: unknown[];
};

const defaults: PlatformPayload = {
  company: {
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    ie: '',
    im: '',
    regime: 'Lucro Real',
    cep: '',
    endereco: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    telefone: '',
    email: '',
    site: '',
  },
  parametros: {},
  modeloOpHtml: '',
  modeloOpElements: [],
};

function mergePayload(prev: unknown, patch: Partial<PlatformPayload>): PlatformPayload {
  const p = prev && typeof prev === 'object' && !Array.isArray(prev) ? (prev as Record<string, unknown>) : {};
  const company = {
    ...defaults.company,
    ...(typeof p.company === 'object' && p.company ? (p.company as Record<string, string>) : {}),
    ...(patch.company ?? {}),
  };
  const parametros = {
    ...(typeof p.parametros === 'object' && p.parametros ? (p.parametros as Record<string, unknown>) : {}),
    ...(patch.parametros ?? {}),
  };
  return {
    company,
    parametros,
    modeloOpHtml: patch.modeloOpHtml ?? (typeof p.modeloOpHtml === 'string' ? p.modeloOpHtml : defaults.modeloOpHtml),
    modeloOpElements: Array.isArray(patch.modeloOpElements)
      ? patch.modeloOpElements
      : Array.isArray(p.modeloOpElements)
        ? (p.modeloOpElements as unknown[])
        : defaults.modeloOpElements,
  };
}

async function ensureEntity() {
  return prisma.entity.upsert({
    where: { code: ENTITY_CODE },
    update: { name: 'Configurações da plataforma' },
    create: { code: ENTITY_CODE, name: 'Configurações da plataforma' },
  });
}

export async function getPlatformSettings(userId: string | undefined) {
  const entity = await ensureEntity();
  let rec = await prisma.entityRecord.findFirst({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  if (!rec) {
    rec = await prisma.entityRecord.create({
      data: {
        entityId: entity.id,
        data: defaults as unknown as Prisma.InputJsonValue,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  const raw = rec.data;
  const payload = mergePayload(raw, {});
  return { id: rec.id, ...payload };
}

export async function updatePlatformSettings(
  patch: Partial<PlatformPayload>,
  userId: string | undefined,
) {
  const entity = await ensureEntity();
  let rec = await prisma.entityRecord.findFirst({
    where: { entityId: entity.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  const merged = mergePayload(rec?.data, patch);

  if (!rec) {
    rec = await prisma.entityRecord.create({
      data: {
        entityId: entity.id,
        data: merged as unknown as Prisma.InputJsonValue,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  } else {
    rec = await prisma.entityRecord.update({
      where: { id: rec.id },
      data: {
        data: merged as unknown as Prisma.InputJsonValue,
        updatedBy: userId,
      },
    });
  }

  return { id: rec.id, ...merged };
}
