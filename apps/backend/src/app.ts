import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { env } from './config/env.js';
import { httpLogger } from './infra/logger.js';
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
import { registerCozincaModule } from './modules/cozinca/cozinca.module.js';
import { registerProductsModule } from './modules/products/products.module.js';
import { registerEstoqueModule } from './modules/estoque/estoque.module.js';
import { registerStockModule } from './modules/stock/stock.module.js';
import { registerSalesModule } from './modules/sales/sales.module.js';
import { registerPurchasesModule } from './modules/purchases/purchases.module.js';
import { registerProductionModule } from './modules/production/production.module.js';
import { registerCrmModule } from './modules/crm/crm.module.js';
import { registerHrModule } from './modules/hr/hr.module.js';
import { registerFiscalModule } from './modules/fiscal/fiscal.module.js';
import { registerFinancialModule } from './modules/financial/financial.module.js';
import { registerSearchModule } from './modules/search/search.module.js';
import { registerPlatformModule } from './modules/platform/platform.module.js';
import { registerRolesModule } from './modules/roles/roles.module.js';
import { registerCrmProcessesModule } from './modules/crm-processes/crm-processes.module.js';
import { registerProjectsModule } from './modules/projects/projects.module.js';
import { registerKnowledgeModule } from './modules/knowledge/knowledge.module.js';
import { registerQualityModule } from './modules/quality/quality.module.js';
import { registerExpeditionModule } from './modules/expedition/expedition.module.js';
import { registerAccountingModule } from './modules/accounting/accounting.module.js';
import { registerWebhooksModule } from './modules/webhooks/webhooks.module.js';
import { registerMetaModule } from './modules/meta/meta.module.js';
import { registerMetaCodeModule } from './modules/meta-code/meta-code.module.js';
import { registerReportsModule } from './modules/reports/reports.module.js';
import {
  attachErrorMonitorExpressHandler,
  registerErrorMonitorModule,
} from './modules/error-monitor/error-monitor.module.js';
import { registerQualityGateModule } from './modules/quality-gate/quality-gate.module.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { registrarHandlersProducao } from './modules/production/production.events.js';
import { registrarHandlersFinanceiro } from './modules/financial/financial.events.js';
import { registrarHandlersEstoque } from './modules/stock/stock.events.js';

let handlersRegistrados = false;

export function createApp() {
  const app = express();

  if (!handlersRegistrados) {
    registrarHandlersProducao();
    registrarHandlersFinanceiro();
    registrarHandlersEstoque();
    handlersRegistrados = true;
  }

  registerWebhooksModule(app);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"]
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true }
  }));

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
  }));
  app.use(express.json({ limit: '20mb' }));

  // Logging HTTP
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      httpLogger.info('HTTP_REQUEST', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    });
    next();
  });

  // modules
  registerHealthModule(app);
  registerAuthModule(app);
  
  // Tenant middleware (após auth, antes dos outros módulos)
  app.use('/api', tenantMiddleware as any);
  
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
  registerCozincaModule(app);
  registerProductsModule(app);
  registerEstoqueModule(app);
  registerStockModule(app);
  registerSalesModule(app);
  registerPurchasesModule(app);
  registerProductionModule(app);
  registerCrmModule(app);
  registerHrModule(app);
  registerFiscalModule(app);
  registerFinancialModule(app);
  registerSearchModule(app);
  registerPlatformModule(app);
  registerRolesModule(app);
  registerCrmProcessesModule(app);
  registerProjectsModule(app);
  registerKnowledgeModule(app);
  registerQualityModule(app);
  registerExpeditionModule(app);
  registerAccountingModule(app);
  registerMetaModule(app);
  registerMetaCodeModule(app);
  registerReportsModule(app);
  registerErrorMonitorModule(app);
  registerQualityGateModule(app);

  app.get('/', (req, res) => {
    res.json({
      name: 'ERP COZ API (core)',
      version: '0.2.0',
      health: '/health',
    });
  });

  attachErrorMonitorExpressHandler(app);

  return app;
}

