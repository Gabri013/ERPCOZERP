# Módulo 1 – Produtos e Estoque

## Objetivo
CRUD completo de produtos, movimentações de estoque, inventário cíclico e endereçamento.

## Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `apps/backend/src/modules/stock/stock.module.ts` | Registra rotas no Express |
| `apps/backend/src/modules/stock/stock.routes.ts` | 17 endpoints REST |
| `apps/backend/src/modules/stock/stock.service.ts` | Lógica de negócio + transações Prisma |
| `apps/backend/src/modules/stock/stock.schemas.ts` | Validações Zod |

## Arquivos Frontend

| Arquivo | Descrição |
|---------|-----------|
| `apps/frontend/src/pages/estoque/Produtos.jsx` | Listagem com filtros, modal criar/editar |
| `apps/frontend/src/pages/estoque/ProdutoDetalhe.jsx` | Ficha industrial: BOM, 3D, movimentações |
| `apps/frontend/src/pages/estoque/Movimentacoes.jsx` | Listagem e registro de movimentações |
| `apps/frontend/src/pages/estoque/Inventario.jsx` | Contagens cíclicas, aprovar divergências |
| `apps/frontend/src/pages/estoque/Enderecamento.jsx` | CRUD de localizações e associação produto-local |
| `apps/frontend/src/pages/products/ProductsPage.tsx` | Listagem principal (roteada no App.jsx) |
| `apps/frontend/src/pages/products/ProductForm.tsx` | Formulário criação/edição |
| `apps/frontend/src/pages/products/StockMovementsPage.tsx` | Movimentações (roteada) |
| `apps/frontend/src/pages/products/InventoryPage.tsx` | Inventário (roteada) |
| `apps/frontend/src/pages/products/InventoryCountDetail.tsx` | Detalhe de contagem |
| `apps/frontend/src/pages/products/LocationsPage.tsx` | Endereçamento (roteada) |
| `apps/frontend/src/services/stockApi.ts` | Todos os métodos de API para o módulo |

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/api/stock/products` | `ver_produto` |
| POST | `/api/stock/products` | `criar_produto` |
| PATCH | `/api/stock/products/:id` | `editar_produto` |
| DELETE | `/api/stock/products/:id` | `deletar_produto` |
| POST | `/api/stock/movements` | `criar_movimentacao` |
| GET | `/api/stock/movements` | `ver_produto` |
| GET | `/api/stock/locations` | `ver_produto` |
| POST | `/api/stock/locations` | `editar_enderecamento` |
| GET | `/api/stock/inventory-counts` | `ver_inventario` |
| POST | `/api/stock/inventory-counts` | `ver_inventario` |
| PATCH | `/api/stock/inventory-counts/:id` | `ver_inventario` |
| POST | `/api/stock/inventory-counts/:id/approve` | `aprovar_inventario` |

## Modelos Prisma

- `Product` — código, nome, unidade, preço, estoque atual, estoque mínimo, ponto de pedido
- `StockMovement` — tipo (entrada/saída/ajuste), quantidade, motivo, referência
- `InventoryCount` / `InventoryCountItem` — contagens, status, divergências
- `Location` / `ProductLocation` — endereçamento físico

## Permissões

`ver_produto`, `criar_produto`, `editar_produto`, `deletar_produto`, `criar_movimentacao`,
`ver_inventario`, `aprovar_inventario`, `editar_enderecamento`

## Como Testar

1. Acesse **Estoque → Produtos** e crie um novo produto.
2. Acesse **Estoque → Movimentações** e registre uma entrada.
3. Verifique que o estoque do produto aumentou.
4. Acesse **Estoque → Inventário**, crie uma contagem, informe quantidade divergente e aprove.
5. Verifique ajuste automático no estoque.
