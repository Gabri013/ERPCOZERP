# Auditoria COZINCA ERP (automática)

## O que corre

1. **API (Vitest)** — `apps/backend/src/__tests__/audit/api-surface.test.ts`  
   Pedidos anónimos ao manifesto `api-manifest.json` (status esperado) e smoke **GET** com token **master** (regista ≥500 / 401 / 403 sem falhar o job).

2. **E2E (Playwright)** — `tests/e2e/audit/route-sweep.spec.ts`  
   Para cada perfil em `matrix/users.json`, login e visita a cada rota em `matrix/frontend-routes.json`, com registo de `pageerror`, `console.error` / `console.warn`, “Acesso restrito” e capturas em `shots/` quando há `pageerror`.

3. **Relatório** — `tests/audit/aggregate-report.mjs` gera `RELATORIO_AUDITORIA.md` e `findings.json` dentro da pasta da corrida.

## Como executar

Levantar **frontend** (ex. porta 5174) e **backend** com base **seedada** (`prisma/seed`). Depois na raiz do monorepo:

```bash
npm run audit:run
```

Artefactos: `artifacts/audit/<runId>/` (`events.ndjson`, `summary.json`, `RELATORIO_AUDITORIA.md`, `findings.json`, `shots/`).

Variáveis úteis: `AUDIT_LOG_DIR`, `AUDIT_RUN_ID`, `E2E_BASE_URL`, `E2E_MASTER_EMAIL`, `E2E_MASTER_PASSWORD`, `E2E_DEMO_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`.

## Comandos isolados

```bash
npm run test:audit:backend
npm run test:audit:e2e
```

## Extensão

- Novas rotas UI: editar `tests/audit/matrix/frontend-routes.json`.  
- Novos perfis / emails: editar `tests/audit/matrix/users.json` e espelhar em `tests/e2e/fixtures/index.ts` (`AuditPersona`).  
- Novas APIs só leitura no manifesto anónimo: editar `apps/backend/src/__tests__/audit/api-manifest.json`.

Fluxos ponta a ponta (CRM → OP, compras → estoque, etc.) não são gerados automaticamente por este pacote; use specs E2E existentes em `tests/e2e/` ou acrescente ficheiros em `tests/e2e/audit/` que reutilizem o mesmo `AUDIT_LOG_DIR` e o formato de linhas NDJSON.

## Fila de erros (`error_queue`)

O backend expõe `/api/error-monitor/*` (ingest autenticado; fila e análise com `editar_config`). UI: **Sistema → Auto-correções** (`/sistema/auto-correcoes`).  
Correções de código **não** são aplicadas em runtime pelo ERP; use PR/CI. Ver `apps/backend/.env.example` para `OPENAI_API_KEY` opcional.
