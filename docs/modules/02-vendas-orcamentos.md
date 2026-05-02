# Módulo 2 – Vendas e Orçamentos

## Objetivo
Pedidos de venda, clientes, orçamentos, tabela de preços e relatórios de vendas.

## Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `apps/backend/src/modules/sales/sales.module.ts` | Registra rotas no Express |
| `apps/backend/src/modules/sales/sales.routes.ts` | 20 endpoints REST |
| `apps/backend/src/modules/sales/sales.service.ts` | Lógica: converter orçamento, gerar OP, tabela de preços |
| `apps/backend/src/modules/sales/sales.schemas.ts` | Validações Zod |

## Arquivos Frontend

| Arquivo | Descrição |
|---------|-----------|
| `apps/frontend/src/pages/vendas/Clientes.jsx` | CRUD de clientes |
| `apps/frontend/src/pages/vendas/Orcamentos.jsx` | Orçamentos com botão "Converter em Pedido" |
| `apps/frontend/src/pages/vendas/PedidosVenda.jsx` | Pedidos de venda com status, botão "Gerar OP" |
| `apps/frontend/src/pages/vendas/TabelaPrecos.jsx` | Tabela de preços por produto/cliente |
| `apps/frontend/src/pages/vendas/RelatoriosVendas.jsx` | Relatórios resumidos |
| `apps/frontend/src/pages/vendas/QuotesPage.tsx` | Orçamentos (versão TS, roteada) |
| `apps/frontend/src/pages/vendas/SaleOrdersPage.tsx` | Pedidos de venda (roteada) |
| `apps/frontend/src/pages/vendas/PriceTablesPage.tsx` | Tabelas de preços (roteada) |
| `apps/frontend/src/pages/vendas/SalesReportPage.tsx` | Relatório de vendas (roteada) |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/sales/customers` | CRUD clientes |
| PATCH | `/api/sales/customers/:id` | Atualizar cliente |
| GET/POST | `/api/sales/sale-orders` | CRUD pedidos de venda |
| PATCH | `/api/sales/sale-orders/:id` | Atualizar pedido |
| POST | `/api/sales/sale-orders/:id/approve` | Aprovar pedido |
| POST | `/api/sales/sale-orders/:id/generate-work-order` | Gerar OP automaticamente |
| POST | `/api/sales/sale-orders/:id/kanban` | Mover estágio Kanban |
| GET/POST | `/api/sales/quotes` | CRUD orçamentos |
| POST | `/api/sales/quotes/:id/convert` | Converter orçamento em pedido |
| GET/POST | `/api/sales/price-tables` | Tabelas de preços |
| POST | `/api/sales/price-tables/:id/items` | Adicionar itens à tabela |
| GET | `/api/sales/reports/summary` | Resumo de vendas |

## Modelos Prisma

- `SaleOrder` — cliente, itens, status (rascunho → aprovado → produção → expedição → entregue), valor total
- `SaleOrderItem` — produto, quantidade, preço unitário
- `Quote` / `QuoteItem` — orçamento com validade, conversão para pedido
- `PriceTable` / `PriceTableItem` — tabelas de preços por produto com vigência

## Permissões

`ver_pedido_venda`, `criar_pedido_venda`, `editar_pedido_venda`, `aprovar_pedido_venda`,
`ver_orcamento`, `converter_orcamento`, `ver_tabela_preco`, `editar_tabela_preco`

## Como Testar

1. Acesse **Vendas → Orçamentos**, crie um orçamento com itens.
2. Clique em **Converter em Pedido** — será criado um `SaleOrder`.
3. No pedido, clique em **Aprovar** e depois **Gerar OP** (cria WorkOrder automaticamente).
4. Acesse **Vendas → Tabela de Preços** e defina preços por produto.
