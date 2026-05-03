import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';

export type MetaCodeDb = Prisma.TransactionClient | typeof prisma;

const FORMATS = new Set(['CAT_PREFIX_YM_SEQ', 'PREFIX_CAT_YM_SEQ', 'PREFIX_YEAR_SEQ']);
const RESETS = new Set(['year', 'month', 'never']);

function pad(n: number, len: number) {
  return String(n).padStart(len, '0');
}

function nowParts(d = new Date()) {
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

export async function listCategoriesActive() {
  return prisma.ncMetaCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
  });
}

export async function listCategoriesAll() {
  return prisma.ncMetaCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
  });
}

export async function upsertCategory(data: {
  id?: string;
  code: string;
  label: string;
  color: string;
  textColor: string;
  icon?: string | null;
  sortOrder?: number;
  active?: boolean;
}) {
  const code = String(data.code || '').trim().toUpperCase();
  if (!code) throw new Error('code é obrigatório');
  if (data.id) {
    return prisma.ncMetaCategory.update({
      where: { id: data.id },
      data: {
        code,
        label: String(data.label || '').trim(),
        color: String(data.color || '').trim(),
        textColor: String(data.textColor || '').trim(),
        icon: data.icon === undefined ? undefined : data.icon,
        sortOrder: data.sortOrder ?? undefined,
        active: data.active ?? undefined,
      },
    });
  }
  return prisma.ncMetaCategory.create({
    data: {
      id: randomUUID(),
      code,
      label: String(data.label || '').trim(),
      color: String(data.color || '').trim(),
      textColor: String(data.textColor || '').trim(),
      icon: data.icon ?? null,
      sortOrder: data.sortOrder ?? 0,
      active: data.active ?? true,
    },
  });
}

export async function getRuleByEntity(entity: string) {
  return prisma.ncMetaCodeRule.findFirst({
    where: { entity: String(entity), active: true },
    include: { sequences: false },
  });
}

export async function upsertRule(data: {
  entity: string;
  prefix: string;
  categoriaField?: string | null;
  useYear?: boolean;
  useMonth?: boolean;
  sequencePadding?: number;
  resetType?: string;
  format?: string;
  targetField?: string;
  fallbackCategoryCode?: string;
  active?: boolean;
}) {
  const entity = String(data.entity || '').trim();
  if (!entity) throw new Error('entity é obrigatório');
  const resetType = String(data.resetType || 'month').toLowerCase();
  if (!RESETS.has(resetType)) throw new Error('resetType inválido');
  const format = String(data.format || 'PREFIX_CAT_YM_SEQ').toUpperCase();
  if (!FORMATS.has(format)) throw new Error('format inválido');

  return prisma.ncMetaCodeRule.upsert({
    where: { entity },
    create: {
      id: randomUUID(),
      entity,
      prefix: String(data.prefix || '').trim().toUpperCase(),
      categoriaField: data.categoriaField ? String(data.categoriaField).trim() : null,
      useYear: data.useYear !== false,
      useMonth: data.useMonth !== false,
      sequencePadding: Number(data.sequencePadding ?? 5) || 5,
      resetType,
      format,
      targetField: String(data.targetField || 'numero').trim(),
      fallbackCategoryCode: String(data.fallbackCategoryCode || 'MOB').trim().toUpperCase(),
      active: data.active !== false,
    },
    update: {
      prefix: String(data.prefix || '').trim().toUpperCase(),
      categoriaField: data.categoriaField === undefined ? undefined : data.categoriaField ? String(data.categoriaField).trim() : null,
      useYear: data.useYear,
      useMonth: data.useMonth,
      sequencePadding: data.sequencePadding === undefined ? undefined : Number(data.sequencePadding) || 5,
      resetType,
      format,
      targetField: data.targetField === undefined ? undefined : String(data.targetField).trim(),
      fallbackCategoryCode:
        data.fallbackCategoryCode === undefined ? undefined : String(data.fallbackCategoryCode).trim().toUpperCase(),
      active: data.active,
    },
  });
}

/** Resolve sigla (COC) a partir do valor do registo + tabela de categorias. */
export async function resolveCategoryCode(
  db: MetaCodeDb,
  raw: unknown,
  fallback: string,
): Promise<{ code: string; label: string }> {
  const cats = await db.ncMetaCategory.findMany({ where: { active: true } });
  const fb = String(fallback || 'MOB').toUpperCase();
  const s = String(raw ?? '').trim();
  if (!s) {
    const d = cats.find((c) => c.code === fb) || cats[0];
    return { code: d?.code ?? fb, label: d?.label ?? fb };
  }
  const up = s.toUpperCase();
  for (const c of cats) {
    if (c.code.toUpperCase() === up) return { code: c.code, label: c.label };
    if (c.label.toLowerCase() === s.toLowerCase()) return { code: c.code, label: c.label };
  }
  const alias: Record<string, string> = {
    cocção: 'COC',
    cocao: 'COC',
    refrigeração: 'REF',
    refrigeracao: 'REF',
    mobiliário: 'MOB',
    mobiliario: 'MOB',
    engenharia: 'ENG',
    tubo: 'TUB',
    solda: 'SOL',
  };
  const mapped = alias[s.toLowerCase()];
  if (mapped) {
    const c = cats.find((x) => x.code === mapped);
    return { code: mapped, label: c?.label ?? mapped };
  }
  const d = cats.find((c) => c.code === fb) || cats[0];
  return { code: d?.code ?? fb, label: d?.label ?? fb };
}

function periodKeyForRule(rule: { resetType: string; useYear: boolean; useMonth: boolean }, d = new Date()) {
  const { y, m } = nowParts(d);
  const rt = String(rule.resetType || 'month').toLowerCase();
  if (rt === 'never') return 'ALL';
  if (rt === 'year') return rule.useYear ? String(y) : 'ALL';
  if (rt === 'month') {
    if (rule.useYear && rule.useMonth) return `${y}${pad(m, 2)}`;
    if (rule.useYear) return String(y);
    return 'ALL';
  }
  return `${y}${pad(m, 2)}`;
}

function ymSegment(rule: { useYear: boolean; useMonth: boolean }, d = new Date()) {
  const { y, m } = nowParts(d);
  if (rule.useYear && rule.useMonth) return `${y}${pad(m, 2)}`;
  if (rule.useYear) return String(y);
  return '';
}

async function nextSequenceValue(db: MetaCodeDb, ruleId: string, periodKey: string, categoryKey: string): Promise<number> {
  const rows = await db.$queryRaw<Array<{ last_value: number }>>`
    INSERT INTO nc_meta_code_sequences (id, rule_id, period_key, category_key, last_value)
    VALUES (gen_random_uuid(), ${ruleId}::uuid, ${periodKey}, ${categoryKey}, 1)
    ON CONFLICT (rule_id, period_key, category_key)
    DO UPDATE SET last_value = nc_meta_code_sequences.last_value + 1
    RETURNING last_value
  `;
  const v = rows[0]?.last_value;
  if (!Number.isFinite(Number(v))) throw new Error('Falha ao obter sequência de código');
  return Number(v);
}

function composeCode(
  rule: {
    prefix: string;
    format: string;
    sequencePadding: number;
  },
  catCode: string,
  ym: string,
  seq: number,
) {
  const seqStr = pad(seq, rule.sequencePadding);
  const P = rule.prefix.toUpperCase();
  const C = catCode.toUpperCase();
  const fmt = String(rule.format || '').toUpperCase();
  if (fmt === 'PREFIX_YEAR_SEQ') {
    const year = ym.length >= 4 ? ym.slice(0, 4) : String(new Date().getFullYear());
    return `${P}-${year}-${seqStr}`;
  }
  if (fmt === 'CAT_PREFIX_YM_SEQ') {
    return `${C}-${P}-${ym}-${seqStr}`;
  }
  // PREFIX_CAT_YM_SEQ
  return `${P}-${C}-${ym}-${seqStr}`;
}

/**
 * Gera o próximo código industrial para a entidade configurada.
 * Retorna null se não existir regra ativa.
 */
export async function allocateIndustrialCode(
  db: MetaCodeDb,
  entity: string,
  context: Record<string, unknown>,
): Promise<{ code: string; categoryCode: string; categoryLabel: string } | null> {
  const rule = await db.ncMetaCodeRule.findFirst({ where: { entity: String(entity), active: true } });
  if (!rule) return null;

  const field = rule.categoriaField ? String(rule.categoriaField) : '';
  const rawCat = field ? context[field] : undefined;
  const { code: catCode, label: catLabel } = await resolveCategoryCode(db, rawCat, rule.fallbackCategoryCode);

  const periodKey = periodKeyForRule(rule);
  const categoryKey = String(rule.format || '').toUpperCase() === 'PREFIX_YEAR_SEQ' ? 'NA' : catCode.toUpperCase();

  const seq = await nextSequenceValue(db, rule.id, periodKey, categoryKey);
  const ym = ymSegment(rule);
  const code = composeCode(rule, catCode, ym, seq);

  return { code, categoryCode: catCode, categoryLabel: catLabel };
}

/** Normaliza prioridade em registos JSON (OP legado). */
export function normalizePrioridadePayload(entity: string, payload: Record<string, unknown>) {
  if (entity !== 'ordem_producao') return;
  const p = payload.prioridade;
  if (p === undefined || p === null) return;
  const s = String(p).toLowerCase();
  payload.prioridade = s.includes('urg') ? 'urgente' : 'normal';
}

function targetFieldName(rule: { targetField: string }) {
  return String(rule.targetField || 'numero').trim();
}

/**
 * Preenche `codigo` / `numero` (ou campo configurado) se vazio e existir regra.
 */
export async function applyIndustrialCodeOnPayload(db: MetaCodeDb, entity: string, payload: Record<string, unknown>) {
  normalizePrioridadePayload(entity, payload);
  const rule = await db.ncMetaCodeRule.findFirst({ where: { entity: String(entity), active: true } });
  if (!rule) return;

  const tf = targetFieldName(rule);
  const cur = String(payload[tf] ?? '').trim();
  if (cur) return;

  const gen = await allocateIndustrialCode(db, entity, payload);
  if (!gen) return;

  payload[tf] = gen.code;
  payload.categoria_codigo = gen.categoryCode;
  payload.categoria_label = gen.categoryLabel;
}

/**
 * Para WorkOrder (tabela relacional): gera número + categorias.
 */
export async function allocateWorkOrderIndustrial(
  db: MetaCodeDb,
  ctx: Record<string, unknown>,
): Promise<{ number: string; categoryCode: string; categoryLabel: string } | null> {
  const gen = await allocateIndustrialCode(db, 'work_order', ctx);
  if (!gen) return null;
  return { number: gen.code, categoryCode: gen.categoryCode, categoryLabel: gen.categoryLabel };
}
