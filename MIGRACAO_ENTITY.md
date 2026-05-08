# Migração Entity → Prisma

## Objetivo

Eliminar o uso de `Entity` / `EntityRecord` como sistema principal de persistência e manter o Metadata Studio apenas para campos extras e configurações de empresa.

## Inventário inicial encontrado

### Tipos / códigos de entity detectados no backend

- `cliente`
- `fornecedor`
- `produto`
- `movimentacao_estoque`
- `pedido_venda`
- `orcamento`
- `ordem_compra`
- `tabela_preco`
- `conta_receber`
- `conta_pagar`
- `ordem_producao`
- `apontamento_producao`
- `crm_lead`
- `crm_oportunidade`
- `crm_atividade`
- `crm_rules`
- `crm_conversation`
- `cotacao_compra`
- `workflow`
- `historico_op`
- `fiscal_nfe`
- `rh_funcionario`

### Models Prisma já existentes que cobrem parte do domínio

- `Product`
- `SalesOpportunity`
- `SaleOrder`
- `PurchaseOrder`
- `Customer`
- `Quote`
- `StockMovement`
- `PriceTable`
- `WorkOrder`
- `SalesActivity`

### Gaps confirmados no schema atual

- Não existe model `Lead`
- Não existe model dedicado para `conta_receber`
- Não existe model dedicado para `conta_pagar`
- Não existe model dedicado para `conta_bancaria`
- Não existe model exato `ApontamentoProducao` ainda identificado

### Módulos/frontend ainda ligados a `EntityRecord`

- `apps/backend/src/modules/records/records.routes.ts`
- `apps/backend/src/modules/records/records.module.ts`
- `apps/backend/src/infra/entity-permissions.ts`
- `apps/backend/src/modules/crm/crm.service.ts`
- `apps/backend/src/modules/crm/crm-inbox.service.ts`
- `apps/backend/src/modules/financeiro/contas.routes.ts`
- `apps/backend/src/modules/vendas/orcamentos.routes.ts`
- `apps/backend/src/modules/estoque/estoque.routes.ts`
- `apps/backend/src/modules/compras/fornecedores.routes.ts`
- `apps/backend/src/modules/compras/ordens-compra.routes.ts`
- `apps/backend/src/realtime/record-hooks.ts`
- `apps/backend/src/realtime/op-delay-scan.ts`
- `apps/frontend/src/components/metadata/DynamicFormModal.jsx`
- `apps/frontend/src/components/metadata/DynamicField.jsx`
- `apps/frontend/src/components/metadata/DynamicEntityPage.jsx`
- `apps/frontend/src/services/recordsServiceApi.js`
- `apps/frontend/src/services/movimentacoesServiceApi.js`
- `apps/frontend/src/pages/configuracoes/FormBuilder.jsx`

## Mapeamento inicial

| Entity tipo | Prisma equivalente | Situação |
| --- | --- | --- |
| `crm_lead` | não há model Prisma equivalente ainda | precisa criar ou convergir para outro model CRM |
| `crm_oportunidade` | `SalesOpportunity` | já existe |
| `crm_atividade` | `SalesActivity` | já existe |
| `pedido_venda` | `SaleOrder` | já existe |
| `orcamento` | `Quote` | já existe |
| `ordem_compra` | `PurchaseOrder` | já existe |
| `cotacao_compra` | `PurchaseOrder` / fluxo de compras | precisa validação funcional |
| `produto` | `Product` | já existe, mas ainda há integração com EntityRecord |
| `tabela_preco` | `PriceTable` | já existe |
| `conta_receber` | model financeiro dedicado ou legado | precisa mapear |
| `conta_pagar` | model financeiro dedicado ou legado | precisa mapear |
| `conta_bancaria` | model financeiro dedicado ou legado | precisa mapear |
| `movimentacao_estoque` | `StockMovement` | já existe / precisa confirmar uso final |
| `ordem_producao` | `WorkOrder` | já existe |
| `apontamento_producao` | model industrial dedicado ainda não confirmado | precisa mapear |

## Observações

- A tela `AprovacaoPedidos` foi ajustada para ler apenas `SaleOrder` via Prisma.
- A rota de `records` agora emite cabeçalhos e log de depreciação.
- A migração dos dados ainda precisa do script de transferência por tipo antes de qualquer remoção do legado.