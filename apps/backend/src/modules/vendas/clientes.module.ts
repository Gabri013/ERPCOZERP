import type { Express } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { clientesRouter } from './clientes.routes.js';
import { pedidosVendaRouter } from './pedidos-venda.routes.js';
import { orcamentosRouter } from './orcamentos.routes.js';
import { tabelaPrecosRouter } from './tabela-precos.routes.js';

export function registerClientesModule(app: Express) {
  app.use('/api/vendas/clientes', authenticate, requirePermission('record.manage'), clientesRouter);
  app.use('/api/vendas/pedidos-venda', authenticate, requirePermission('record.manage'), pedidosVendaRouter);
  app.use('/api/vendas/orcamentos', authenticate, requirePermission('record.manage'), orcamentosRouter);
  app.use('/api/vendas/tabela-precos', authenticate, requirePermission('record.manage'), tabelaPrecosRouter);
}

