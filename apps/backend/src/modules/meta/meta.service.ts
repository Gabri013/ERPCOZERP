import { randomUUID } from 'node:crypto';
import { prisma } from '../../infra/prisma.js';

export type MetaKind = 'config' | 'field' | 'layout' | 'workflow' | 'theme';

const FIELD_TYPES = new Set(['texto', 'numero', 'select', 'data', 'checkbox']);

function assertUuid(id: string): void {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!re.test(id)) throw new Error('id inválido');
}

export async function listMeta(kind: MetaKind, query: Record<string, string | undefined>) {
  switch (kind) {
    case 'field': {
      const entityCode = String(query.entityCode || '').trim();
      if (!entityCode) throw new Error('entityCode é obrigatório para kind=field');
      const includeInactive = String(query.includeInactive || '') === '1';
      const rows = await prisma.ncMetaField.findMany({
        where: { entityCode, ...(includeInactive ? {} : { active: true }) },
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      });
      return rows.map(serializeField);
    }
    case 'config': {
      const scope = query.scope ? String(query.scope) : undefined;
      const rows = await prisma.ncMetaConfig.findMany({
        where: { active: true, ...(scope ? { scope } : {}) },
        orderBy: [{ scope: 'asc' }, { key: 'asc' }],
      });
      return rows.map(serializeConfig);
    }
    case 'layout': {
      const entityCode = query.entityCode ? String(query.entityCode) : undefined;
      const scope = query.scope ? String(query.scope) : undefined;
      const rows = await prisma.ncMetaLayout.findMany({
        where: {
          active: true,
          ...(entityCode !== undefined ? { entityCode } : {}),
          ...(scope !== undefined ? { scope } : {}),
        },
        orderBy: [{ name: 'asc' }],
      });
      return rows.map(serializeLayout);
    }
    case 'workflow': {
      const entityCode = query.entityCode ? String(query.entityCode) : undefined;
      const rows = await prisma.ncMetaWorkflow.findMany({
        where: { active: true, ...(entityCode !== undefined ? { entityCode } : {}) },
        orderBy: [{ code: 'asc' }],
      });
      return rows.map(serializeWorkflow);
    }
    case 'theme': {
      const rows = await prisma.ncMetaTheme.findMany({
        where: { active: true },
        orderBy: [{ tokenKey: 'asc' }],
      });
      return rows.map(serializeTheme);
    }
    default:
      throw new Error('kind inválido');
  }
}

function serializeField(r: {
  id: string;
  entityCode: string;
  fieldCode: string;
  label: string;
  dataType: string;
  sortOrder: number;
  required: boolean;
  options: unknown;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    entityCode: r.entityCode,
    fieldCode: r.fieldCode,
    label: r.label,
    dataType: r.dataType,
    sortOrder: r.sortOrder,
    required: r.required,
    options: r.options ?? null,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializeConfig(r: {
  id: string;
  scope: string;
  key: string;
  value: unknown;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    scope: r.scope,
    key: r.key,
    value: r.value,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializeLayout(r: {
  id: string;
  entityCode: string | null;
  scope: string;
  name: string;
  layout: unknown;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    entityCode: r.entityCode,
    scope: r.scope,
    name: r.name,
    layout: r.layout,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializeWorkflow(r: {
  id: string;
  code: string;
  name: string;
  entityCode: string | null;
  definition: unknown;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    entityCode: r.entityCode,
    definition: r.definition,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function serializeTheme(r: {
  id: string;
  tokenKey: string;
  value: unknown;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    tokenKey: r.tokenKey,
    value: r.value,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createMeta(kind: MetaKind, payload: Record<string, unknown>) {
  switch (kind) {
    case 'field': {
      const entityCode = String(payload.entityCode || '').trim();
      const fieldCode = String(payload.fieldCode || '').trim();
      const label = String(payload.label || '').trim();
      const dataType = String(payload.dataType || '').trim();
      if (!entityCode || !fieldCode || !label) throw new Error('entityCode, fieldCode e label são obrigatórios');
      if (!FIELD_TYPES.has(dataType)) throw new Error(`dataType deve ser um de: ${[...FIELD_TYPES].join(', ')}`);
      const sortOrder = Number(payload.sortOrder ?? 0);
      const required = Boolean(payload.required);
      const options = payload.options === undefined ? undefined : (payload.options as object);
      const id = randomUUID();
      const row = await prisma.ncMetaField.create({
        data: {
          id,
          entityCode,
          fieldCode,
          label,
          dataType,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
          required,
          options: options === undefined ? undefined : (options as object),
        },
      });
      return serializeField(row);
    }
    case 'config': {
      const scope = String(payload.scope || '').trim();
      const key = String(payload.key || '').trim();
      if (!scope || !key) throw new Error('scope e key são obrigatórios');
      if (payload.value === undefined) throw new Error('value é obrigatório');
      const id = randomUUID();
      const row = await prisma.ncMetaConfig.create({
        data: { id, scope, key, value: payload.value as object },
      });
      return serializeConfig(row);
    }
    case 'layout': {
      const scope = String(payload.scope || '').trim();
      const name = String(payload.name || '').trim();
      if (!scope || !name) throw new Error('scope e name são obrigatórios');
      if (payload.layout === undefined || typeof payload.layout !== 'object') throw new Error('layout (objeto) é obrigatório');
      const id = randomUUID();
      const row = await prisma.ncMetaLayout.create({
        data: {
          id,
          entityCode: payload.entityCode != null ? String(payload.entityCode) : null,
          scope,
          name,
          layout: payload.layout as object,
        },
      });
      return serializeLayout(row);
    }
    case 'workflow': {
      const code = String(payload.code || '').trim();
      const name = String(payload.name || '').trim();
      if (!code || !name) throw new Error('code e name são obrigatórios');
      if (payload.definition === undefined || typeof payload.definition !== 'object') throw new Error('definition (objeto) é obrigatório');
      const id = randomUUID();
      const row = await prisma.ncMetaWorkflow.create({
        data: {
          id,
          code,
          name,
          entityCode: payload.entityCode != null ? String(payload.entityCode) : null,
          definition: payload.definition as object,
        },
      });
      return serializeWorkflow(row);
    }
    case 'theme': {
      const tokenKey = String(payload.tokenKey || '').trim();
      if (!tokenKey) throw new Error('tokenKey é obrigatório');
      if (payload.value === undefined) throw new Error('value é obrigatório');
      const id = randomUUID();
      const row = await prisma.ncMetaTheme.create({
        data: { id, tokenKey, value: payload.value as object },
      });
      return serializeTheme(row);
    }
    default:
      throw new Error('kind inválido');
  }
}

export async function updateMeta(kind: MetaKind, id: string, payload: Record<string, unknown>) {
  assertUuid(id);
  switch (kind) {
    case 'field': {
      const data: Record<string, unknown> = {};
      if (payload.label !== undefined) data.label = String(payload.label).trim();
      if (payload.dataType !== undefined) {
        const dt = String(payload.dataType).trim();
        if (!FIELD_TYPES.has(dt)) throw new Error(`dataType deve ser um de: ${[...FIELD_TYPES].join(', ')}`);
        data.dataType = dt;
      }
      if (payload.sortOrder !== undefined) {
        const n = Number(payload.sortOrder);
        data.sortOrder = Number.isFinite(n) ? n : 0;
      }
      if (payload.required !== undefined) data.required = Boolean(payload.required);
      if (payload.options !== undefined) data.options = payload.options === null ? null : (payload.options as object);
      if (payload.active !== undefined) data.active = Boolean(payload.active);
      if (payload.fieldCode !== undefined) data.fieldCode = String(payload.fieldCode).trim();
      if (Object.keys(data).length === 0) throw new Error('Nada para atualizar');
      const row = await prisma.ncMetaField.update({ where: { id }, data: data as any });
      return serializeField(row);
    }
    case 'config': {
      const data: Record<string, unknown> = {};
      if (payload.scope !== undefined) data.scope = String(payload.scope).trim();
      if (payload.key !== undefined) data.key = String(payload.key).trim();
      if (payload.value !== undefined) data.value = payload.value as object;
      if (payload.active !== undefined) data.active = Boolean(payload.active);
      if (Object.keys(data).length === 0) throw new Error('Nada para atualizar');
      const row = await prisma.ncMetaConfig.update({ where: { id }, data: data as any });
      return serializeConfig(row);
    }
    case 'layout': {
      const data: Record<string, unknown> = {};
      if (payload.entityCode !== undefined) data.entityCode = payload.entityCode === null ? null : String(payload.entityCode);
      if (payload.scope !== undefined) data.scope = String(payload.scope).trim();
      if (payload.name !== undefined) data.name = String(payload.name).trim();
      if (payload.layout !== undefined) data.layout = payload.layout as object;
      if (payload.active !== undefined) data.active = Boolean(payload.active);
      if (Object.keys(data).length === 0) throw new Error('Nada para atualizar');
      const row = await prisma.ncMetaLayout.update({ where: { id }, data: data as any });
      return serializeLayout(row);
    }
    case 'workflow': {
      const data: Record<string, unknown> = {};
      if (payload.code !== undefined) data.code = String(payload.code).trim();
      if (payload.name !== undefined) data.name = String(payload.name).trim();
      if (payload.entityCode !== undefined) data.entityCode = payload.entityCode === null ? null : String(payload.entityCode);
      if (payload.definition !== undefined) data.definition = payload.definition as object;
      if (payload.active !== undefined) data.active = Boolean(payload.active);
      if (Object.keys(data).length === 0) throw new Error('Nada para atualizar');
      const row = await prisma.ncMetaWorkflow.update({ where: { id }, data: data as any });
      return serializeWorkflow(row);
    }
    case 'theme': {
      const data: Record<string, unknown> = {};
      if (payload.tokenKey !== undefined) data.tokenKey = String(payload.tokenKey).trim();
      if (payload.value !== undefined) data.value = payload.value as object;
      if (payload.active !== undefined) data.active = Boolean(payload.active);
      if (Object.keys(data).length === 0) throw new Error('Nada para atualizar');
      const row = await prisma.ncMetaTheme.update({ where: { id }, data: data as any });
      return serializeTheme(row);
    }
    default:
      throw new Error('kind inválido');
  }
}

export async function deleteMeta(kind: MetaKind, id: string) {
  assertUuid(id);
  switch (kind) {
    case 'field':
      await prisma.ncMetaField.delete({ where: { id } });
      return { id };
    case 'config':
      await prisma.ncMetaConfig.delete({ where: { id } });
      return { id };
    case 'layout':
      await prisma.ncMetaLayout.delete({ where: { id } });
      return { id };
    case 'workflow':
      await prisma.ncMetaWorkflow.delete({ where: { id } });
      return { id };
    case 'theme':
      await prisma.ncMetaTheme.delete({ where: { id } });
      return { id };
    default:
      throw new Error('kind inválido');
  }
}
