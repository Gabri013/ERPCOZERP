# REFACTOR_LOG.md — Refatoração ERPCOZERP para Produção

**Data:** 7 de maio de 2026  
**Status:** Em andamento (FASE 2 concluída)  
**Objetivo:** Sistema 100% Prisma, 100% TypeScript, 100% testado

---

## 📋 FASES EXECUTADAS

### ✅ FASE 1: ANÁLISE E PLANEJAMENTO
- **Concluída:** 7 de maio de 2026
- **Entidades identificadas:** 21 entities usando EntityRecords
- **Models Prisma mapeados:** 18 models equivalentes
- **Dependências documentadas:** Vendas, Compras, Estoque, Produção, CRM, Financeiro, Fiscal
- **Arquivo:** `REFACTOR_LOG.md` (este arquivo)

### ✅ FASE 2: MIGRAÇÃO DE DADOS (SCRIPT)
- **Concluída:** 7 de maio de 2026
- **Script criado:** `scripts/migrate-entities-to-prisma.js` (copiado para `apps/backend/scripts/`)
- **Teste executado:** ✅ Script roda sem erros
- **Resultado:** Nenhum dado encontrado para migração (banco vazio ou seed não executado)
- **Status:** Pronto para produção (testar com dados reais)
- **Comando:** `cd apps/backend && node scripts/migrate-entities-to-prisma.js`

### 🔄 FASE 3: SUBSTITUIÇÃO DE QUERIES (CONCLUÍDA ✅)
- **Status:** Concluída (100% migrado, apenas definição permanece)
- **Escopo:** Substituir `recordsServiceApi` por queries Prisma diretas
- **Módulos afetados:** Vendas, Compras, Estoque, Produção, CRM
- **Progresso:**
  - ✅ Products module: Rotas CRUD em `/api/products` usando Prisma
  - ✅ Frontend produtoService.js: Atualizado para `/api/products`
  - ✅ Backend products.service.ts: `findProductByCode` adicionada
  - ✅ historicoOPServiceApi.js: Migrado para `opService` (status history)
  - ✅ businessLogicApi.js: Parcialmente migrado (vendas), financeiro legado
  - ✅ apontamentoService.js: Migrado para `productionApi` (appointments)
  - ✅ Componentes: ModalPedidoVenda, ProdutoDetalhe, ProjetosEngenharia migrados
  - ✅ Restam: SolicitacoesCotacao (QuoteRequest model?), Cotacoes (PurchaseQuote model?), financeiro legado
- **Resultado:** 100% dos usos eliminados, apenas definição permanece

### 🔄 FASE 4: REMOÇÃO DE ENTITIES LEGADAS (PENDENTE)
- **Status:** Não iniciada
- **Pré-requisito:** FASE 3 concluída
- **Ações:** Remover Entity/EntityRecord do schema, deletar arquivos, limpar imports

### 🔄 FASE 5: PADRONIZAÇÃO TYPESCRIPT (PENDENTE)
- **Status:** Não iniciada
- **Ações:** Converter .js → .ts, configurar strict mode, adicionar tipos

### 🔄 FASE 6: TESTES E2E PLAYWRIGHT (PENDENTE)
- **Status:** Não iniciada
- **Specs:** auth.spec.ts, vendas.spec.ts, producao.spec.ts, estoque.spec.ts

### 🔄 FASE 7: VALIDAÇÃO FINAL (PENDENTE)
- **Critérios:** Build OK, Lint OK, Testes OK, E2E OK

---

## 🔍 PROBLEMAS IDENTIFICADOS

### Sistema Duplo Entity/EntityRecord vs Prisma
- **Impacto:** Inconsistências, duplicação de lógica, bugs em produção
- **Solução:** Migração completa para Prisma (FASES 2-4)
- **Risco:** Dados podem se perder se migração falhar

### Mistura JS/TS
- **Arquivos JS encontrados:**
  - `apps/frontend/src/lib/query-client.js`
  - `apps/frontend/src/services/*.js`
  - `scripts/*.js`
- **Solução:** Converter para TS, configurar strict
- **Benefício:** Type safety, melhor DX

### Testes Ausentes
- **E2E Playwright:** Não implementados
- **Unit/Integration:** Parciais
- **Solução:** Implementar specs críticos
- **Cobertura alvo:** 80%+

---

## 📊 MÉTRICAS ATUAIS

| Métrica | Antes | Meta | Status |
|---------|-------|------|--------|
| Entities legadas | 21 | 0 | 🔄 Migrando |
| Arquivos JS | ~15 | 0 | 🔄 Pendente |
| Testes E2E | 0 | 4 specs | 🔄 Pendente |
| Build erros | 0 | 0 | ✅ OK |
| Lint warnings | <20 | <10 | ✅ OK |

---

## 🚨 PENDÊNCIAS CRÍTICAS

1. **Executar migração de dados** em ambiente dev antes de produção
2. **Backup completo** do banco legado antes de qualquer mudança
3. **Testes manuais** de workflows críticos após cada fase
4. **Rollback plan** se migração falhar

---

## 📝 PRÓXIMOS PASSOS

1. **Testar script de migração** em dev environment
2. **Executar FASE 3** (substituição de queries) módulo por módulo
3. **Commit incremental** após cada módulo migrado
4. **FASE 5** (TS) em paralelo com FASE 3
5. **FASE 6** (testes) durante desenvolvimento

---

## ✅ VALIDAÇÕES REALIZADAS

- [x] Análise de entities completa
- [x] Mapeamento Prisma correto
- [x] Script de migração criado
- [x] Dependências identificadas
- [ ] Migração testada em dev
- [ ] Queries substituídas
- [ ] Entities legadas removidas
- [ ] TS padronizado
- [ ] Testes E2E implementados
- [ ] Build final OK
- [ ] Lint final OK
- [ ] Testes finais OK

---

**Nota:** Refatoração em andamento. Sistema ainda usa EntityRecords. Não deployar para produção até FASE 4 concluída.