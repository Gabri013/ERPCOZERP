import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

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

  io.use((socket, next) => {
    try {
      const raw =
        (socket.handshake.auth as { token?: string })?.token ||
        String(socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();

      if (!raw) return next(new Error('unauthorized'));

      const decoded = jwt.verify(raw, jwtSecret) as { sub?: string };
      const userId = decoded?.sub ? String(decoded.sub) : '';
      if (!userId) return next(new Error('unauthorized'));

      socket.join(`user:${userId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket.data as any).userId = userId;
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', () => {
    // pings implícitos do cliente
  });

  ioInstance = io;
  return io;
}
