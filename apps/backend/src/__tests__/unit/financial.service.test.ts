import { beforeEach, describe, expect, it } from 'vitest';
import { prismaMock, resetPrismaMock } from '../helpers/prisma.mock.js';
import { dre } from '../../modules/financial/financial.service.js';

describe('financial.service dre', () => {
  beforeEach(() => {
    resetPrismaMock();
    prismaMock.entity.findUnique.mockImplementation(async ({ where }: { where: { code: string } }) => {
      if (where.code === 'conta_receber') return { id: 'ent-rec' };
      if (where.code === 'conta_pagar') return { id: 'ent-pay' };
      return null;
    });

    prismaMock.entityRecord.findMany.mockImplementation(async ({ where }: { where: { entityId: string } }) => {
      if (where.entityId === 'ent-rec') {
        return [
          {
            id: 'r1',
            createdAt: new Date('2026-05-01T00:00:00.000Z'),
            data: { status: 'PAGO', valor: 50000, descricao: 'Vendas maio' },
          },
        ];
      }
      if (where.entityId === 'ent-pay') {
        return [
          {
            id: 'p1',
            createdAt: new Date('2026-05-02T00:00:00.000Z'),
            data: { status: 'PAGO', valor: 30000, descricao: 'Custos maio' },
          },
        ];
      }
      return [];
    });
  });

  it('calcula receita, despesa e resultado liquido', async () => {
    const resultado = await dre();
    expect(resultado.receita).toBe(50000);
    expect(resultado.despesa).toBe(30000);
    expect(resultado.resultado).toBe(20000);
  });

  it('retorna zero quando nao ha lancamentos', async () => {
    prismaMock.entityRecord.findMany.mockResolvedValue([]);
    const resultado = await dre();
    expect(resultado.receita).toBe(0);
    expect(resultado.despesa).toBe(0);
    expect(resultado.resultado).toBe(0);
  });
});
