import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../infra/prisma.js';
import { runWithTenant } from '../infra/tenantContext.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    companyId: string;
    email: string;
    role: string;
  };
}

export const tenantMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded.companyId) {
      return res.status(400).json({ error: 'Token inválido - companyId ausente' });
    }

    // Verificar se a empresa existe e está ativa
    const company = await prisma.company.findUnique({
      where: { id: decoded.companyId },
      select: { id: true, ativo: true }
    });

    if (!company || !company.ativo) {
      return res.status(403).json({ error: 'Empresa inativa ou não encontrada' });
    }

    req.user = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      email: decoded.email,
      role: decoded.role
    };

    // Run the remainder of request handling inside the tenant context
    return runWithTenant({ companyId: decoded.companyId }, () => next());
  } catch (error) {
    console.error('Erro no tenant middleware:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};