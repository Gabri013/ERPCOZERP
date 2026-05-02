import { z } from 'zod';

export const createWorkOrderSchema = z.object({
  number: z.string().min(1).optional(),
  saleOrderId: z.string().uuid().optional().nullable(),
  productId: z.string().uuid(),
  routingId: z.string().uuid().optional().nullable(),
  quantityPlanned: z.number().positive(),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  kanbanColumn: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional().nullable(),
  responsibleUserId: z.string().uuid().optional().nullable(),
});

export const patchWorkOrderSchema = createWorkOrderSchema.partial().extend({
  status: z.string().optional(),
});

export const kanbanReorderSchema = z.object({
  column: z.string(),
  orderedIds: z.array(z.string().uuid()),
});

export const createMachineSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  sector: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const createRoutingSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  productId: z.string().uuid().optional().nullable(),
  active: z.boolean().optional(),
  stages: z
    .array(
      z.object({
        sortOrder: z.number().int().optional(),
        name: z.string().min(1),
        machineId: z.string().uuid().optional().nullable(),
        durationMinutes: z.number().int().positive().optional().nullable(),
      }),
    )
    .optional(),
});
