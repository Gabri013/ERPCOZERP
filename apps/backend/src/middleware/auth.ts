import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../infra/prisma.js';
import { getEffectivePermissionCodesForUserId } from '../lib/effectivePermissions.js';

export type AuthUser = {
  userId: string;
  email: string;
  roles: string[];
  /** Códigos de permissão efetivos (papéis + extras por usuário + master), alinhados ao banco. */
  permissions: string[];
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
    const secret = process.env.JWT_SECRET || 'dev_change_me';
    const decoded = jwt.verify(token, secret) as {
      sub?: string;
      email?: string;
      roles?: string[];
      permissions?: string[];
    };
    const sub = typeof decoded.sub === 'string' && decoded.sub.length > 0 ? decoded.sub : '';
    if (!sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
    let permissions = Array.isArray(decoded.permissions) ? decoded.permissions : [];
    // Tokens antigos (só `roles`): hidratar permissões do banco para RBAC condizente.
    if (!permissions.length) {
      try {
        permissions = await getEffectivePermissionCodesForUserId(sub);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[authenticate] falha ao hidratar permissões:', e instanceof Error ? e.message : e);
        permissions = [];
      }
    }
    req.user = {
      userId: sub,
      email: String(decoded.email || ''),
      roles,
      permissions,
    };
    return next();
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

