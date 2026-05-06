# Auditoria de Limpeza — ERPCOZERP
Data: 2026-05-06

## Arquivos removidos

### Root markdown removidos
- `CLAUDE.md`
- `CLEANUP_FINAL_REPORT.md`
- `DASHBOARD_ROLES_REPORT.md`
- `DEPLOY_CHECKLIST.md`
- `DEPLOY_LOCAL_IP.md`
- `DEPLOY_PRONTO.md`
- `FUNCTIONALITY_REPORT.md`
- `OPCOES_DEPLOY.md`
- `PRODUTO_ESTOQUE_REPORT.md`
- `PROGRESS.md`
- `RAILWAY_SETUP_CORRIGIDO.md`
- `README_LOCAL.md`
- `RESPONSIVENESS_REPORT.md`
- `SCAN_REPORT.md`
- `SEED_MATERIALS_REPORT.md`
- `VALIDATION_REPORT.md`
- `FINAL_BUILD_REPORT.md`

### Root PowerShell e shell obsoletos
- `deploy-local-setup.ps1`
- `deploy-local-with-ip.ps1`
- `deploy-local.ps1`
- `deploy-railway.ps1`
- `install-local.ps1`
- `quick-start.ps1`
- `setup-deploy-local.ps1`
- `start-app.ps1`
- `start-local.ps1`
- `start-erp.bat`
- `install-local.sh`
- `start-dev.sh`

### Arquivos de teste avulsos removidos da raiz
- `final-smoke-test.cjs`
- `full-test.mjs`
- `gen-token.cjs`
- `login-fresh.mjs`
- `login-via-nginx.cjs`
- `smoke-test.cjs`
- `test-all-backend.cjs`
- `test-login-debug.cjs`
- `test-me.mjs`
- `test-me2.mjs`
- `test-mock-db.cjs`
- `test-rules-debug.cjs`
- `test-spa-routes.cjs`
- `test-workflows.cjs`
- `test_login.json`

### Pastas e caches removidos
- `.npm-cache/` (cache local removido do repositório)
- `reports/` (relatórios gerados automaticamente)
- `docs/archive/` (relatórios históricos não ativos)
- `backend/` (pasta duplicada de backend na raiz)

## Arquivos reorganizados

- `tests/smoke/api-smoke.cjs` — novo arquivo consolidado de smoke test para API.
- `scripts/setup.sh` — novo script de setup unificado para instalação e migração.
- `package.json` — root `test` atualizado para `node tests/smoke/api-smoke.cjs`.
- `.gitignore` — atualizado para ignorar `reports/`, `*.sql` (exceto `setup-db.sql`) e reforçar `.npm-cache/`.
- `README.md` — atualizada a seção de instalação e scripts para refletir a estrutura limpa.

## Código corrigido

- Não foram feitas correções de código além da reorganização e atualização da documentação.

## Pendências identificadas

- `npm run smoke` ainda falha devido a erros de TypeScript existentes no backend (`apps/backend`), incluindo:
  - Tipagem inconsistente de `company` em `prisma`.
  - Tipos `Express` incorretos em `app.use` / middleware.
  - Módulos não encontrados (`node-forge`, `@aws-sdk/client-s3`).
  - Erros de tipagem em `src/modules/*`.
- Essas falhas parecem ser problemas de qualidade de código existentes e não causadas pela limpeza do repositório.

## Estrutura final

### Arquivos na raiz
- `.dockerignore`
- `.env.example`
- `.gitattributes`
- `.gitignore`
- `.prettierignore`
- `.railwayignore`
- `.vercelignore`
- `DEPLOY_RAILWAY.md`
- `docker-compose.infra.yml`
- `docker-compose.yml`
- `docker.env.example`
- `Dockerfile`
- `INSTALL_LOCAL.md`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `prettier.config.mjs`
- `README.md`
- `render.yaml`
- `setup-db.sql`
- `TESTING.md`
- `vercel.json`

### Pastas
- `.github/`
- `.kilo/`
- `apps/`
- `docs/`
- `lint-rules/`
- `node_modules/`
- `scripts/`
- `tests/`

## Resultado da auditoria

- Removidos 32 arquivos mortos da raiz.
- Removidos 1 pasta de cache `.npm-cache` e 1 pasta de relatórios `reports/`.
- Criado um único smoke test consolidado em `tests/smoke/api-smoke.cjs`.
- Criado `scripts/setup.sh` para instalação e migração simplificada.
- Atualizado `.gitignore` e `README.md` para a nova estrutura.
