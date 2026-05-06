# ERP COZINCA INOX

ERP industrial completo para a **indústria de equipamentos em aço inox** — configurável, responsivo e pronto para produção.

Stack: **React 18 + Vite**, **Node.js + Express + Prisma**, **PostgreSQL**, **Redis**, organizado como **monorepo** enterprise.

## Módulos implementados

| # | Módulo | Páginas | Endpoints |
|---|--------|---------|-----------|
| 1 | Gestão de Acesso (RBAC, JWT, Audit) | Login, Usuários | `/api/auth`, `/api/users`, `/api/permissions` |
| 2 | Cadastros (Empresa, Clientes, Fornecedores, Produtos) | 6 páginas | `/api/customers`, `/api/stock/products` |
| 3 | Vendas & Orçamentos (Kanban, Aprovação) | 5 páginas | `/api/sales/*` |
| 4 | Compras (OC, Cotações, Recebimentos) | 4 páginas | `/api/purchases/*` |
| 5 | Estoque (Movimentações, Inventário, Endereçamento) | 5 páginas | `/api/stock/*` |
| 6 | Produção (OP, PCP, Kanban, Roteiros, Chão de Fábrica) | 8 páginas | `/api/work-orders`, `/api/production` |
| 7 | CRM (Pipeline, Leads, Oportunidades, Atividades) | 5 páginas | `/api/crm/*` |
| 8 | RH (Ponto, Férias, Folha) | 4 páginas | `/api/hr/*` |
| 9 | Financeiro (CR, CP, Fluxo, DRE, Conciliação) | 7 páginas | `/api/financial/*` |
| 10 | Fiscal (NF-e mock, SPED) | 3 páginas | `/api/fiscal/*` |
| 11 | Engenharia (BOM SolidWorks, 3D, Arquivos Técnicos) | 6 páginas | `/api/products/*` |
| 12 | Configurações (Metadata Studio, Workflows, Parâmetros) | 6 páginas | `/api/platform/*` |

**Total:** 83 páginas, ~180 endpoints REST, 41 models Prisma.

## Visão geral

- **`apps/frontend`** — SPA React + Vite, responsiva (375px–1440px), com Metadata Studio, Dashboards configuráveis, visualizador 3D (Three.js) e Socket.IO em tempo real.
- **`apps/backend`** — API REST, RBAC granular, registros dinâmicos (`/api/records`), todos os módulos industriais integrados.
- **`docker-compose.yml`** — opcional: stack completa em containers (demo/deploy); o desenvolvimento diário pode usar **Postgres e Redis instalados no sistema**.

### APIs por domínio (resumo)

| Prefixo | Conteúdo |
|---------|-----------|
| `/api/work-orders`, `/api/production` | Ordens de produção, máquinas, roteiros, PCP, chão de fábrica |
| `/api/crm` | Pipeline, atividades, dashboard CRM |
| `/api/hr` | Funcionários, ponto, férias/faltas, folha simplificada |
| `/api/fiscal` | NF-e mock, SPED texto demonstrativo |
| `/api/financial` | Fluxo de caixa, DRE e conciliação (sobre lançamentos entity) |
| `/api/search?q=` | Busca global (produtos, pedidos, clientes, OPs) — autenticado |
| `/api/platform/settings` | Empresa / parâmetros / modelo OP (JSON em `EntityRecord` dedicado) — `editar_config` |
| `/api/roles` | Lista papéis (roles) ativos — `user.manage` ou `editar_config` (não exige `gerenciar_usuarios`) |
| `/api/permissions/me` | Permissões efetivas do usuário autenticado — só JWT |
| `/api/permissions/catalog` | Catálogo de permissões (flat + por categoria) — `user.manage`, `editar_config` ou `gerenciar_usuarios` |
| `/api/permissions/users/:userId/effective` | Permissões efetivas de outro usuário — mesmos códigos que o catálogo |

### RBAC: API de usuários (`/api/users`)

Enforcement em `users.routes.ts`: **qualquer um** de `user.manage` ou `gerenciar_usuarios` para `GET/POST /api/users`, `DELETE /api/users/:id`, `PUT /api/users/:id/roles` e `PUT /api/users/:id` **sem** alteração de senha. **`PUT /api/users/:id` com campo `password`** exige **somente** `user.manage`.

Documentação detalhada: **`docs/modules/`** (`04-producao.md` … `09-engenharia.md`).

## Tecnologias

| Camada | Stack |
|--------|--------|
| Frontend | React 18, Vite 6, Tailwind, shadcn/ui, Zustand, React Router, Socket.IO client |
| Backend | Node 18+, Express, Prisma, PostgreSQL, Redis, Socket.IO, JWT |
| Infra | PostgreSQL, Redis (local ou em servidor); nginx em deploy (assets + proxy `/api` e `/socket.io`) |

## Pré-requisitos

- **Node.js 18+** e npm
- **PostgreSQL 15+** (recomendado) com uma base acessível em `127.0.0.1` (ou ajuste `DATABASE_URL`)
- **Redis 7+** (opcional no dev: sem `REDIS_URL` a API sobe, mas recursos que dependem de fila/cache podem faltar)
- **Docker** + Docker Compose v2 — apenas se quiser a stack em containers (veja fim desta seção)

## Configuração rápida (sem Docker)

1. **PostgreSQL** — crie usuário, senha e banco (exemplo alinhado ao Prisma/seed; ajuste se preferir outro nome):

   ```sql
   CREATE USER erpcoz WITH PASSWORD 'erpcozpass';
   CREATE DATABASE erpcoz OWNER erpcoz;
   ```

   No Windows, use o **pgAdmin**, o `psql` que vem com o [installer EDB](https://www.postgresql.org/download/windows/) ou `winget install PostgreSQL.PostgreSQL` (siga o assistente e anote a porta, em geral **5432**).

2. Copie variáveis de ambiente:

   ```bash
   cp .env.example .env
   cp apps/backend/.env.example apps/backend/.env
   ```

   Em **`apps/backend/.env`** defina pelo menos:

   - `DATABASE_URL=postgresql://erpcoz:erpcozpass@127.0.0.1:5432/erpcoz`
   - `JWT_SECRET` — string longa e aleatória  
   - Opcional: `REDIS_URL=redis://127.0.0.1:6379` se o Redis estiver rodando localmente.

   O ficheiro `.env` na **raiz** é útil para scripts e espelhar `JWT_SECRET` / `DATABASE_URL`; o backend carrega **`apps/backend/.env`** em primeiro lugar.

3. **Migrações e seed** (a partir da raiz do repo):

   ```bash
   bash scripts/setup.sh
   ```

   Se preferir executar manualmente:

   ```bash
   npm install
   npm install --prefix apps/frontend
   npm install --prefix apps/backend
   cd apps/backend && npx prisma migrate dev && cd ../..
   ```

   Para popular dados de demonstração opcionalmente:

   ```bash
   cd apps/backend && npx prisma db seed || true && cd ../..
   ```

4. Inicie API + frontend: `npm run dev` (API **3001**, Vite **5173**).

## Migração de dados legados (MySQL / MariaDB)

O dump phpMyAdmin do sistema antigo (por exemplo `127_0_0_1.sql` na raiz do repositório) pode ser importado para o PostgreSQL atual. O ERP persiste cadastros em **Entity / EntityRecord** (JSON); usuários legados recebem `users.legacy_id`.

Pré-requisitos: `DATABASE_URL` apontando para o Postgres (por exemplo `.env` na raiz ou `apps/backend/.env`), dependências instaladas em `apps/backend` (`@prisma/client`, `bcryptjs`).

```bash
# Opcional: caminho do dump (padrão: ./127_0_0_1.sql na raiz)
set LEGACY_SQL_PATH=127_0_0_1.sql
npm run migrate:legacy
```

A documentação ativa do projeto está em **`docs/modules/`**. O seed de desenvolvimento (`npm run prisma:seed --prefix apps/backend`) pode ser executado após as migrações, conforme o ambiente.

## Desenvolvimento diário

Com dependências instaladas e **Postgres** acessível (`DATABASE_URL` em `apps/backend/.env`):

```bash
npm run dev
```

- Frontend Vite: **5173**, proxy `/api` e WebSocket → `VITE_BACKEND_URL` ou `http://127.0.0.1:3001`.
- Backend: `apps/backend` (`tsx watch`), **3001**.

### Docker (opcional)

Se preferir **toda** a stack em containers (Postgres, Redis, API, nginx):

```bash
docker compose up -d --build
```

| Serviço | Container | URL / porta no host (padrão) |
|---------|-----------|-------------------------------|
| Frontend | `erp_frontend` | http://localhost:5173 |
| API | `erp_backend` | http://localhost:3001 |
| Postgres | `erp_postgres` | localhost:5432 |
| Redis | `erp_redis` | localhost:6379 |

Parar: `docker compose down`. Seed no container: `npm run docker:seed`.

O ficheiro **`docker-compose.infra.yml`** só sobe Postgres + Redis (útil se alguém da equipa ainda quiser DB em container com API no host); **não é obrigatório** se o Postgres estiver instalado no sistema.

Scripts úteis na raiz:

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Frontend + backend em paralelo (`concurrently`) |
| `npm run build` | Build frontend + backend |
| `npm run lint` | ESLint (frontend) + `tsc --noEmit` (backend) |
| `npm run smoke` | Typecheck backend + build frontend (sem API, sem Prisma generate) |
| `npm run test` | Smoke HTTP (`tests/smoke/api-smoke.cjs`) |
| `npm run test:e2e` | Playwright (`tests/e2e`) |
| `bash scripts/setup.sh` | Instala dependências e aplica migrações no backend |
| `npm run docker:up` / `docker:down` / `docker:logs` | Compose (opcional) |
| `npm run migrate:legacy` | Importa dump SQL legado (`scripts/migrate-legacy-data.js`) |

## Credenciais de demonstração

| Papel | E-mail | Senha típica (dev) |
|-------|--------|---------------------|
| Master / Admin | master@Cozinha.com | `master123_dev` (override: `DEFAULT_MASTER_PASSWORD`) |
| Gerente de Produção | gerente@cozinha.com | `demo123_dev` |
| Vendas / Comercial | vendas@cozinha.com | `demo123_dev` |
| Projetista / Engenharia | projetista@cozinha.com | `demo123_dev` |
| Operador Corte Laser | laser@cozinha.com | `demo123_dev` |
| Operador Dobra/Montagem | dobra@cozinha.com | `demo123_dev` |
| Qualidade | qualidade@cozinha.com | `demo123_dev` |
| Expedição | expedicao@cozinha.com | `demo123_dev` |
| RH | rh@cozinha.com | `demo123_dev` |
| Financeiro | financeiro@cozinha.com | `demo123_dev` |
| Compras | compras@cozinha.com | `demo123_dev` |

Perfis e permissões documentados em `apps/backend/prisma/seed.ts`.

## Backup e restore

Os scripts bash (`scripts/backup.sh`, `scripts/restore.sh`) assumem `docker compose` para aceder ao Postgres. **Sem Docker**, use `pg_dump` / `psql` apontando para o mesmo host/porta de `DATABASE_URL` (ex.: `pg_dump -h 127.0.0.1 -U erpcoz erpcoz > backup.sql`).

Cron exemplo (ajuste o comando se não usar compose):

```cron
0 2 * * * cd /caminho/ERPCOZERP && ./scripts/backup.sh >> /var/log/erp-backup.log 2>&1
```

Seed com Postgres local: `./scripts/seed-dev.sh` ou `npm run prisma:seed --prefix apps/backend` (requer DB em `apps/backend/.env`).

## Testes

```bash
npm run smoke             # typecheck backend + build frontend (CI/local rápido)
npm run test              # smoke principal (API em http://localhost:3001)
BACKEND_URL=http://host:port npm run test
npm run test:e2e          # Playwright
```

### Troubleshooting: `prisma generate` (Windows, EPERM)

Se `npx prisma generate` falhar ao renomear `query_engine` / DLL em `node_modules/.prisma/client` (erro **EPERM** ou arquivo bloqueado):

1. Feche processos Node que usem o projeto (`npm run dev`, `tsx watch`, test runners, IDE integrada ao terminal).
2. Pause ou adicione exclusão no antivírus para `apps/backend/node_modules` (ou o repo), às vezes bloqueia `.dll.node` temporários.
3. Apague arquivos temporários em `apps/backend/node_modules/.prisma/client` (nomes como `query_engine-*.dll.node.tmp*`), depois rode `npx prisma generate` de novo.
4. Se o client já existir e só for desenvolver, pode seguir sem novo generate até liberar o lock.

## Funcionalidades especiais de engenharia

### Importação de BOM (SolidWorks)
1. Abra a ficha do produto (`/estoque/produtos/bom/:id`)
2. Aba "Lista de Materiais" → "Importar BOM (SolidWorks)"
3. Cole CSV/TSV ou faça upload de .xlsx
4. Ajuste o mapeamento de colunas se necessário
5. Prévia com peso calculado e itens a criar → Confirmar

**Fórmula de peso:** `(X × Y × espessura) ÷ 10⁹ × 7850 kg/m³` (aço inox)

### Visualizador 3D
- Upload de STL, glTF, glB ou OBJ na ficha do produto (aba "Modelo 3D")
- Three.js com OrbitControls: rotação, zoom, panorâmica, wireframe

### Dashboard configurável
- Cada usuário pode personalizar os widgets do dashboard
- Widgets por perfil: KPIs de produção, funil de vendas, fluxo de caixa, etc.

## Documentação adicional

| Arquivo | Descrição |
|---------|-----------|
| `CLEANUP_FINAL_REPORT.md` | Auditoria de limpeza e organização |
| `RESPONSIVENESS_REPORT.md` | Estratégia de responsividade por breakpoint |
| `FUNCTIONALITY_REPORT.md` | Detalhamento de todos os módulos implementados |
| `VALIDATION_REPORT.md` | Validação por perfil, endpoints, responsividade |
| `docs/archive/` | Relatórios históricos de implementação |
| `docs/modules/` | Documentação técnica dos módulos |

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
