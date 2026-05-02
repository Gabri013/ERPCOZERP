# PRODUTO_ESTOQUE_REPORT — Módulo de Produtos e Estoque

**Data:** 2026-05-02  
**Status:** ✅ Módulo completamente implementado e funcional

---

## Resumo Executivo

O módulo de Produtos e Estoque já estava **completamente implementado** quando esta tarefa foi solicitada. Nenhum arquivo novo precisou ser criado. O build do TypeScript (backend) e do Vite (frontend) passam sem erros.

---

## Estrutura do Módulo

### Backend — `apps/backend/src/modules/stock/`

| Arquivo | Conteúdo |
|---------|----------|
| `stock.module.ts` | Registra `stockRouter` em `/api/stock` |
| `stock.routes.ts` | Todos os endpoints REST do módulo |
| `stock.service.ts` | Lógica de negócio, transações Prisma, cálculo de estoque |
| `stock.schemas.ts` | Validação Zod de todos os payloads |

### Frontend — Páginas TypeScript (rota principal)

| Arquivo | Rota | Descrição |
|---------|------|-----------|
| `pages/products/ProductsPage.tsx` | `/estoque/produtos` | Catálogo com filtros, alertas de estoque crítico |
| `pages/products/ProductForm.tsx` | `/estoque/produtos/:id` e `/estoque/produtos/novo` | Ficha do produto com abas |
| `pages/products/StockMovementsPage.tsx` | `/estoque/movimentacoes` | Histórico com filtros e nova movimentação |
| `pages/products/InventoryPage.tsx` | `/estoque/inventario` | Lista de contagens |
| `pages/products/InventoryCountDetail.tsx` | `/estoque/inventario/:id` | Detalhe e aprovação da contagem |
| `pages/products/LocationsPage.tsx` | `/estoque/enderecamento` | CRUD de localizações |

### Frontend — Páginas JSX (legado PT-BR, ainda funcionais)

| Arquivo | Rota alternativa |
|---------|-----------------|
| `pages/estoque/Produtos.jsx` | `/estoque/produtos` (sobreposição por App.jsx) |
| `pages/estoque/Movimentacoes.jsx` | `/estoque/movimentacoes` |
| `pages/estoque/Inventario.jsx` | `/estoque/inventario` |
| `pages/estoque/Enderecamento.jsx` | `/estoque/enderecamento` |
| `pages/estoque/ProdutoDetalhe.jsx` | `/estoque/produtos/bom/:id` — Ficha industrial com BOM SolidWorks + 3D |

### Componentes de UI

| Componente | Localização |
|-----------|------------|
| `ModalProduto.jsx` | `components/estoque/ModalProduto.jsx` |
| `ModalMovimentacao.jsx` | `components/estoque/ModalMovimentacao.jsx` |

### Serviço Frontend

| Arquivo | Exports principais |
|---------|--------------------|
| `services/stockApi.ts` | `stockApi`, `listStockProducts`, `createStockProduct`, `updateStockProduct`, `deleteStockProduct`, `listStockMovements`, `createStockMovement`, `listLocations`, `createLocation`, `updateLocation`, `deleteLocation`, `listProductLocations`, `listInventoryCounts`, `createInventoryCount`, `patchInventoryCount`, `approveInventoryCount`, `mapStockProductToUi`, `uiFormToStockPayload` |

---

## Endpoints Disponíveis

### Produtos (`/api/stock/products`)

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| `GET` | `/api/stock/products` | `produto.view` | Listar com filtros (search, status, take) |
| `POST` | `/api/stock/products` | `produto.create` | Criar produto |
| `GET` | `/api/stock/products/:id` | `produto.view` | Buscar por ID |
| `PATCH` | `/api/stock/products/:id` | `produto.update` | Editar produto |
| `DELETE` | `/api/stock/products/:id` | `produto.delete` | Inativar (soft delete) |

### Movimentações (`/api/stock/movements`)

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| `GET` | `/api/stock/movements` | `movimentacao.view` | Listar movimentações |
| `POST` | `/api/stock/movements` | `movimentacao.create` | Registrar entrada/saída/ajuste |

### Localizações (`/api/stock/locations`)

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| `GET` | `/api/stock/locations` | `enderecamento.view` | Listar localizações |
| `POST` | `/api/stock/locations` | `enderecamento.manage` | Criar localização |
| `PATCH` | `/api/stock/locations/:id` | `enderecamento.manage` | Editar localização |
| `DELETE` | `/api/stock/locations/:id` | `enderecamento.manage` | Excluir localização |
| `GET` | `/api/stock/product-locations?productId=` | `produto.view` | Localizações de um produto |

### Inventário (`/api/stock/inventory-counts`)

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| `GET` | `/api/stock/inventory-counts` | `inventario.view` | Listar contagens |
| `POST` | `/api/stock/inventory-counts` | `inventario.create` | Criar contagem |
| `GET` | `/api/stock/inventory-counts/:id` | `inventario.view` | Detalhe com itens |
| `PATCH` | `/api/stock/inventory-counts/:id` | `inventario.create` | Atualizar status |
| `PATCH` | `/api/stock/inventory-counts/items/:itemId` | `inventario.create` | Atualizar item (quantidade contada) |
| `POST` | `/api/stock/inventory-counts/:id/approve` | `inventario.approve` | Aprovar + gerar ajustes |

---

## Modelos Prisma

### `Product`
```
id, code (unique), name, description, unit, productType, group,
costPrice, salePrice, minStock, reorderPoint, status, photoUrl,
techSheet (JSON: BOM, roteiro, ficha técnica), model3dPath,
entityRecordId (FK EntityRecord), createdAt, updatedAt
```

### `StockMovement`
```
id, productId (FK), locationId (FK), type (ENTRADA|SAIDA|AJUSTE),
quantity, reference, notes, userId (FK), createdAt
```

### `InventoryCount`
```
id, code (unique), status (RASCUNHO|EM_CONTAGEM|APROVADO),
notes, approvedAt, approvedById (FK), createdAt, updatedAt
items → InventoryCountItem[]
```

### `InventoryCountItem`
```
id, inventoryCountId (FK), productId (FK), locationId (FK),
qtySystem, qtyCounted
```

### `Location`
```
id, code (unique), name, warehouse, aisle, rack, bin, active,
createdAt, updatedAt
```

### `ProductLocation`
```
id, productId (FK), locationId (FK), quantity
unique(productId, locationId)
```

---

## Integração com Outros Módulos

### Produção → Estoque
Ao apontar produção (`ProductionAppointment`), o baixa de insumos é realizada via `createMovement(type: SAIDA)`.

### Compras → Estoque
Ao registrar recebimento (`PurchaseOrder.status = RECEBIDO`), gera `StockMovement(type: ENTRADA)` automaticamente.

### Vendas → Estoque
Ao confirmar pedido de venda, reserva estoque via `WorkOrderItem`.

---

## Funcionalidades por Página

### `/estoque/produtos` (ProductsPage.tsx)
- Listagem com busca, filtro por status
- Alerta de produtos abaixo do mínimo
- Link para ficha industrial (BOM + 3D + DXF/PDF)
- Criar/editar produto via rota `/estoque/produtos/:id`

### `/estoque/produtos/:id` (ProductForm.tsx)
- Abas: **Dados Gerais**, **BOM/Ficha Técnica**, **Localização**
- Upload de foto (URL)
- Ponto de reposição e estoque mínimo
- Estoque atual calculado pela soma das localizações

### `/estoque/movimentacoes` (StockMovementsPage.tsx)
- Filtros por tipo (Entrada/Saída/Ajuste), produto, período
- Registrar movimentação: selecionar produto, localização, quantidade, motivo
- Atualiza estoque automaticamente via transação

### `/estoque/inventario` (InventoryPage.tsx + InventoryCountDetail.tsx)
- Criar contagem (selecionar produtos + localização)
- Registrar quantidade contada por item
- Aprovar contagem → gera ajuste automático se houver divergência

### `/estoque/enderecamento` (LocationsPage.tsx)
- CRUD de localizações (armazém, rua, prateleira, posição)
- Associar produto a localização

### `/estoque/produtos/bom/:id` (ProdutoDetalhe.jsx — ficha industrial)
- Importação BOM SolidWorks (CSV/Excel/texto)
- Visualizador 3D interativo (Three.js — STL, glTF, OBJ)
- Upload de arquivos técnicos (DXF, PDF)
- Cálculo automático de peso de chapa inox

---

## Como Testar

```bash
# 1. Subir o ambiente
docker compose up -d

# 2. Acesse http://localhost:5173 e faça login como master

# 3. Criar um produto
# → Estoque > Produtos > Novo Produto
# → Preencher código, nome, unidade, tipo, preço, estoque mínimo
# → Salvar

# 4. Registrar uma movimentação de entrada
# → Estoque > Movimentações > Registrar Movimentação
# → Tipo: Entrada, Produto: [produto criado], Quantidade: 100
# → Confirmar → estoque do produto atualiza

# 5. Criar inventário
# → Estoque > Inventário > Nova Contagem
# → Adicionar produtos e preencher quantidade contada
# → Aprovar → divergências geram ajuste automático

# 6. Testar endereçamento
# → Estoque > Endereçamento > Nova Localização
# → Armazém: A, Rua: 01, Prateleira: 01, Posição: 01

# 7. Ficha industrial
# → Estoque > Produtos > clicar em produto
# → "Ficha industrial" → importar BOM, visualizar 3D
```

---

## Permissões por Papel

| Permissão | Master | Gerente | Almoxarifado | Compras | Produção |
|-----------|--------|---------|-------------|---------|----------|
| `produto.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `produto.create` | ✅ | ✅ | ✅ | — | — |
| `produto.update` | ✅ | ✅ | ✅ | — | — |
| `produto.delete` | ✅ | ✅ | — | — | — |
| `movimentacao.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `movimentacao.create` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `inventario.view` | ✅ | ✅ | ✅ | — | — |
| `inventario.create` | ✅ | ✅ | ✅ | — | — |
| `inventario.approve` | ✅ | ✅ | — | — | — |
| `enderecamento.view` | ✅ | ✅ | ✅ | — | — |
| `enderecamento.manage` | ✅ | ✅ | ✅ | — | — |
