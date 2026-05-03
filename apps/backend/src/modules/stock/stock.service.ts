import { Prisma, StockMovementType } from '@prisma/client';
import { prisma } from '../../infra/prisma.js';
import {
  isExcludedSalesCatalogProductType,
  prismaWhereSalesCatalogOnly,
} from './product-catalog-scope.js';

type Db = Prisma.TransactionClient | typeof prisma;

const DEFAULT_LOCATION_CODE = 'DEFAULT';

export function decimalToNumber(d: Prisma.Decimal | null | undefined): number | null {
  if (d === null || d === undefined) return null;
  return d.toNumber();
}

export async function getOrCreateDefaultLocation() {
  const existing = await prisma.location.findUnique({ where: { code: DEFAULT_LOCATION_CODE } });
  if (existing) return existing;
  return prisma.location.create({
    data: {
      code: DEFAULT_LOCATION_CODE,
      name: 'Depósito principal',
      warehouse: 'Principal',
      active: true,
    },
  });
}

export async function ensureProductLocationRow(productId: string, locationId: string) {
  return ensureProductLocationRowTx(prisma, productId, locationId);
}

async function getQtyAtLocation(db: Db, productId: string, locationId: string): Promise<Prisma.Decimal> {
  const row = await db.productLocation.findUnique({
    where: { productId_locationId: { productId, locationId } },
  });
  return row?.quantity ?? new Prisma.Decimal(0);
}

async function ensureProductLocationRowTx(db: Db, productId: string, locationId: string) {
  return db.productLocation.upsert({
    where: {
      productId_locationId: { productId, locationId },
    },
    create: { productId, locationId, quantity: new Prisma.Decimal(0) },
    update: {},
  });
}

export async function applyStockMovement(
  params: {
    productId: string;
    locationId: string;
    type: StockMovementType;
    quantity: Prisma.Decimal;
    userId?: string | null;
    reference?: string | null;
    notes?: string | null;
  },
  db: Db = prisma,
) {
  const { productId, locationId, type, quantity, userId, reference, notes } = params;

  await ensureProductLocationRowTx(db, productId, locationId);

  const current = await getQtyAtLocation(db, productId, locationId);

  if (type === 'SAIDA') {
    if (current.lt(quantity)) {
      throw new Error('Saldo insuficiente neste endereço para a saída solicitada');
    }
    const next = current.minus(quantity);
    await db.productLocation.update({
      where: { productId_locationId: { productId, locationId } },
      data: { quantity: next },
    });
  } else if (type === 'ENTRADA') {
    const next = current.plus(quantity);
    await db.productLocation.update({
      where: { productId_locationId: { productId, locationId } },
      data: { quantity: next },
    });
  } else {
    const next = current.plus(quantity);
    if (next.lt(0)) {
      throw new Error('Ajuste resultaria em saldo negativo neste endereço');
    }
    await db.productLocation.update({
      where: { productId_locationId: { productId, locationId } },
      data: { quantity: next },
    });
  }

  return db.stockMovement.create({
    data: {
      productId,
      locationId,
      type,
      quantity,
      reference: reference ?? undefined,
      notes: notes ?? undefined,
      userId: userId ?? undefined,
    },
    include: { product: true, location: true, user: { select: { id: true, fullName: true, email: true } } },
  });
}

export async function createMovement(input: {
  productId: string;
  locationId?: string | null;
  type: StockMovementType;
  quantity: number;
  userId?: string | null;
  reference?: string | null;
  notes?: string | null;
}) {
  const locId = input.locationId ?? (await getOrCreateDefaultLocation()).id;
  const qty = new Prisma.Decimal(input.quantity);

  return prisma.$transaction(async (tx) => {
    return applyStockMovement(
      {
        productId: input.productId,
        locationId: locId,
        type: input.type,
        quantity: qty,
        userId: input.userId,
        reference: input.reference,
        notes: input.notes,
      },
      tx,
    );
  });
}

function serializeProduct(row: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  productType: string | null;
  group: string | null;
  costPrice: Prisma.Decimal | null;
  salePrice: Prisma.Decimal | null;
  minStock: Prisma.Decimal;
  reorderPoint: Prisma.Decimal | null;
  status: string;
  photoUrl: string | null;
  techSheet: string | null;
  entityRecordId: string | null;
  createdAt: Date;
  updatedAt: Date;
  locations?: Array<{ quantity: Prisma.Decimal; location: { code: string; name: string; id: string } }>;
}) {
  const locs = row.locations ?? [];
  const totalQty = locs.reduce((acc, pl) => acc + pl.quantity.toNumber(), 0);
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    unit: row.unit,
    productType: row.productType,
    group: row.group,
    costPrice: decimalToNumber(row.costPrice),
    salePrice: decimalToNumber(row.salePrice),
    minStock: decimalToNumber(row.minStock) ?? 0,
    reorderPoint: decimalToNumber(row.reorderPoint),
    status: row.status,
    photoUrl: row.photoUrl,
    techSheet: row.techSheet,
    entityRecordId: row.entityRecordId,
    totalQty,
    locations: locs.map((pl) => ({
      locationId: pl.location.id,
      locationCode: pl.location.code,
      locationName: pl.location.name,
      quantity: pl.quantity.toNumber(),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProducts(filter: {
  search?: string;
  status?: string;
  take?: number;
  salesCatalogOnly?: boolean;
}) {
  const take = filter.take ?? 2000;
  const andParts: Prisma.ProductWhereInput[] = [];

  if (filter.status) andParts.push({ status: filter.status });
  if (filter.search?.trim()) {
    const q = filter.search.trim();
    andParts.push({
      OR: [
        { code: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  if (filter.salesCatalogOnly) {
    andParts.push(prismaWhereSalesCatalogOnly());
  }

  const where: Prisma.ProductWhereInput =
    andParts.length === 0 ? {} : andParts.length === 1 ? andParts[0]! : { AND: andParts };

  const rows = await prisma.product.findMany({
    where,
    take,
    orderBy: { updatedAt: 'desc' },
    include: {
      locations: { include: { location: true } },
    },
  });

  return rows.map(serializeProduct);
}

export async function getProductById(id: string, options?: { salesCatalogOnly?: boolean }) {
  const row = await prisma.product.findUnique({
    where: { id },
    include: { locations: { include: { location: true } } },
  });
  if (!row) return null;
  if (options?.salesCatalogOnly && isExcludedSalesCatalogProductType(row.productType)) {
    return null;
  }
  return serializeProduct(row);
}

export async function createProduct(
  input: {
    code?: string | null;
    name: string;
    description?: string | null;
    unit?: string;
    productType?: string | null;
    group?: string | null;
    costPrice?: number | null;
    salePrice?: number | null;
    minStock?: number;
    reorderPoint?: number | null;
    status?: string;
    photoUrl?: string | null;
    techSheet?: string | null;
    entityRecordId?: string | null;
  },
) {
  const code = (input.code && String(input.code).trim()) || `PROD-${Date.now()}`;
  const existingCode = await prisma.product.findUnique({ where: { code } });
  if (existingCode) {
    throw new Error(`Código de produto já em uso: ${code}`);
  }

  const defaultLoc = await getOrCreateDefaultLocation();

  const row = await prisma.product.create({
    data: {
      code,
      name: input.name,
      description: input.description ?? undefined,
      unit: input.unit ?? 'UN',
      productType: input.productType ?? undefined,
      group: input.group ?? undefined,
      costPrice:
        input.costPrice !== undefined && input.costPrice !== null
          ? new Prisma.Decimal(input.costPrice)
          : undefined,
      salePrice:
        input.salePrice !== undefined && input.salePrice !== null
          ? new Prisma.Decimal(input.salePrice)
          : undefined,
      minStock: new Prisma.Decimal(input.minStock ?? 0),
      reorderPoint:
        input.reorderPoint !== undefined && input.reorderPoint !== null
          ? new Prisma.Decimal(input.reorderPoint)
          : undefined,
      status: input.status ?? 'Ativo',
      photoUrl: input.photoUrl ?? undefined,
      techSheet: input.techSheet ?? undefined,
      ...(input.entityRecordId
        ? { entityRecord: { connect: { id: input.entityRecordId } } }
        : {}),
      locations: {
        create: {
          locationId: defaultLoc.id,
          quantity: new Prisma.Decimal(0),
        },
      },
    },
    include: { locations: { include: { location: true } } },
  });

  return serializeProduct(row);
}

export async function updateProduct(
  id: string,
  input: Partial<{
    code: string | null;
    name: string;
    description: string | null;
    unit: string;
    productType: string | null;
    group: string | null;
    costPrice: number | null;
    salePrice: number | null;
    minStock: number;
    reorderPoint: number | null;
    status: string;
    photoUrl: string | null;
    techSheet: string | null;
    entityRecordId: string | null;
  }>,
  opts?: { salesCatalogOnly?: boolean },
) {
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) throw new Error('Produto não encontrado');

  if (opts?.salesCatalogOnly) {
    if (isExcludedSalesCatalogProductType(current.productType)) {
      throw new Error('Sem permissão para alterar insumos ou matéria-prima neste perfil');
    }
    if (input.productType !== undefined && isExcludedSalesCatalogProductType(input.productType)) {
      throw new Error('Tipo não permitido para o cadastro comercial (use Produto, Serviço, etc.)');
    }
  }

  if (input.code !== undefined && input.code !== null && input.code !== current.code) {
    const clash = await prisma.product.findUnique({ where: { code: input.code } });
    if (clash) throw new Error(`Código já em uso: ${input.code}`);
  }

  const data: Prisma.ProductUpdateInput = {};
  if (input.code !== undefined) data.code = input.code ?? undefined;
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description ?? undefined;
  if (input.unit !== undefined) data.unit = input.unit;
  if (input.productType !== undefined) data.productType = input.productType ?? undefined;
  if (input.group !== undefined) data.group = input.group ?? undefined;
  if (input.costPrice !== undefined) {
    data.costPrice =
      input.costPrice !== null ? new Prisma.Decimal(input.costPrice) : null;
  }
  if (input.salePrice !== undefined) {
    data.salePrice =
      input.salePrice !== null ? new Prisma.Decimal(input.salePrice) : null;
  }
  if (input.minStock !== undefined) data.minStock = new Prisma.Decimal(input.minStock);
  if (input.reorderPoint !== undefined) {
    data.reorderPoint =
      input.reorderPoint !== null ? new Prisma.Decimal(input.reorderPoint) : null;
  }
  if (input.status !== undefined) data.status = input.status;
  if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl ?? undefined;
  if (input.techSheet !== undefined) data.techSheet = input.techSheet ?? undefined;
  if (input.entityRecordId !== undefined) {
    if (input.entityRecordId === null) {
      data.entityRecord = { disconnect: true };
    } else {
      data.entityRecord = { connect: { id: input.entityRecordId } };
    }
  }

  const row = await prisma.product.update({
    where: { id },
    data,
    include: { locations: { include: { location: true } } },
  });
  return serializeProduct(row);
}

export async function inactivateProduct(id: string) {
  const row = await prisma.product.update({
    where: { id },
    data: { status: 'Inativo' },
    include: { locations: { include: { location: true } } },
  });
  return serializeProduct(row);
}

export async function listMovements(filter: { productId?: string; take?: number }) {
  const take = filter.take ?? 500;
  const where: Prisma.StockMovementWhereInput = {};
  if (filter.productId) where.productId = filter.productId;

  const rows = await prisma.stockMovement.findMany({
    where,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { id: true, code: true, name: true } },
      location: { select: { id: true, code: true, name: true } },
      user: { select: { id: true, fullName: true } },
    },
  });

  return rows.map((m) => ({
    id: m.id,
    productId: m.productId,
    locationId: m.locationId,
    type: m.type,
    quantity: m.quantity.toNumber(),
    reference: m.reference,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    product: m.product,
    location: m.location,
    user: m.user,
  }));
}

export async function listLocations() {
  return prisma.location.findMany({ orderBy: { code: 'asc' } });
}

export async function createLocation(input: {
  code: string;
  name: string;
  warehouse?: string | null;
  aisle?: string | null;
  rack?: string | null;
  bin?: string | null;
  active?: boolean;
}) {
  return prisma.location.create({
    data: {
      code: input.code.trim(),
      name: input.name.trim(),
      warehouse: input.warehouse ?? undefined,
      aisle: input.aisle ?? undefined,
      rack: input.rack ?? undefined,
      bin: input.bin ?? undefined,
      active: input.active ?? true,
    },
  });
}

export async function updateLocation(
  id: string,
  input: Partial<{
    code: string;
    name: string;
    warehouse: string | null;
    aisle: string | null;
    rack: string | null;
    bin: string | null;
    active: boolean;
  }>,
) {
  const data: Prisma.LocationUpdateInput = {};
  if (input.code !== undefined) data.code = input.code;
  if (input.name !== undefined) data.name = input.name;
  if (input.warehouse !== undefined) data.warehouse = input.warehouse ?? undefined;
  if (input.aisle !== undefined) data.aisle = input.aisle ?? undefined;
  if (input.rack !== undefined) data.rack = input.rack ?? undefined;
  if (input.bin !== undefined) data.bin = input.bin ?? undefined;
  if (input.active !== undefined) data.active = input.active;

  return prisma.location.update({ where: { id }, data });
}

export async function deleteLocation(id: string) {
  const used = await prisma.productLocation.count({ where: { locationId: id } });
  if (used > 0) throw new Error('Endereço possui saldos vinculados');
  await prisma.location.delete({ where: { id } });
}

export async function listProductLocations(productId: string) {
  const rows = await prisma.productLocation.findMany({
    where: { productId },
    include: { location: true },
    orderBy: { location: { code: 'asc' } },
  });
  return rows.map((r) => ({
    productId: r.productId,
    locationId: r.locationId,
    quantity: r.quantity.toNumber(),
    locationCode: r.location.code,
    locationName: r.location.name,
  }));
}

export async function createInventoryCount(input: {
  notes?: string | null;
  productIds?: string[];
}) {
  const code = `INV-${Date.now()}`;
  const defaultLoc = await getOrCreateDefaultLocation();

  const products =
    input.productIds && input.productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: input.productIds } },
          include: { locations: true },
        })
      : await prisma.product.findMany({
          where: { status: { not: 'Inativo' } },
          include: { locations: true },
          take: 5000,
        });

  const count = await prisma.inventoryCount.create({
    data: {
      code,
      status: 'RASCUNHO',
      notes: input.notes ?? undefined,
      items: {
        create: products.flatMap((p) => {
          if (p.locations.length === 0) {
            return [
              {
                productId: p.id,
                locationId: defaultLoc.id,
                qtySystem: new Prisma.Decimal(0),
              },
            ];
          }
          return p.locations.map((pl) => ({
            productId: p.id,
            locationId: pl.locationId,
            qtySystem: pl.quantity,
          }));
        }),
      },
    },
    include: { items: { include: { product: true, location: true } } },
  });

  return count;
}

export async function listInventoryCounts() {
  return prisma.inventoryCount.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      items: { include: { product: { select: { code: true, name: true } } } },
      approvedBy: { select: { fullName: true, email: true } },
    },
  });
}

export async function getInventoryCount(id: string) {
  return prisma.inventoryCount.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, location: true } },
      approvedBy: { select: { fullName: true, email: true } },
    },
  });
}

export async function patchInventoryCount(
  id: string,
  input: { status?: 'RASCUNHO' | 'EM_CONTAGEM' | 'APROVADO'; notes?: string | null },
) {
  const data: Prisma.InventoryCountUpdateInput = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.notes !== undefined) data.notes = input.notes ?? undefined;
  return prisma.inventoryCount.update({ where: { id }, data });
}

export async function patchInventoryItem(
  itemId: string,
  input: { qtyCounted: number | null },
) {
  const item = await prisma.inventoryCountItem.findUnique({
    where: { id: itemId },
    include: { inventoryCount: true },
  });
  if (!item) throw new Error('Linha de inventário não encontrada');
  if (item.inventoryCount.status === 'APROVADO') {
    throw new Error('Inventário já aprovado');
  }

  return prisma.inventoryCountItem.update({
    where: { id: itemId },
    data: {
      qtyCounted:
        input.qtyCounted === null ? null : new Prisma.Decimal(input.qtyCounted),
    },
  });
}

export async function approveInventoryCount(id: string, userId: string | undefined) {
  const inv = await prisma.inventoryCount.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!inv) throw new Error('Inventário não encontrado');
  if (inv.status === 'APROVADO') throw new Error('Inventário já aprovado');

  const defaultLoc = await getOrCreateDefaultLocation();

  await prisma.$transaction(async (tx) => {
    for (const item of inv.items) {
      if (item.qtyCounted === null) continue;

      const locId = item.locationId ?? defaultLoc.id;
      await ensureProductLocationRowTx(tx, item.productId, locId);

      const current = await getQtyAtLocation(tx, item.productId, locId);
      const target = item.qtyCounted;
      const delta = target.minus(current);

      if (delta.equals(0)) continue;

      await applyStockMovement(
        {
          productId: item.productId,
          locationId: locId,
          type: 'AJUSTE',
          quantity: delta,
          userId,
          reference: inv.code,
          notes: 'Ajuste por inventário aprovado',
        },
        tx,
      );
    }

    await tx.inventoryCount.update({
      where: { id },
      data: {
        status: 'APROVADO',
        approvedAt: new Date(),
        approvedById: userId ?? undefined,
      },
    });
  });

  return getInventoryCount(id);
}
