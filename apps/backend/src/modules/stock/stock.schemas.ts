import { z } from 'zod';

export const stockMovementTypeSchema = z.enum(['ENTRADA', 'SAIDA', 'AJUSTE']);

export const listProductsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  take: z.coerce.number().min(1).max(5000).optional(),
  skip: z.coerce.number().min(0).optional(),
});

export const createProductSchema = z.object({
  code: z.string().max(120).optional(),
  name: z.string().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  unit: z.string().max(32).optional(),
  productType: z.string().max(120).optional().nullable(),
  group: z.string().max(120).optional().nullable(),
  costPrice: z.number().optional().nullable(),
  salePrice: z.number().optional().nullable(),
  minStock: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional().nullable(),
  status: z.string().max(80).optional(),
  photoUrl: z.string().max(2000).optional().nullable(),
  techSheet: z.string().max(50000).optional().nullable(),
  entityRecordId: z.string().uuid().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const createMovementSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid().optional().nullable(),
  type: stockMovementTypeSchema,
  quantity: z.number().positive(),
  reference: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const listMovementsQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  take: z.coerce.number().min(1).max(5000).optional(),
});

export const createLocationSchema = z.object({
  code: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  warehouse: z.string().max(120).optional().nullable(),
  aisle: z.string().max(80).optional().nullable(),
  rack: z.string().max(80).optional().nullable(),
  bin: z.string().max(80).optional().nullable(),
  active: z.boolean().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

export const createInventoryCountSchema = z.object({
  notes: z.string().max(5000).optional().nullable(),
  productIds: z.array(z.string().uuid()).optional(),
});

export const patchInventoryCountSchema = z.object({
  status: z.enum(['RASCUNHO', 'EM_CONTAGEM', 'APROVADO']).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export const patchInventoryItemSchema = z.object({
  qtyCounted: z.number().min(0).nullable(),
});
