import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logInfo } from './infra/logger.js';
import { initSocketIOServer } from './realtime/io.js';
import { scheduleOverdueProductionScan } from './realtime/op-delay-scan.js';
import { ensureUploadDirs } from './modules/products/products.service.js';
import { registerCrmAutomationHandlers } from './modules/crm/crm-automation.register.js';

registerCrmAutomationHandlers();

void ensureUploadDirs();

const app = createApp();
const httpServer = http.createServer(app);

const jwtSecret = env.JWT_SECRET || process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('[backend-core] JWT_SECRET obrigatório para iniciar o Socket.IO.');
}

initSocketIOServer(httpServer, env.ALLOWED_ORIGINS, jwtSecret);
scheduleOverdueProductionScan(180_000);

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logInfo(
      `[backend-core] Porta ${env.PORT} já está em uso (outra instância do servidor?). Encerre o processo ou defina outra PORT no .env.`,
      { code: err.code },
    );
  }
  throw err;
});

httpServer.listen(env.PORT, '0.0.0.0', () => {
  logInfo(`[backend-core] listening on :${env.PORT}`, { socketio: '/socket.io' });
});
