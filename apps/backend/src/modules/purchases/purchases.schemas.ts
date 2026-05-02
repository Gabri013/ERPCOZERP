import { z } from 'zod';

export const createSupplierSchema = z.object({
  code: z.string().max(64).optional(),
  name: z.string().min(1).max(500),
  document: z.string().max(32).optional().nullable(),
  email: z.string().max(256).optional().nullable(),
  phone: z.string().max(64).optional().nullable(),
  active: z.boolean().optional(),
});

export const poItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitCost: z.number().min(0).optional().nullable(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  expectedDate: z.union([z.string(), z.null()]).optional(),
  notes: z.string().max(10000).optional().nullable(),
  items: z.array(poItemInputSchema).min(1),
});

export const receivePurchaseOrderSchema = z.object({
  lines: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
    }),
  ).min(1),
});
