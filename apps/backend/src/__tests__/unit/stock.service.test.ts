import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { runWithTenant } from '../../infra/tenantContext.js';
import { applyStockMovement, decimalToNumber } from '../../modules/stock/stock.service.js';

type FakeDb = {
  productLocation: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  stockMovement: {
    create: ReturnType<typeof vi.fn>;
  };
};

function buildDb(initialQty: Prisma.Decimal): FakeDb {
  const state = { qty: initialQty };
  return {
    productLocation: {
      findFirst: vi.fn(async () => ({ quantity: state.qty })),
      create: vi.fn(async () => ({ quantity: new Prisma.Decimal(0) })),
      updateMany: vi.fn(async ({ data }: { data: { quantity: Prisma.Decimal } }) => {
        state.qty = data.quantity;
        return { count: 1 };
      }),
    },
    stockMovement: {
      create: vi.fn(async ({ data }: { data: { type: string; quantity: Prisma.Decimal; notes?: string } }) => ({
        id: 'sm-1',
        ...data,
      })),
    },
  };
}

describe('stock.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('decimalToNumber converte decimal corretamente', () => {
    expect(decimalToNumber(new Prisma.Decimal(10.5))).toBe(10.5);
    expect(decimalToNumber(null)).toBeNull();
  });

  it('cria movimento de ENTRADA e incrementa saldo', async () => {
    const db = buildDb(new Prisma.Decimal(10));
    await runWithTenant({ companyId: 'c1' }, async () => {
      await applyStockMovement(
        {
          productId: 'p1',
          locationId: 'l1',
          type: 'ENTRADA',
          quantity: new Prisma.Decimal(5),
          notes: 'Recebimento',
        },
        db as unknown as Parameters<typeof applyStockMovement>[1],
      );
    });

    expect(db.productLocation.updateMany).toHaveBeenCalled();
    expect(db.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'ENTRADA' }) }),
    );
  });

  it('nao permite SAIDA com saldo insuficiente', async () => {
    const db = buildDb(new Prisma.Decimal(2));

    await expect(
      runWithTenant({ companyId: 'c1' }, async () => {
        await applyStockMovement(
          {
            productId: 'p1',
            locationId: 'l1',
            type: 'SAIDA',
            quantity: new Prisma.Decimal(5),
            notes: 'Consumo OP',
          },
          db as unknown as Parameters<typeof applyStockMovement>[1],
        );
      }),
    ).rejects.toThrow('Saldo insuficiente');
  });
});
