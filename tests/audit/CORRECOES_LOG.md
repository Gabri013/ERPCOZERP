# Log de correções (pós-auditoria)

Registo das alterações aplicadas automaticamente com base em falhas críticas detetadas (500, rotas CRM, etc.).  
**Política:** mudanças mínimas; sem refatoração ampla; pendências explícitas quando a causa não é segura.

---

## 2026-05-02 — Estabilidade CRM (`crm_stage_history`)

| Campo | Detalhe |
|--------|---------|
| **Prioridade** | CRÍTICO |
| **Erro original** | `GET /api/crm/pipeline` (e analytics relacionados) retornavam **500** quando a tabela `public.crm_stage_history` não existia na base (migração `20260604000000_crm_stage_history` não aplicada). |
| **Causa** | `crmStageHistory().findMany()` propagava `PrismaClientKnownRequestError` (P2021 / mensagem da tabela). |
| **Ficheiro** | `apps/backend/src/modules/crm/crm-analytics.service.ts` |
| **Solução** | Funções `isMissingCrmStageHistoryTable` e `findManyStageHistorySafe`: em falta de tabela, devolve histórico vazio e regista via `logAnalytics` (quando `CRM_ANALYTICS_LOG=1`); outros erros mantêm-se propagados. |
| **Validação** | `npm run test --prefix apps/backend -- src/__tests__/audit/api-surface.test.ts` e `npm run lint --prefix apps/backend`. |
| **Nota operacional** | Em produção deve correr `prisma migrate deploy` para criar a tabela e passar a persistir histórico real de estágios; até lá o pipeline carrega sem 500, com métricas de estágio neutras. |

---

## 2026-05-02 — Cozinca: geração de OP sem itens (`ops` indefinido)

| Campo | Detalhe |
|--------|---------|
| **Prioridade** | CRÍTICO (compilação / runtime) |
| **Erro original** | `Cannot find name 'ops'` em `gerarOpDoPedido` no ramo `else` (pedido sem itens válidos para OP). |
| **Causa** | Variável inexistente; deveria usar a lista de ordens existentes para `nextNumero`. |
| **Ficheiro** | `apps/backend/src/modules/cozinca/cozinca.service.ts` |
| **Solução** | `const existingOps = await listRecords('ordem_producao');` e passar a `nextNumero('OP', …)`. |
| **Validação** | `tsc` deixa de reportar este erro no ficheiro (outros erros de projeto podem persistir noutros módulos). |

---

## Pendências (não alteradas — falta de certeza ou fora do âmbito mínimo)

- **RBAC / UI:** rever esconder ações por perfil exige matriz de permissões acordada — não alterado neste ciclo.
- **Formulários / Zod:** correcções ponto a ponto após lista concreta de campos (relatório NDJSON por rota).
- **Console frontend:** varrer `tests/e2e/audit` + relatório gerado; corrigir ficheiro a ficheiro quando houver `events.ndjson` com `source: e2e-route-sweep`.

---

_Para acrescentar entradas: duplicar o bloco de tabela com data, manter o mesmo formato._
