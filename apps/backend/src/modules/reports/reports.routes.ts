import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { generatePDF, generateSaleOrderHTML, generatePurchaseOrderHTML } from './pdf.service.js';
import { prisma } from '../../infra/prisma.js';

export const reportsRouter = Router();

reportsRouter.use(authenticate);

// PDF de Pedido de Venda
reportsRouter.get('/sale-orders/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const order = await prisma.saleOrder.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const html = generateSaleOrderHTML(order);
    const pdfBuffer = await generatePDF({ html });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pedido-${order.number}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error('Erro ao gerar PDF do pedido:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PDF de Ordem de Compra
reportsRouter.get('/purchase-orders/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, companyId },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Ordem de compra não encontrada' });
    }

    const html = generatePurchaseOrderHTML(order);
    const pdfBuffer = await generatePDF({ html });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ordem-compra-${order.number}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error('Erro ao gerar PDF da ordem de compra:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Relatório de Vendas (resumo)
reportsRouter.get('/sales-summary', async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { startDate, endDate } = req.query;

    const where: any = { companyId };
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate as string);
      if (endDate) where.orderDate.lte = new Date(endDate as string);
    }

    const orders = await prisma.saleOrder.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { orderDate: 'desc' },
    });

    const summary = {
      totalOrders: orders.length,
      totalValue: orders.reduce((sum, order) => sum + (order.totalAmount?.toNumber() || 0), 0),
      orders,
    };

    res.json({ success: true, data: summary });
  } catch (e) {
    console.error('Erro ao gerar relatório de vendas:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});