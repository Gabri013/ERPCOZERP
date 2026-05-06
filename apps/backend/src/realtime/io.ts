import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../infra/prisma.js';

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

function normalizeOrigins(origins: string[]) {
  return origins.length ? origins : true;
}

export function initSocketIOServer(httpServer: HttpServer, frontendOrigins: string[], jwtSecret: string) {
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io/',
    cors: {
      origin: normalizeOrigins(frontendOrigins),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const raw =
        (socket.handshake.auth as { token?: string })?.token ||
        String(socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();

      if (!raw) return next(new Error('unauthorized'));

      const decoded = jwt.verify(raw, jwtSecret) as { sub?: string; companyId?: string; roles?: string[] };
      const userId = decoded?.sub ? String(decoded.sub) : '';
      const companyId = decoded?.companyId ? String(decoded.companyId) : '';

      if (!userId || !companyId) return next(new Error('unauthorized'));

      // Verificar empresa ativa
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { ativo: true },
      });

      if (!company || !company.ativo) {
        return next(new Error('Company inactive'));
      }

      socket.join(`user:${userId}`);
      socket.join(`company:${companyId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket.data as any).userId = userId;
      (socket.data as any).companyId = companyId;
      (socket.data as any).roles = decoded.roles || [];
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket.data as any).userId;
    const companyId = (socket.data as any).companyId;
    console.log(`User ${userId} connected from company ${companyId}`);

    socket.on('join_module', (module: string) => {
      socket.join(`company:${companyId}:${module}`);
    });

    socket.on('leave_module', (module: string) => {
      socket.leave(`company:${companyId}:${module}`);
    });
  });

  ioInstance = io;
  return io;
}
