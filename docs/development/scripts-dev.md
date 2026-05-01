# Scripts em `scripts/dev/`

Arquivos PowerShell/shell movidos da raiz para não poluir o monorepo.

| Arquivo | Notas |
|---------|--------|
| `test-auth-flow.ps1`, `test-auth-complete.ps1`, `test-login-pw.ps1` | Fluxos de auth antigos / experimentais — revisar antes de usar. |
| `deploy-local.ps1`, `debug-vercel-build.*`, `build_auth.ps1` | Builds/deploy auxiliares; não fazem parte do pipeline oficial Docker. |

**Pipeline oficial:** `docker compose up -d --build` com `.env` conforme `.env.example`.
