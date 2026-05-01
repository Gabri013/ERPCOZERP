import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../infra/prisma.js';

export type AuthUser = {
  userId: string;
  email: string;
  roles: string[];
};

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_change_me';
    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
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

      const roles = await prisma.userRole.findMany({
        where: { userId: req.user.userId },
        select: { roleId: true, role: { select: { code: true } } },
      });

      // Shortcut in case token already contains role codes but DB got out of sync
      if (roles.some((r) => r.role.code === 'master')) return next();

      const roleIds = roles.map((r) => r.roleId);
      if (!roleIds.length) return res.status(403).json({ error: 'Forbidden' });

      const allowed = await prisma.rolePermission.findFirst({
        where: {
          roleId: { in: roleIds },
          granted: true,
          permission: { code: { in: codes }, active: true },
        },
        select: { id: true },
      });

      if (!allowed) return res.status(403).json({ error: 'Forbidden' });
      return next();
    } catch (e) {
      return next(e as Error);
    }
  };
}

