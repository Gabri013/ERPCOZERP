import { vi } from 'vitest';

export const prismaMock = {
  employee: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  timeEntry: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  leaveRequest: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  payrollRun: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  payrollLine: {
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
  entity: {
    findUnique: vi.fn(),
  },
  entityRecord: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  saleOrder: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  workOrder: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  product: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  productLocation: {
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  location: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  stockMovement: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  userNotification: {
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

prismaMock.$transaction.mockImplementation(async (fn: (db: typeof prismaMock) => unknown) => fn(prismaMock));

export function resetPrismaMock() {
  for (const value of Object.values(prismaMock)) {
    if (value && typeof value === 'object') {
      for (const nested of Object.values(value)) {
        if (typeof nested === 'function' && 'mockReset' in nested) {
          (nested as { mockReset: () => void }).mockReset();
        }
      }
      continue;
    }
    if (typeof value === 'function' && 'mockReset' in value) {
      (value as { mockReset: () => void }).mockReset();
    }
  }

  prismaMock.$transaction.mockImplementation(async (fn: (db: typeof prismaMock) => unknown) => fn(prismaMock));
}

vi.mock('../../infra/prisma.js', () => ({ prisma: prismaMock }));
