# ERP Cozinha

ERP configurável (**React + Vite**, **Node + Express + Prisma**, **PostgreSQL**, **Redis**), organizado como **monorepo** enterprise.

## Visão geral

- **`apps/frontend`** — SPA, formulários dinâmicos (Metadata Studio), dashboards e integração Socket.IO.
- **`apps/backend`** — API REST, RBAC, registros dinâmicos (`/api/records`), módulos vendas/compras/financeiro, tempo real.
- **`docker-compose.yml`** — um único arquivo para subir Postgres, Redis, API e frontend (nginx).

## Tecnologias

| Camada | Stack |
|--------|--------|
| Frontend | React 18, Vite 6, Tailwind, shadcn/ui, Zustand, React Router, Socket.IO client |
| Backend | Node 18+, Express, Prisma, PostgreSQL, Redis, Socket.IO, JWT |
| Infra | Docker Compose, nginx (assets estáticos + proxy `/api` e `/socket.io`) |

## Pré-requisitos

- **Docker** + Docker Compose v2 (recomendado para produção e demo).
- **Node.js 18+** e npm (desenvolvimento local sem Docker).

## Configuração rápida

```bash
cp .env.example .env
# Defina JWT_SECRET com string longa e aleatória
```

## Docker (recomendado)

```bash
docker compose up -d --build
```

| Serviço | Container | URL / porta no host (padrão) |
|---------|-----------|-------------------------------|
| Frontend | `erp_frontend` | http://localhost:5173 |
| API | `erp_backend` | http://localhost:3001 |
| Postgres | `erp_postgres` | localhost:5432 (usuário/base `erpcoz`) |
| Redis | `erp_redis` | localhost:6379 |

Variáveis opcionais no `.env`: `POSTGRES_PUBLISH_PORT`, `REDIS_PUBLISH_PORT`, `BACKEND_PUBLISH_PORT`, `FRONTEND_PUBLISH_PORT`, `POSTGRES_PASSWORD`, etc.

Parar:

```bash
docker compose down
```

### Seed via container

```bash
npm run docker:seed
```

## Desenvolvimento local (sem Docker da API)

Dois terminais ou um comando:

```bash
npm install
npm install --prefix apps/frontend
npm install --prefix apps/backend

npm run dev
```

- Frontend Vite: porta **5173**, proxy `/api` → `VITE_BACKEND_URL` ou `http://127.0.0.1:3001`.
- Backend: `apps/backend` (`tsx watch`), porta **3001**.

Scripts úteis na raiz:

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Frontend + backend em paralelo (`concurrently`) |
| `npm run build` | Build frontend + backend |
| `npm run lint` | ESLint (frontend) + `tsc --noEmit` (backend) |
| `npm run test` | Smoke HTTP (`tests/smoke/test-all-endpoints.cjs`) |
| `npm run test:e2e` | Playwright (`tests/e2e`) |
| `npm run docker:up` / `docker:down` / `docker:logs` | Compose |

## Credenciais de demonstração

| Papel | E-mail | Senha típica (dev) |
|-------|--------|---------------------|
| Master | master@Cozinha.com | `master123_dev` (override: `DEFAULT_MASTER_PASSWORD`) |

Perfis demo documentados no seed (`demo123_dev`, etc.) — ver `apps/backend/prisma/seed.ts`.

## Backup e restore

Scripts bash (`scripts/backup.sh`, `scripts/restore.sh`): usam `docker compose` e `pg_dump` / `psql`. Cron exemplo:

```cron
0 2 * * * cd /caminho/ERPCOZERP && ./scripts/backup.sh >> /var/log/erp-backup.log 2>&1
```

Seed local sem Docker: `./scripts/seed-dev.sh` (requer DB configurado em `apps/backend`).

## Testes

```bash
npm run test              # smoke principal (API em http://localhost:3001)
BACKEND_URL=http://host:port npm run test
npm run test:e2e          # Playwright
```

## Documentação adicional

- **`docs/api/endpoints.md`** — referência dos endpoints principais.
- **`docs/architecture/overview.md`** — visão do monorepo e decisões.
- **`docs/user-guide/`** — guias operacionais e metadata.
- **`docs/tests/integration.md`** — orientação para testes de integração.
- **`docs/development/scripts-dev.md`** — scripts legados em `scripts/dev/`.
- **`docs/reports/`** — relatórios de validação.
- **`docs/archive/root-md/`** — documentação histórica consolidada da raiz (não usar como fonte primária).
- **`CLEANUP_FINAL_REPORT.md`** — última auditoria de limpeza profunda (raiz).

## Estrutura (resumo)

```
apps/backend     → API Prisma
apps/frontend    → SPA Vite
scripts/         → backup, restore, seed-dev
tests/e2e        → Playwright
tests/smoke      → scripts Node contra a API
docs/            → documentação única (fora do README)
```

## Licença / uso

Projeto privado interno; ajuste políticas da sua organização.
