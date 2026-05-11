import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../infra/prisma.js';
import { env } from '../config/env.js';
import { runWithTenant } from '../infra/tenantContext.js';
import { getEffectivePermissionCodesForUserId } from '../lib/effectivePermissions.js';

export type AuthUser = {
  userId: string;
  email: string;
  roles: string[];
  /** Codigos de permissao efetivos (papeis + extras por usuario + master), alinhados ao banco. */
  permissions: string[];
  companyId: string;
};

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const secret = env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT nao configurado no servidor' });
    }

    const decoded = jwt.verify(token, secret) as {
      sub?: string;
      email?: string;
      roles?: string[];
      permissions?: string[];
      companyId?: string;
    };
    const sub = typeof decoded.sub === 'string' && decoded.sub.length > 0 ? decoded.sub : '';
    if (!sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
    let permissions = Array.isArray(decoded.permissions) ? decoded.permissions : [];
    if (!permissions.length) {
      try {
        permissions = await getEffectivePermissionCodesForUserId(sub);
      } catch (e) {
        console.error('[authenticate] falha ao hidratar permissoes:', e instanceof Error ? e.message : e);
        permissions = [];
      }
    }

    const companyId = String(decoded.companyId || '');
    if (!companyId) {
      return res.status(400).json({ error: 'Token invalido - companyId ausente' });
    }

    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, ativo: true },
      });

      if (!company || !company.ativo) {
        return res.status(403).json({
          error: 'Empresa inativa ou nao existe',
        });
      }
    } catch {
      return res.status(503).json({
        error: 'Falha ao validar tenant da sessao',
      });
    }

    req.user = {
      userId: sub,
      email: String(decoded.email || ''),
      roles,
      permissions,
      companyId,
    };

    return runWithTenant({ companyId }, () => next());
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!req.user.roles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}

export function requirePermission(permissionCodeOrList: string | string[]) {
  const codes = Array.isArray(permissionCodeOrList) ? permissionCodeOrList : [permissionCodeOrList];
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      if (req.user.roles.includes('master')) return next();

      const effective = await getEffectivePermissionCodesForUserId(req.user.userId);
      if (codes.some((c) => effective.includes(c))) return next();

      return res.status(403).json({ error: 'Forbidden' });
    } catch (e) {
      return next(e as Error);
    }
  };
}
