import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { env } from './config/env.js';
import { registerHealthModule } from './modules/health/health.module.js';
import { registerAuthModule } from './modules/auth/auth.module.js';
import { registerEntitiesModule } from './modules/entities/entities.module.js';
import { registerRecordsModule } from './modules/records/records.module.js';
import { registerUsersModule } from './modules/users/users.module.js';
import { registerClientesModule } from './modules/vendas/clientes.module.js';
import { registerOrdensCompraModule } from './modules/compras/ordens-compra.module.js';
import { registerFornecedoresModule } from './modules/compras/fornecedores.module.js';
import { registerPermissionsModule } from './modules/permissions/permissions.module.js';
import { registerDashboardModule } from './modules/dashboard/dashboard.module.js';
import { registerNotificationsModule } from './modules/notifications/notifications.module.js';
import { registerFinanceiroModule } from './modules/financeiro/financeiro.module.js';
import { registerWorkflowsModule } from './modules/workflows/workflows.module.js';
import { registerAdminModule } from './modules/admin/admin.module.js';

export function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  // modules
  registerHealthModule(app);
  registerAuthModule(app);
  registerEntitiesModule(app);
  registerRecordsModule(app);
  registerUsersModule(app);
  registerClientesModule(app);
  registerOrdensCompraModule(app);
  registerFornecedoresModule(app);
  registerPermissionsModule(app);
  registerDashboardModule(app);
  registerNotificationsModule(app);
  registerFinanceiroModule(app);
  registerWorkflowsModule(app);
  registerAdminModule(app);

  app.get('/', (req, res) => {
    res.json({
      name: 'ERP COZ API (core)',
      version: '0.2.0',
      health: '/health',
    });
  });

  return app;
}

