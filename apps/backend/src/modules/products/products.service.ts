import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../infra/prisma.js';
import { Prisma } from '@prisma/client';
import {
  enrichRowWeights,
  parseSolidWorksBomTable,
  normalizeProcess,
  type ParsedBomRow,
} from './bom-solidworks.js';

const DENSITY_KG_M3 = 7850;
const UPLOAD_SUBDIRS = { tech: 'uploads/tech', d3: 'uploads/3d' } as const;

export function getUploadRoot() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
}

export async function ensureUploadDirs() {
  const root = getUploadRoot();
  await fs.mkdir(path.join(root, 'tech'), { recursive: true });
  await fs.mkdir(path.join(root, '3d'), { recursive: true });
}

function safeName(name: string) {
  return String(name || 'file')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 180);
}

async function getProdutoEntityId() {
  const e = await prisma.entity.findUnique({ where: { code: 'produto' } });
  return e?.id || null;
}

async function findProdutoRecordById(recordId: string) {
  const entityId = await getProdutoEntityId();
  if (!entityId) return null;
  return prisma.entityRecord.findFirst({
    where: { id: recordId, entityId, deletedAt: null },
  });
}

async function findProdutoByCodigo(codigo: string) {
  const entityId = await getProdutoEntityId();
  if (!entityId) return null;
  const rows = await prisma.entityRecord.findMany({
    where: { entityId, deletedAt: null },
    take: 10000,
  });
  return rows.find((r) => String((r.data as any).codigo) === String(codigo)) || null;
}

export async function findProdutoEntityRecordByCode(codigo: string) {
  return findProdutoByCodigo(codigo);
}

export async function findProductByCode(code: string) {
  return prisma.product.findUnique({
    where: { code }
  });
}

export async function ensureIndustrialMeta(
  entityRecordId: string,
  defaults: { bomStatus?: string } = {},
) {
  return prisma.productIndustrialMeta.upsert({
    where: { entityRecordId },
    create: {
      entityRecordId,
      bomStatus: defaults.bomStatus || 'EMPTY',
    },
    update: {},
  });
}

export async function onProdutoRecordCreated(entityRecordId: string, _userId?: string) {
  await ensureIndustrialMeta(entityRecordId, { bomStatus: 'EMPTY' });
  const role = await prisma.role.findFirst({ where: { code: 'projetista', active: true } });
  if (!role) return;
  const userLinks = await prisma.userRole.findMany({ where: { roleId: role.id }, select: { userId: true } });
  const rec = await prisma.entityRecord.findUnique({ where: { id: entityRecordId } });
  const cod = String((rec?.data as any)?.codigo || '?');
  const desc = String((rec?.data as any)?.descricao || '').slice(0, 80);
  if (!userLinks.length) return;
  await prisma.userNotification.createMany({
    data: userLinks.map((u) => ({
      userId: u.userId,
      sector: 'Engenharia',
      type: 'warning',
      text: `[BOM] Novo produto ${cod} — ${desc || 'sem descrição'} — definir lista de materiais.`,
    })),
  });
}

/** Sincroniza bom_status legível no JSON do cadastro dinâmico (opcional). */
async function syncBomStatusToEntityRecord(entityRecordId: string, bomStatus: string) {
  const row = await prisma.entityRecord.findUnique({ where: { id: entityRecordId } });
  if (!row) return;
  const data = { ...(row.data as Record<string, unknown>), bom_status: bomStatus };
  await prisma.entityRecord.update({
    where: { id: entityRecordId },
    data: { data: data as Prisma.InputJsonValue, updatedAt: new Date() },
  });
}

async function productExistsAsProductOrRaw(code: string): Promise<boolean> {
  const rm = await prisma.rawMaterial.findUnique({ where: { code } });
  if (rm) return true;
  const p = await findProdutoByCodigo(code);
  return Boolean(p);
}

async function autoCreateComponent(
  row: ParsedBomRow,
  weightKg: number,
  thicknessMm: number | null,
  userId: string | undefined,
  log: string[],
) {
  const code = row.codigo.trim();
  const exists = await productExistsAsProductOrRaw(code);
  if (exists) return;

  const entityId = await getProdutoEntityId();
  if (!entityId) throw new Error('Entidade produto não encontrada');

  const produtoEntityRecord = await prisma.entityRecord.create({
    data: {
      entityId,
      data: {
        codigo: code,
        descricao: row.descricao || code,
        tipo: 'Matéria-Prima',
        grupo: 'Auto BOM',
        unidade: 'UN',
        preco_custo: 0,
        preco_venda: 0,
        estoque_atual: 0,
        estoque_minimo: 0,
        status: 'Ativo',
        bom_json: [],
      } as Prisma.InputJsonValue,
      createdBy: userId || null,
      updatedBy: userId || null,
    },
  });

  await prisma.rawMaterial.create({
    data: {
      code,
      name: row.descricao || code,
      materialCode: row.material || null,
      dimensionsX: row.xMm && row.xMm > 0 ? row.xMm : null,
      dimensionsY: row.yMm && row.yMm > 0 ? row.yMm : null,
      thickness: thicknessMm,
      weightKg: weightKg > 0 ? weightKg : null,
      supplierDefault: 'A definir',
      linkedEntityRecordId: produtoEntityRecord.id,
    },
  });

  await ensureIndustrialMeta(produtoEntityRecord.id, { bomStatus: 'EMPTY' });
  log.push(`Criado automaticamente: ${code} (Matéria-Prima + RawMaterial)`);
}

export async function previewBomImport(csvText: string) {
  const { rows, columnNames, detectedDelimiter } = parseSolidWorksBomTable(csvText);
  const preview: Array<Record<string, unknown>> = [];
  const wouldCreate: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const { thicknessMm, weightKg, isSheet } = enrichRowWeights(row);
    const exists = await productExistsAsProductOrRaw(row.codigo.trim());
    if (!exists) wouldCreate.push(row.codigo.trim());

    preview.push({
      line: i + 1,
      codigo: row.codigo,
      descricao: row.descricao,
      material: row.material,
      processo: normalizeProcess(row.processo),
      processo_raw: row.processo,
      x_mm: row.xMm,
      y_mm: row.yMm,
      thickness_mm: thicknessMm,
      weight_kg: weightKg,
      is_sheet: isSheet,
      qtd: row.qtd,
      qtd_total: row.qtdTotal,
      auto_create: !exists,
    });
  }

  return {
    densityKgM3: DENSITY_KG_M3,
    rowCount: rows.length,
    columnNames,
    detectedDelimiter,
    preview,
    wouldCreate,
    wouldCreateCount: wouldCreate.length,
  };
}

export async function importBomForProduct(
  productRecordId: string,
  csvText: string,
  userId: string | undefined,
  dryRun: boolean,
) {
  const parent = await findProdutoRecordById(productRecordId);
  if (!parent) throw new Error('Produto não encontrado');

  const { rows } = parseSolidWorksBomTable(csvText);
  if (!rows.length) throw new Error('Nenhuma linha válida na planilha');

  const importLog: string[] = [];
  const pre = await previewBomImport(csvText);
  if (dryRun) {
    return { dryRun: true, ...pre, importLog };
  }

  await prisma.billOfMaterialLine.deleteMany({ where: { productRecordId } });

  let order = 0;
  const bomJson: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const { thicknessMm, weightKg, isSheet } = enrichRowWeights(row);

    await autoCreateComponent(row, weightKg, thicknessMm, userId, importLog);

    await prisma.billOfMaterialLine.create({
      data: {
        productRecordId,
        lineOrder: order++,
        componentCode: row.codigo.trim(),
        description: row.descricao || null,
        materialSpec: row.material || null,
        process: normalizeProcess(row.processo),
        xMm: row.xMm && row.xMm > 0 ? row.xMm : null,
        yMm: row.yMm && row.yMm > 0 ? row.yMm : null,
        thicknessMm,
        weightKg: isSheet ? weightKg : weightKg || null,
        quantity: row.qtd,
        totalQty: row.qtdTotal ?? null,
      } as Parameters<typeof prisma.billOfMaterialLine.create>[0]['data'],
    });

    const rm = await prisma.rawMaterial.findUnique({ where: { code: row.codigo.trim() } });
    if (rm && weightKg > 0) {
      await prisma.rawMaterial.update({
        where: { id: rm.id },
        data: { weightKg: weightKg, thickness: thicknessMm, dimensionsX: row.xMm, dimensionsY: row.yMm },
      });
    }

    bomJson.push({
      codigo: row.codigo.trim(),
      qtd: row.qtd,
      qtd_total: row.qtdTotal ?? null,
      perda_pct: 0,
      weight_kg: isSheet ? weightKg : 0,
      material: row.material,
      thickness_mm: thicknessMm,
      processo: normalizeProcess(row.processo),
    });
  }

  const data = parent.data as Record<string, unknown>;
  await prisma.entityRecord.update({
    where: { id: productRecordId },
    data: {
      data: {
        ...data,
        bom_json: bomJson,
      } as Prisma.InputJsonValue,
      updatedBy: userId || null,
    },
  });

  await prisma.productIndustrialMeta.upsert({
    where: { entityRecordId: productRecordId },
    create: { entityRecordId: productRecordId, bomStatus: 'COMPLETE' },
    update: { bomStatus: 'COMPLETE' },
  });
  await syncBomStatusToEntityRecord(productRecordId, 'COMPLETE');

  importLog.push(`Importadas ${rows.length} linhas na BOM; status COMPLETE.`);

  return {
    dryRun: false,
    importLog,
    rowCount: rows.length,
    bomJsonSummary: bomJson.length,
  };
}

export async function listPendingBomProducts() {
  const entityId = await getProdutoEntityId();
  if (!entityId) return [];

  const pending = await prisma.productIndustrialMeta.findMany({
    where: {
      bomStatus: { in: ['EMPTY', 'PENDING_ENGINEERING'] },
    },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });

  const out: Array<{
    record_id: string;
    codigo: string;
    descricao: string;
    bom_status: string;
    updated_at: Date;
  }> = [];

  for (const m of pending) {
    const r = await prisma.entityRecord.findUnique({ where: { id: m.entityRecordId } });
    if (!r || r.deletedAt) continue;
    const d = r.data as Record<string, unknown>;
    out.push({
      record_id: r.id,
      codigo: String(d.codigo || ''),
      descricao: String(d.descricao || ''),
      bom_status: m.bomStatus,
      updated_at: m.updatedAt,
    });
  }

  return out;
}

export async function updateBomStatus(productRecordId: string, status: string, userId?: string) {
  const allowed = ['EMPTY', 'PENDING_ENGINEERING', 'COMPLETE'];
  if (!allowed.includes(status)) throw new Error('Status inválido');

  const parent = await findProdutoRecordById(productRecordId);
  if (!parent) throw new Error('Produto não encontrado');

  await prisma.productIndustrialMeta.upsert({
    where: { entityRecordId: productRecordId },
    create: { entityRecordId: productRecordId, bomStatus: status },
    update: { bomStatus: status },
  });
  await syncBomStatusToEntityRecord(productRecordId, status);

  return { ok: true, bomStatus: status };
}

export async function listBomLines(productRecordId: string) {
  return prisma.billOfMaterialLine.findMany({
    where: { productRecordId },
    orderBy: { lineOrder: 'asc' },
  });
}

export async function clearBomLines(productRecordId: string) {
  await prisma.billOfMaterialLine.deleteMany({ where: { productRecordId } });
  await prisma.productIndustrialMeta.upsert({
    where: { entityRecordId: productRecordId },
    create: { entityRecordId: productRecordId, bomStatus: 'EMPTY' },
    update: { bomStatus: 'EMPTY' },
  });
  return { ok: true };
}

export async function replaceBomLines(
  productRecordId: string,
  lines: Array<{
    componentCode: string;
    description?: string;
    materialSpec?: string;
    process?: string;
    xMm?: number;
    yMm?: number;
    quantity: number;
    totalQty?: number;
  }>,
  userId?: string,
) {
  const parent = await findProdutoRecordById(productRecordId);
  if (!parent) throw new Error('Produto não encontrado');

  await prisma.billOfMaterialLine.deleteMany({ where: { productRecordId } });

  let order = 0;
  for (const line of lines) {
    if (!line.componentCode?.trim()) continue;
    await (prisma.billOfMaterialLine as any).create({
      data: {
        productRecordId,
        lineOrder: order++,
        componentCode: line.componentCode.trim(),
        description: line.description ?? null,
        materialSpec: line.materialSpec ?? null,
        process: line.process ?? null,
        xMm: line.xMm ?? null,
        yMm: line.yMm ?? null,
        quantity: line.quantity ?? 1,
        totalQty: line.totalQty ?? null,
      },
    });
  }

  const status = order > 0 ? 'COMPLETE' : 'EMPTY';
  await prisma.productIndustrialMeta.upsert({
    where: { entityRecordId: productRecordId },
    create: { entityRecordId: productRecordId, bomStatus: status },
    update: { bomStatus: status },
  });
  await syncBomStatusToEntityRecord(productRecordId, status);

  // Update bom_json in entity record
  const data = parent.data as Record<string, unknown>;
  const bomJson = lines.map((l) => ({
    codigo: l.componentCode,
    qtd: l.quantity,
    qtd_total: l.totalQty ?? null,
    processo: l.process ?? null,
  }));
  await prisma.entityRecord.update({
    where: { id: productRecordId },
    data: {
      data: { ...data, bom_json: bomJson } as Prisma.InputJsonValue,
      updatedBy: userId ?? null,
    },
  });

  return { ok: true, lineCount: order, bomStatus: status };
}

export async function listTechnicalFiles(productRecordId: string) {
  return prisma.technicalFile.findMany({
    where: { productRecordId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listTechnicalFilesForOp(opRecordId: string) {
  return prisma.technicalFile.findMany({
    where: { opRecordId },
    orderBy: { createdAt: 'desc' },
  });
}

function tipoFromExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === '.dxf') return 'DXF';
  if (e === '.pdf') return 'PDF';
  if (['.stl', '.gltf', '.glb', '.obj'].includes(e)) return 'MODELO_3D';
  return 'OUTRO';
}

export async function saveTechnicalUpload(params: {
  productRecordId?: string;
  opRecordId?: string;
  originalName: string;
  buffer: Buffer;
  userId?: string;
}) {
  await ensureUploadDirs();
  const ext = path.extname(params.originalName);
  const tipo = tipoFromExt(ext);
  const sub = tipo === 'MODELO_3D' ? '3d' : 'tech';
  const id = crypto.randomUUID();
  const fname = `${id}${ext}`;
  const root = getUploadRoot();
  const full = path.join(root, sub, fname);
  await fs.writeFile(full, params.buffer);

  const rel = path.join(sub, fname).replace(/\\/g, '/');

  const row = await prisma.technicalFile.create({
    data: {
      productRecordId: params.productRecordId || null,
      opRecordId: params.opRecordId || null,
      tipo,
      nomeOriginal: params.originalName,
      caminhoArquivo: rel,
      uploadedBy: params.userId || null,
    },
  });

  return row;
}

export async function attachProductModel3d(productRecordId: string, originalName: string, buffer: Buffer, userId?: string) {
  await ensureUploadDirs();
  const ext = path.extname(originalName) || '.stl';
  const id = crypto.randomUUID();
  const fname = `${id}${ext}`;
  const root = getUploadRoot();
  const full = path.join(root, '3d', fname);
  await fs.writeFile(full, buffer);
  const rel = path.join('3d', fname).replace(/\\/g, '/');

  await prisma.productIndustrialMeta.upsert({
    where: { entityRecordId: productRecordId },
    create: {
      entityRecordId: productRecordId,
      bomStatus: 'EMPTY',
      model3dPath: rel,
      model3dOriginalName: originalName,
    },
    update: { model3dPath: rel, model3dOriginalName: originalName },
  });

  await prisma.technicalFile.create({
    data: {
      productRecordId,
      tipo: 'MODELO_3D',
      nomeOriginal: originalName,
      caminhoArquivo: rel,
      uploadedBy: userId || null,
    },
  });

  return { model3dPath: rel, model3dOriginalName: originalName };
}

export function resolveStoredFilePath(caminhoRelativo: string) {
  return path.join(getUploadRoot(), caminhoRelativo.replace(/^[/\\]+/, ''));
}

export async function getProductModel3dInfo(productRecordId: string) {
  const meta = await prisma.productIndustrialMeta.findUnique({
    where: { entityRecordId: productRecordId },
  });
  if (!meta?.model3dPath) return null;
  const abs = resolveStoredFilePath(meta.model3dPath);
  try {
    await fs.access(abs);
  } catch {
    return null;
  }
  return {
    path: meta.model3dPath,
    originalName: meta.model3dOriginalName || 'modelo.3d',
    absolutePath: abs,
  };
}

export async function listCatalogProductFiles(catalogProductId: string) {
  return prisma.productFile.findMany({
    where: { productId: catalogProductId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function saveCatalogProductUpload(params: {
  catalogProductId: string;
  originalName: string;
  buffer: Buffer;
  userId?: string;
  kind?: string;
}) {
  const p = await prisma.product.findUnique({ where: { id: params.catalogProductId } });
  if (!p) throw new Error('Produto (catálogo) não encontrado');
  await ensureUploadDirs();
  await fs.mkdir(path.join(getUploadRoot(), 'catalog'), { recursive: true });
  const ext = path.extname(params.originalName);
  const id = crypto.randomUUID();
  const fname = `${id}${ext}`;
  const rel = path.join('catalog', fname).replace(/\\/g, '/');
  const full = path.join(getUploadRoot(), rel);
  await fs.writeFile(full, params.buffer);
  return prisma.productFile.create({
    data: {
      id,
      productId: params.catalogProductId,
      path: rel,
      originalName: params.originalName,
      kind: params.kind ?? 'OTHER',
      uploadedById: params.userId ?? undefined,
    },
  });
}

export function resolveCatalogProductFileAbsPath(row: { path: string }) {
  return path.join(getUploadRoot(), row.path.replace(/^[/\\]+/, ''));
}

/** Ao gerar OP a partir do produto: copia metadados de arquivos do produto para contexto da OP (referência). */
export async function linkProductTechnicalFilesToOp(productRecordId: string, opRecordId: string) {
  const files = await prisma.technicalFile.findMany({
    where: { productRecordId, tipo: { in: ['DXF', 'PDF'] } },
  });
  for (const f of files) {
    await prisma.technicalFile.create({
      data: {
        productRecordId: null,
        opRecordId,
        tipo: f.tipo,
        nomeOriginal: f.nomeOriginal,
        caminhoArquivo: f.caminhoArquivo,
        uploadedBy: f.uploadedBy,
      },
    });
  }
}
