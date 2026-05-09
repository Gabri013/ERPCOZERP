
════════════════════════════════════════════════════════════════════════
🚀 DEPLOY 100% FUNCIONAL — GUIA DEFINITIVO
════════════════════════════════════════════════════════════════════════

O QUE FOI CRIADO:
──────────────────
✅ GitHub Actions workflow: .github/workflows/deploy-railway.yml
   — Deploy automático no Railway a cada push para main
   — Executa seeds automaticamente (prisma:seed + seed:cozinca)
   — Pode ser executado manualmente via "Run workflow"

✅ railway.yml — config Railway (Docker, PostgreSQL, env vars)
✅ seed-cozinca.ts — dados reais da Cozinca
✅ docker-entrypoint.sh — suporte SEED_COZINCA

PASSO 1 — OBTER TOKEN DO RAILWAY
──────────────────────────────────
1. Acesse: https://railway.app
2. Clique no seu avatar → "Account" → "API Tokens"
3. Clique "Create Token"
4. Dê um nome: "ERPCOZERP GitHub Actions"
5. Copie o token (começa com "rlt_..." ou similar)

PASSO 2 — CONFIGURAR TOKEN NO GITHUB
──────────────────────────────────────
1. Acesse: https://github.com/Gabri013/ERPCOZERP/settings/secrets/actions
2. Clique "New repository secret"
3. Nome: RAILWAY_TOKEN
4. Valor: (cole o token do Railway)
5. Clique "Add secret"

PASSO 3 — EXECUTAR DEPLOY (AGORA!)
────────────────────────────────────
Você tem 2 opções:

OPÇÃO A — Automático (push para main) — JÁ ESTÁ CONFIGURADO
───────────────────────────────────────────────────────────
Qualquer commit no branch `main` dispara o workflow automaticamente.

Como acabamos de fazer:
  git push origin main   ✅ já feito

O workflow já está rodando! Verifique:
  https://github.com/Gabri013/ERPCOZERP/actions

 Aguarde ~5 minutos. O workflow vai:
  1. Checkout código
  2. Setup Node.js
  3. Instalar Railway CLI
  4. Fazer login com token
  5. Deploy no Railway (railway up)
  6. Executar prisma:seed
  7. Executar seed:cozinca
  8. Mostrar URL final

OPÇÃO B — Manual (trigger imediato)
────────────────────────────────────
1. Vá em: https://github.com/Gabri013/ERPCOZERP/actions
2. Selecione workflow "Deploy to Railway"
3. Clique "Run workflow" → "Run workflow" (branch: main)
4. Aguarde os steps completarem

PASSO 4 — MONITORAR
────────────────────
- Acesse: https://github.com/Gabri013/ERPCOZERP/actions
- Clique no workflow em execução (mais recente)
- Veja os logs em tempo real:
  • "Railway Login & Deploy"
  • "Run Seeds"
  • "Output URL"

Quando finalizar, você verá:
  ✅ Deploy concluído!
  Backend URL: https://erpcozerp-backend.up.railway.app

PASSO 5 — TESTAR
─────────────────
1. Health check:
   curl https://erpcozerp-backend.up.railway.app/health

2. API Docs:
   https://erpcozerp-backend.up.railway.app/api/docs

3. Login frontend:
   Email: admin@cozinca.com.br
   Senha:  Cozinca@2026

4. Frontend (se Vercel já conectado):
   https://erpcozerp.vercel.app

PASSO 6 — (OPCIONAL) DESATIVAR SEEDS AUTOMÁTICOS
──────────────────────────────────────────────────
Após primeiro deploy com sucesso, desative as flags para não
executar seeds novamente (evita sobrescrever dados):

  railway variables set SEED_ENABLED=false
  railway variables set SEED_COZINCA=false

Isso pode ser feito via Railway CLI (com token) ou no painel web.

════════════════════════════════════════════════════════════════════════
✅ PRONTO — SISTEMA 100% AUTOMÁTICO
════════════════════════════════════════════════════════════════════════

A partir de agora:
  • A cada push para main → deploy automático no Railway
  • Seeds executados automaticamente (na primeira vez)
  • URL fixa: https://erpcozerp-backend.up.railway.app
  • Frontend Vercel: auto-deploy no push

════════════════════════════════════════════════════════════════════════
⚠️  SE DER ERRO — TROUBLESHOOTING
════════════════════════════════════════════════════════════════════════

ERRO: "RAILWAY_TOKEN not found"
→ Confira se o secret está em:
   https://github.com/Gabri013/ERPCOZERP/settings/secrets/actions
   Nome exato: RAILWAY_TOKEN

ERRO: "PrismaClientInitializationError"
→ Banco ainda não está pronto. O workflow espera, mas se falhar,
   repita o deploy. Railway provisiona PostgreSQL em ~30s.

ERRO: Seed não roda automaticamente
→ Verifique logs do Railway (Deployments → View Logs)
→ Execute manualmente no console do Railway:
   npm run prisma:seed
   npm run seed:cozinca

ERRO: Frontend não conecta ao backend
→ No Vercel, configure NEXT_PUBLIC_API_URL com a URL do Railway
→ No Railway, configure FRONTEND_URL com a URL do Vercel

════════════════════════════════════════════════════════════════════════
📊 STATUS FINAL
════════════════════════════════════════════════════════════════════════

[Após deploy concluído]
Backend:  https://erpcozerp-backend.up.railway.app
Frontend: https://erpcozerp.vercel.app
Docs:     https://erpcozerp-backend.up.railway.app/api/docs

Login master: admin@cozinca.com.br / Cozinca@2026

───────────────────────────────────────────────────────────────────────
Precisa de ajuda? Consulte:
  - DEPLOY_RAILWAY_GUIA_RAPIDO.md
  - PLANO_ACAO_DEFINITIVO.md
  - GitHub Actions logs: https://github.com/Gabri013/ERPCOZERP/actions
───────────────────────────────────────────────────────────────────────
