# FINAL_STATUS — ERP pronto para produção (rodada consolidada)

Consolidação das **10 tarefas obrigatórias** e dos arquivos alterados nesta execução.

## Checklist de tarefas

1. **Permissões granulares por entidade** — Permissões `{entidade}.view|create|edit|delete` geradas no seed (lista espelhada no topo de `apps/backend/prisma/seed.ts`, sem import de `src/` no runtime Docker). `apps/backend/src/infra/entity-permissions.ts`: fallbacks legados + `record.manage`. `requirePermission` aceita `string | string[]` em `apps/backend/src/middleware/auth.ts`. `/api/records` usa `checkEntityRecordsAccess` por método HTTP em `records.routes.ts`. **Frontend:** `src/services/api.js` (`silent403` em leituras), `src/services/recordsServiceApi.js` (403 → lista vazia / sem throw ruidoso).

2. **WebSockets** — `socket.io` no backend; `socket.io-client` + `src/lib/RealtimeContext.jsx` (toasts: `novo_apontamento`, `op_atrasada` com aviso + badge via `bumpNotifications`, `notification` / `notification_broadcast`). Proxy `/socket.io` no Vite conforme README.

3. **Backup / restore** — `scripts/backup.sh`, `scripts/restore.sh` (`pg_dump` / `psql` via `docker compose exec`, usuário e base `erpcoz`). README documenta crontab.

4. **Validação formulários dinâmicos** — `DynamicFormModal.jsx`: Zod para `date`, `boolean`, `reference`, `multiselect`, `select` sem enum, além de texto/número/email/select/json e normalização JSON no submit. `DynamicField.jsx`: `multiselect`, `json` com blur, referências com `api.get` autenticado.

5. **Campos no seed** — `CORE_ENTITY_CONFIGS` em `apps/backend/prisma/seed.ts` cobre entidades operacionais (incl. `ordem_compra`, `pedido_venda`, `orcamento`, `movimentacao_estoque`, `apontamento_producao`, `historico_op`, etc.). `GET /api/entities/:code` expõe `fields` (flatten de `config.fields`) em `entities.routes.ts`.

6. **Remoção de mocks** — Serviços legados removidos nas rodadas anteriores; uso predominante de `recordsServiceApi` / APIs específicas. `PermissaoContext.jsx` não usa mais fallback de permissões locais em erro de rede: resposta não OK → permissões vazias.

7. **Health avançado** — `GET /health/ready` e `GET /api/health/ready`: Postgres, migrações `_prisma_migrations` (contagem mínima 1). **Redis:** ping **somente se `REDIS_URL` estiver definido**; sem URL o readiness **não falha** (detalhe `skipped_no_redis_url`).

8. **Documentação** — `README.md` na raiz (Docker, credenciais, backup, API, Metadata Studio). Este arquivo + `docs/final_test_report.md`.

9. **Lint e organização** — `npm run lint` **passa** após correção de dependências (`es-abstract` reinstalado completo; `overrides`/`object.fromentries` no `package.json`; import não usado em `PedidosVenda.jsx`). Pastas `src/mocks`, `src/storage`, `backend/mocks` **ausentes**. Logs: `apps/backend/src/infra/logger.ts` (`logInfo`/`logDebug` sem poluir produção); frontend `src/lib/devLog.js`, `PermissaoContext`, `ImpersonationBanner`, `Usuarios`, `Apontamento` sem ruído em produção.

10. **Testes finais** — `docker compose -f docker-compose.pg-erp.yml up -d --build` concluído; **`node test-all-endpoints.cjs` → 23/23**. Relatório manual em `docs/final_test_report.md`.

## Arquivos criados ou modificados (esta rodada)

| Área | Arquivos |
|------|-----------|
| Backend | `apps/backend/src/modules/health/health.routes.ts`, `apps/backend/src/infra/logger.ts` |
| Frontend | `src/services/api.js`, `src/services/recordsServiceApi.js`, `src/components/metadata/DynamicFormModal.jsx`, `src/components/metadata/DynamicField.jsx`, `src/lib/PermissaoContext.jsx`, `src/lib/devLog.js`, `src/lib/RealtimeContext.jsx`, `src/pages/configuracoes/Usuarios.jsx`, `src/pages/producao/Apontamento.jsx`, `src/components/layout/ImpersonationBanner.jsx`, `src/pages/vendas/PedidosVenda.jsx` |
| Raiz | `README.md`, `FINAL_STATUS.md`, `docs/final_test_report.md`, `package.json` (overrides + pin de dependências ESLint) |

## Operação contínua

- Ao criar novas entidades granulares: atualizar **`GRANULAR_ENTITY_CODES`** em `entity-permissions.ts` **e** o array duplicado em **`prisma/seed.ts`**.  
- Para readiness com Redis obrigatório em um ambiente específico, basta definir **`REDIS_URL`** apontando para uma instância saudável.
