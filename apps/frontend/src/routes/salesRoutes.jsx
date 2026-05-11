import { lazy } from 'react';

const Clientes = lazy(() => import('@/pages/vendas/Clientes'));
const PedidosVenda = lazy(() => import('@/pages/vendas/PedidosVenda'));
const Orcamentos = lazy(() => import('@/pages/vendas/Orcamentos'));
const TabelaPrecos = lazy(() => import('@/pages/vendas/TabelaPrecos'));
const RelatoriosVendas = lazy(() => import('@/pages/vendas/RelatoriosVendas'));
const SolicitacoesCotacao = lazy(() => import('@/pages/vendas/SolicitacoesCotacao'));
const ComissoesVendas = lazy(() => import('@/pages/vendas/Comissoes'));
const VendasPropostas = lazy(() => import('@/pages/vendas/QuotesPage'));
const VendasPropostaDetalhe = lazy(() => import('@/pages/vendas/QuoteDetailPage'));
const VendasOportunidades = lazy(() => import('@/pages/vendas/SalesOpportunitiesPage'));
const VendasOportunidadeDetalhe = lazy(() => import('@/pages/vendas/OpportunityDetailPage'));

export const salesRoutes = [
  { path: '/vendas/clientes', element: <Clientes />, permission: 'ver_clientes' },
  { path: '/vendas/pedidos', element: <PedidosVenda />, permission: 'ver_pedidos' },
  { path: '/vendas/orcamentos', element: <Orcamentos />, permission: 'ver_pedidos' },
  { path: '/vendas/tabela-precos', element: <TabelaPrecos />, permission: 'ver_pedidos' },
  { path: '/vendas/relatorios', element: <RelatoriosVendas />, permission: 'relatorios:view' },
  { path: '/vendas/solicitacoes-cotacao', element: <SolicitacoesCotacao />, permission: 'ver_pedidos' },
  { path: '/vendas/comissoes', element: <ComissoesVendas />, permission: 'ver_pedidos' },
  { path: '/vendas/propostas', element: <VendasPropostas />, permission: 'ver_pedidos' },
  { path: '/vendas/propostas/:id', element: <VendasPropostaDetalhe />, permission: 'ver_pedidos' },
  { path: '/vendas/oportunidades', element: <VendasOportunidades />, permission: 'ver_pedidos' },
  { path: '/vendas/oportunidades/:id', element: <VendasOportunidadeDetalhe />, permission: 'ver_pedidos' },
];