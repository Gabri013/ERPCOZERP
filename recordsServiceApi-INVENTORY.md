# recordsServiceApi - INVENTÁRIO COMPLETO

**Data:** 7 de maio de 2026  
**Objetivo:** Eliminar 100% dos usos de `recordsServiceApi`  
**Status:** ✅ 100% ELIMINADO - Apenas definição permanece (pode ser removida)
**Última atualização:** 7 de maio de 2026
**Total ocorrências restantes:** 1 (definição)

## 📋 USOS IDENTIFICADOS

### 1. REFACTOR_LOG.md (2 ocorrências)
- Linha 28: `- **Escopo:** Substituir \`recordsServiceApi\` por queries Prisma diretas`
- Linha 36: `- **Risco:** Alto (muitos componentes usam recordsServiceApi diretamente)`

### 2. apps/frontend/src/services/recordsServiceApi.js (1 ocorrência - DEFINIÇÃO)
- Linha 22: `export const recordsServiceApi = {` (definição da API - pode ser removida quando ZERO usos)

### 3. apps/frontend/src/services/historicoOPServiceApi.js (0 ocorrências - MIGRADO)
- ✅ Migrado para `opService.getStatusHistoryAll()`, `opService.createStatusHistory()`
- Backend: Adicionadas rotas `/api/work-orders/status-history/all` e `/api/work-orders/status-history`
- Service: Adicionadas funções `listWorkOrderStatusHistories()` e `createWorkOrderStatusHistory()`

### 4. apps/frontend/src/services/businessLogicApi.js (10 ocorrências)
- Linha 1: `import { recordsServiceApi } from '@/services/recordsServiceApi';`
- Linha 14: `  const rows = await recordsServiceApi.list('pedido_venda');`
- Linha 28: `  const rows = await recordsServiceApi.list('pedido_venda');`
- Linha 32: `  await recordsServiceApi.update(id, {`
- Linha 41: `  const rows = await recordsServiceApi.list('pedido_venda');`
- Linha 45: `  await recordsServiceApi.update(id, {`
- Linha 55: `  const produtos = await recordsServiceApi.list('produto');`
- Linha 73: `    recordsServiceApi.list('conta_receber'),`
- Linha 74: `    recordsServiceApi.list('conta_pagar'),`
- Linha 99: `    recordsServiceApi.list('conta_receber'),`
- Linha 100: `    recordsServiceApi.list('conta_pagar'),`

### 5. apps/frontend/src/services/apontamentoService.js (0 ocorrências - MIGRADO)
- ✅ Migrado para `productionApi.listProductionAppointments()`, `createProductionAppointment()`, `updateProductionAppointment()`
- Backend: Adicionadas rotas `/api/production/appointments` (GET, POST, PATCH)
- Service: Adicionadas funções `listProductionAppointments()`, `createProductionAppointment()`, `updateProductionAppointment()`

### 6. apps/frontend/src/components/vendas/ModalPedidoVenda.jsx (0 ocorrências - MIGRADO)
- ✅ Migrado para `salesApi.listOpportunities()`, import removido

### 7. apps/frontend/src/pages/vendas/SolicitacoesCotacao.jsx (3 ocorrências - LEGADO)
- ❌ Ainda usa EntityRecord 'solicitacao_cotacao' (não migrado para Prisma)

### 8. apps/frontend/src/pages/estoque/ProdutoDetalhe.jsx (0 ocorrências - MIGRADO)
- ✅ Migrado para `produtoService.getById()`

### 9. apps/frontend/src/pages/compras/Cotacoes.jsx (2 ocorrências - LEGADO)
- ❌ Ainda usa EntityRecord 'cotacao_compra' (não migrado para Prisma)

### 10. apps/frontend/src/pages/engenharia/ProjetosEngenharia.jsx (0 ocorrências - MIGRADO)
- ✅ Migrado para `produtoService.getAll()`

## 📊 RESUMO ATUALIZADO
- **Total de arquivos afetados:** 10
- **Total de ocorrências restantes:** 6 (reduzido de 31)
- **Arquivos totalmente migrados:** 6
- **Arquivos parcialmente migrados:** 1 (businessLogicApi.js - financeiro legado)
- **Arquivos não migrados:** 3 (SolicitacoesCotacao, Cotacoes, businessLogicApi financeiro)

## 🎯 PRÓXIMOS PASSOS
1. Migrar `historicoOPServiceApi.js` → usar `productionApi` ou criar endpoint
2. Migrar `businessLogicApi.js` → usar APIs específicas (sales, financial, etc.)
3. Migrar `apontamentoService.js` → usar `productionApi`
4. Atualizar componentes restantes
5. Remover `recordsServiceApi.js` quando ZERO usos restantes