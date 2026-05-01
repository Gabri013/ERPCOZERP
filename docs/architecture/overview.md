# Arquitetura — visão geral

## Monorepo

- **`apps/backend`** — Servidor HTTP único (Express), módulos por domínio em `src/modules`, persistência Prisma/PostgreSQL, cache/eventos com Redis quando configurado, Socket.IO em `/socket.io`.
- **`apps/frontend`** — SPA empacotada pelo Vite; em Docker o nginx do serviço `frontend` faz proxy reverso para o hostname **`backend`** na rede Compose (`/api`, `/socket.io`).
- **Raiz** — apenas orquestração (`package.json`, Compose, `.env.example`, Playwright apontando para `tests/e2e`).

## Fluxo de dados

1. Usuário autentica em `POST /api/auth/login` → JWT.
2. CRUD dinâmico e telas operacionais consomem `/api/records`, `/api/entities`, módulos legados (`/api/compras/*`, `/api/financeiro/*`, …).
3. RBAC: permissões granulares `{entidade}.view|create|edit|delete` + legados mapeados em código; `record.manage` como bypass documentado.

## Documentação histórica

Material antigo da raiz foi movido para **`docs/archive/root-md/`** (fases, guias Vercel, checklist legados). Use apenas como referência; o **`README.md`** na raiz e **`docs/api/`** são a fonte atual.
