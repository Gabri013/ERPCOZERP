# Módulo 3 – Compras

## Objetivo
Fornecedores, ordens de compra, cotações e recebimentos com geração automática de movimentação de estoque.

## Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `apps/backend/src/modules/purchases/purchases.module.ts` | Registra rotas no Express |
| `apps/backend/src/modules/purchases/purchases.routes.ts` | Endpoints REST |
| `apps/backend/src/modules/purchases/purchases.service.ts` | Lógica: aprovação, recebimento → movimentação de estoque |
| `apps/backend/src/modules/purchases/purchases.schemas.ts` | Validações Zod |

## Arquivos Frontend

| Arquivo | Descrição |
|---------|-----------|
| `apps/frontend/src/pages/compras/Fornecedores.jsx` | CRUD de fornecedores |
| `apps/frontend/src/pages/compras/OrdensCompra.jsx` | Ordens de compra com botão "Aprovar" e "Receber" |
| `apps/frontend/src/pages/compras/Cotacoes.jsx` | Cotações com botão "Registrar resposta" |
| `apps/frontend/src/pages/compras/Recebimentos.jsx` | Histórico de recebimentos |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/purchases/suppliers` | CRUD fornecedores |
| PATCH | `/api/purchases/suppliers/:id` | Atualizar fornecedor |
| GET/POST | `/api/purchases/orders` | CRUD ordens de compra |
| GET | `/api/purchases/orders/:id` | Detalhe da ordem |
| POST | `/api/purchases/orders/:id/send` | Enviar para fornecedor |
| POST | `/api/purchases/orders/:id/receive` | Receber mercadoria → movimenta estoque |

## Modelos Prisma

- `Supplier` — CNPJ, razão social, contato, prazo de entrega, avaliação
- `PurchaseOrder` / `PurchaseOrderItem` — itens, quantidades, valores, status
- `Receiving` — data, itens recebidos, nota fiscal do fornecedor

## Permissões

`ver_fornecedor`, `ver_ordem_compra`, `criar_ordem_compra`, `aprovar_ordem_compra`, `criar_recebimento`

## Como Testar

1. Acesse **Compras → Fornecedores** e cadastre um fornecedor.
2. Crie uma **Ordem de Compra** com itens de produto.
3. Aprove a OC e clique em **Receber** — verifique que o estoque do produto aumentou.
4. Acesse **Compras → Recebimentos** para ver o histórico.
