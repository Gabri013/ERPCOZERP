import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../infra/prisma.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  companyId?: string;
  roles?: string[];
}

let io: SocketIOServer;

export function initializeSocketIO(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const secret = process.env.JWT_SECRET || 'dev_change_me';
      const decoded = jwt.verify(token, secret) as any;

      if (!decoded.companyId) {
        return next(new Error('Invalid token'));
      }

      // Verificar empresa ativa
      const company = await prisma.company.findUnique({
        where: { id: decoded.companyId },
        select: { ativo: true },
      });

      if (!company || !company.ativo) {
        return next(new Error('Company inactive'));
      }

      socket.userId = decoded.sub;
      socket.companyId = decoded.companyId;
      socket.roles = decoded.roles || [];

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected from company ${socket.companyId}`);

    // Join company room
    socket.join(`company:${socket.companyId}`);

    // Join user room
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });

    // Handle custom events
    socket.on('join_module', (module: string) => {
      socket.join(`company:${socket.companyId}:${module}`);
    });

    socket.on('leave_module', (module: string) => {
      socket.leave(`company:${socket.companyId}:${module}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

// Notification functions
export function notifyCompany(companyId: string, event: string, data: any) {
  if (!io) return;
  io.to(`company:${companyId}`).emit(event, data);
}

export function notifyUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function notifyCompanyModule(companyId: string, module: string, event: string, data: any) {
  if (!io) return;
  io.to(`company:${companyId}:${module}`).emit(event, data);
}

// Specific notification types
export function notifyNewSaleOrder(companyId: string, order: any) {
  notifyCompany(companyId, 'sale_order_created', {
    type: 'sale_order',
    action: 'created',
    data: order,
  });
}

export function notifySaleOrderUpdated(companyId: string, order: any) {
  notifyCompany(companyId, 'sale_order_updated', {
    type: 'sale_order',
    action: 'updated',
    data: order,
  });
}

export function notifyNewPurchaseOrder(companyId: string, order: any) {
  notifyCompany(companyId, 'purchase_order_created', {
    type: 'purchase_order',
    action: 'created',
    data: order,
  });
}

export function notifyLowStock(companyId: string, product: any, location: any) {
  notifyCompanyModule(companyId, 'inventory', 'low_stock_alert', {
    type: 'inventory',
    action: 'low_stock',
    data: { product, location },
  });
}