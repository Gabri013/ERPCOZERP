# Relatório de limpeza e reorganização (enterprise monorepo)

**Data:** 2026-05-01  

## Objetivo

Padronizar o repositório como monorepo (`apps/backend`, `apps/frontend`), um único `docker-compose.yml`, documentação sob `docs/`, remoção do backend MySQL legado e arquivos soltos na raiz.

## Pastas e arquivos removidos

| Item | Motivo |
|------|--------|
| **`backend/`** (raiz) | Backend antigo MySQL/Express; substituído por **`apps/backend`** (Prisma/Postgres). |
| **`docker-compose.pg.yml`**, **`docker-compose.pg-erp.yml`** | Unificados em **`docker-compose.yml`**. |
| **`Dockerfile`** (raiz) | Imagem do frontend passou a **`apps/frontend/Dockerfile`**. |
| **`test-results/`** | Artefatos Playwright — não versionados (`.gitignore`). |
| **`src/`**, **`public/`**, configs Vite/Tailwind/ESLint na raiz | Movidos para **`apps/frontend/`**. |
| **`test-all-endpoints.cjs`**, **`smoke-test-core.cjs`** (raiz) | Movidos para **`tests/smoke/`**. |
| Scripts utilitários soltos | **`builder.js`**, **`build_auth.js`**, **`test-me.js`**, **`FASE2_FINALIZADA.js`**, **`GUIA_FASE3_PRATICO.js`**, **`mockDatabase.js`** — obsoletos ou redundantes. |
| Pastas opcionais removidas se existiam | **`backend-old/`**, **`backup/`**, **`temp/`**, **`legacy/`**. |

## Markdown consolidado

Todos os **`.md` da raiz**, exceto **`README.md`** e este **`CLEANUP_REPORT.md`**, foram movidos para:

- **`docs/archive/root-md/`** — histórico (fases, Vercel, checklists, índices antigos).

Documentação ativa reorganizada:

| Destino | Conteúdo |
|---------|-----------|
| **`README.md`** (raiz) | Único ponto de entrada operacional. |
| **`docs/architecture/overview.md`** | Visão do monorepo. |
| **`docs/architecture/producao-checklist.md`** | Antigo `docs/ERP_PRODUCAO_CHECKLIST.md`. |
| **`docs/api/endpoints.md`** | Referência resumida da API. |
| **`docs/user-guide/`** | README + `sidebar-nocode.md` (ex-`SIDEBAR_NOCODE.md`). |
| **`docs/reports/final_test_report.md`** | Relatório de testes (caminho atualizado). |

## Arquivos novos ou relevantes

- **`.env.example`** — variáveis para Compose e desenvolvimento.
- **`scripts/seed-dev.sh`** — seed Prisma local (`apps/backend`).
- **`tests/integration/README.md`** — placeholder + nota sobre remoção dos testes Jest do backend legado.
- **`package.json` (raiz)** — scripts `dev` (concurrently), `lint`, `test`, `docker:*`.

## Docker Compose unificado

- **Serviços:** `postgres`, `redis`, `backend`, `frontend`.
- **`container_name`:** `erp_postgres`, `erp_redis`, `erp_backend`, `erp_frontend`.
- **Portas padrão no host:** Postgres **5432**, Redis **6379**, API **3001**, frontend **5173** (mapeadas para nginx interno `:80`).
- **Variáveis:** ver `.env.example` (`JWT_SECRET` obrigatório, overrides de porta com `*_PUBLISH_PORT`).

## Estrutura final (resumo)

```
ERPCOZERP/
├── .env.example
├── .gitignore
├── README.md
├── CLEANUP_REPORT.md
├── docker-compose.yml
├── package.json
├── playwright.config.ts
├── apps/
│   ├── backend/          # Node + Prisma
│   └── frontend/         # Vite + React
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── archive/root-md/
│   ├── reports/
│   └── user-guide/
├── scripts/
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── smoke/
```

## Pendências / notas

1. **Volumes Docker antigos:** quem usava o compose MySQL (`mysql_data`) pode ter volume órfão; remover manualmente com `docker volume ls` se necessário.
2. **OpenAPI:** não gerado automaticamente; pode ser adicionado em `docs/api/` futuramente.
3. **`npm run test`** na raiz executa apenas o smoke HTTP; **`test:e2e`** exige Playwright instalado na raiz (`npm install` já traz `@playwright/test`).
4. **`scripts/*.sh`:** em Windows, usar Git Bash ou WSL para execução direta.

## Verificações executadas

- `npm install` (raiz + `apps/frontend` + `apps/backend`).
- `npm run lint --prefix apps/frontend` — OK.
- `npm run lint --prefix apps/backend` (`tsc --noEmit`) após `prisma generate` — OK.
