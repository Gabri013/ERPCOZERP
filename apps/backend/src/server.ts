import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logInfo } from './infra/logger.js';
import { initSocketIOServer } from './realtime/io.js';
import { scheduleOverdueProductionScan } from './realtime/op-delay-scan.js';

const app = createApp();
const httpServer = http.createServer(app);

const jwtSecret = env.JWT_SECRET || process.env.JWT_SECRET || 'dev_change_me';

initSocketIOServer(httpServer, env.FRONTEND_URL || 'http://localhost:5173', jwtSecret);
scheduleOverdueProductionScan(180_000);

httpServer.listen(env.PORT, () => {
  logInfo(`[backend-core] listening on :${env.PORT}`, { socketio: '/socket.io' });
});
