import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { prismaMock, resetPrismaMock } from '../helpers/prisma.mock.js';
import { approveSaleOrder } from '../../modules/sales/sales.service.js';

vi.mock('../../services/socket.service.js', () => ({
  notifyNewSaleOrder: vi.fn(),
}));

vi.mock('../../modules/webhooks/webhook.service.js', () => ({
  triggerWebhooks: vi.fn(),
}));

describe('approveSaleOrder', () => {
  beforeEach(() => {
    resetPrismaMock();
    prismaMock.saleOrder.findUnique.mockResolvedValue({
      id: 'so1',
      status: 'DRAFT',
      companyId: 'c1',
      customerId: 'cu1',
      totalAmount: new Prisma.Decimal(500),
    });
    prismaMock.saleOrder.update.mockResolvedValue({
      id: 'so1',
      status: 'APPROVED',
      kanbanColumn: 'PRODUCAO',
    });
  });

  it('muda status para APPROVED', async () => {
    await approveSaleOrder('so1', 'user1');
    expect(prismaMock.saleOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED' }) }),
    );
  });

  it('lanca erro para pedido inexistente', async () => {
    prismaMock.saleOrder.findUnique.mockResolvedValueOnce(null);
    await expect(approveSaleOrder('inexistente', 'user1')).rejects.toThrow('Pedido não encontrado');
  });
});