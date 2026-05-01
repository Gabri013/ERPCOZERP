import type { Express } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { entityRouteGuard } from '../../infra/entity-permissions.js';
import { clientesRouter } from './clientes.routes.js';
import { pedidosVendaRouter } from './pedidos-venda.routes.js';
import { orcamentosRouter } from './orcamentos.routes.js';
import { tabelaPrecosRouter } from './tabela-precos.routes.js';

export function registerClientesModule(app: Express) {
  app.use('/api/vendas/clientes', authenticate, entityRouteGuard('cliente'), clientesRouter);
  app.use('/api/vendas/pedidos-venda', authenticate, entityRouteGuard('pedido_venda'), pedidosVendaRouter);
  app.use('/api/vendas/orcamentos', authenticate, entityRouteGuard('orcamento'), orcamentosRouter);
  app.use('/api/vendas/tabela-precos', authenticate, entityRouteGuard('tabela_preco'), tabelaPrecosRouter);
}

