
═══════════════════════════════════════════════════════════════════
🚀 DEPLOY RAILWAY — GUIA RÁPIDO (SEM CLI)
═══════════════════════════════════════════════════════════════════

Como o Railway CLI precisa de token interativo, use a interface web:

PASSO 1 — Criar projeto no Railway
────────────────────────────────────
1. Acesse: https://railway.app
2. Clique "New Project"
3. Selecione "Deploy from GitHub"
4. Authorize o Railway no GitHub
5. Selecione o repositório: Gabri013/ERPCOZERP
6. Clique "Deploy"

PASSO 2 — Railway detecta railway.yml automaticamente
──────────────────────────────────────────────────────
- Service: erpcozerp-backend (Dockerfile em apps/backend/)
- Database: PostgreSQL basic-256mb (criado automaticamente)
- Build & Deploy automático

PASSO 3 — Configure variáveis de ambiente (no painel Railway)
──────────────────────────────────────────────────────────────
Vá em "Variables" do serviço erpcozerp-backend e adicione:

  SEED_ENABLED      = true
  SEED_COZINCA      = true
  FRONTEND_URL      = https://erpcozerp.vercel.app
  JWT_SECRET        = (já está preenchido automaticamente — ignore)
  NODE_ENV          = production

PASSO 4 — Aguarde o deploy (2–5 minutos)
──────────────────────────────────────────
- Build Docker → Migrations → Seed → Start
- Logs appear em "Deployments" → "View Logs"

PASSO 5 — Execute os seeds (se não rodou automaticamente)
──────────────────────────────────────────────────────────
No campo "Console" (ou via Railway CLI após obter token):
  railway run npm run prisma:seed
  railway run npm run seed:cozinca

PASSO 6 — Desative as flags de seed (opcional)
────────────────────────────────────────────────
Após seed concluído com sucesso, desative para não rodar novamente:
  railway variables unset SEED_ENABLED
  railway variables unset SEED_COZINCA

RESULTADO ESPERADO
────────────────────
Backend URL: https://erpcozerp-backend.up.railway.app
Health check: /health
API Docs: /api/docs

Login: admin@cozinca.com.br / Cozinca@2026

═══════════════════════════════════════════════════════════════════
⚠️  Se preferir usar CLI (após obter token):
═══════════════════════════════════════════════════════════════════

1. Obtenha o token:
   - Site Railway → Account → API Tokens → Create Token
   - Copie o token

2. No PowerShell:
   $env:RAILWAY_TOKEN="seu_token_aqui"
   railway projects list   # deve listar seu projeto
   railway up

3. Após deploy, execute seeds:
   railway run npm run prisma:seed
   railway run npm run seed:cozinca

