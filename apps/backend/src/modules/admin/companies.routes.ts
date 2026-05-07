import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../../infra/prisma.js';
import { validate } from '../../middleware/validate.js';

export const adminCompaniesRouter = Router();

// Listar empresas
adminCompaniesRouter.get('/companies', async (_req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            customers: true,
            saleOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: companies });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Criar empresa
adminCompaniesRouter.post('/companies', [
  body('cnpj').isLength({ min: 14, max: 18 }).withMessage('CNPJ inválido'),
  body('razaoSocial').isLength({ min: 1 }).withMessage('Razão social obrigatória'),
  body('fantasia').optional(),
  body('ativo').optional().isBoolean(),
], validate, async (req: Request, res: Response) => {
  try {
    const { cnpj, razaoSocial, fantasia, ativo = true } = req.body;

    // Verificar se CNPJ já existe
    const existing = await prisma.company.findUnique({ where: { cnpj } });
    if (existing) {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }

    const company = await prisma.company.create({
      data: {
        cnpj,
        razaoSocial,
        fantasia,
        ativo,
      },
    });

    res.status(201).json({ success: true, data: company });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Atualizar empresa
adminCompaniesRouter.patch('/companies/:id', [
  body('razaoSocial').optional().isLength({ min: 1 }),
  body('fantasia').optional(),
  body('ativo').optional().isBoolean(),
], validate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { razaoSocial, fantasia, ativo } = req.body;

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(razaoSocial && { razaoSocial }),
        ...(fantasia !== undefined && { fantasia }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    res.json({ success: true, data: company });
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Deletar empresa (soft delete)
adminCompaniesRouter.delete('/companies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se há dados relacionados
    const counts = await prisma.company.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            users: true,
            products: true,
            customers: true,
            saleOrders: true,
          },
        },
      },
    });

    if (!counts) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const totalRelated = counts._count.users + counts._count.products + counts._count.customers + counts._count.saleOrders;
    if (totalRelated > 0) {
      return res.status(400).json({ error: 'Não é possível excluir empresa com dados relacionados' });
    }

    await prisma.company.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' });
  }
});