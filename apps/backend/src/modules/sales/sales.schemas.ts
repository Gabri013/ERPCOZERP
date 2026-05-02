import { z } from 'zod';

export const listSaleOrdersQuerySchema = z.object({
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  take: z.coerce.number().min(1).max(500).optional(),
});

export const createCustomerSchema = z.object({
  code: z.string().max(64).optional(),
  name: z.string().min(1).max(500),
  document: z.string().max(32).optional().nullable(),
  email: z.string().max(256).optional().nullable(),
  phone: z.string().max(64).optional().nullable(),
  address: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional(),
});

export const patchCustomerSchema = createCustomerSchema.partial();

export const saleOrderItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discountPct: z.number().min(0).max(100).optional().nullable(),
});

export const createSaleOrderSchema = z.object({
  customerId: z.string().uuid(),
  status: z.string().max(80).optional(),
  kanbanColumn: z.string().max(80).optional(),
  orderDate: z.string().optional(),
  deliveryDate: z.union([z.string(), z.null()]).optional(),
  notes: z.string().max(10000).optional().nullable(),
  items: z.array(saleOrderItemInputSchema).min(1),
});

export const patchSaleOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.string().max(80).optional(),
  kanbanColumn: z.string().max(80).optional(),
  kanbanOrder: z.number().int().optional(),
  deliveryDate: z.union([z.string(), z.null()]).optional(),
  notes: z.string().max(10000).optional().nullable(),
  items: z.array(saleOrderItemInputSchema).optional(),
});

export const kanbanPatchSchema = z.object({
  kanbanColumn: z.string().min(1).max(80),
  kanbanOrder: z.number().int().min(0).optional(),
});

export const quoteItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discountPct: z.number().min(0).max(100).optional().nullable(),
});

export const createQuoteSchema = z.object({
  customerId: z.string().uuid(),
  validUntil: z.union([z.string(), z.null()]).optional(),
  notes: z.string().max(10000).optional().nullable(),
  items: z.array(quoteItemInputSchema).min(1),
});

export const patchQuoteSchema = z.object({
  status: z.enum(['RASCUNHO', 'ENVIADO', 'CONVERTIDO', 'CANCELADO']).optional(),
  validUntil: z.union([z.string(), z.null()]).optional(),
  notes: z.string().max(10000).optional().nullable(),
  items: z.array(quoteItemInputSchema).optional(),
});

export const createPriceTableSchema = z.object({
  code: z.string().max(64).optional(),
  name: z.string().min(1).max(300),
  currency: z.string().max(8).optional(),
  active: z.boolean().optional(),
  validFrom: z.union([z.string(), z.null()]).optional(),
  validTo: z.union([z.string(), z.null()]).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        price: z.number().min(0),
        minQty: z.number().min(0).optional().nullable(),
      }),
    )
    .optional(),
});

export const patchPriceTableSchema = createPriceTableSchema.partial();

export const priceTableItemBodySchema = z.object({
  productId: z.string().uuid(),
  price: z.number().min(0),
  minQty: z.number().min(0).optional().nullable(),
});
