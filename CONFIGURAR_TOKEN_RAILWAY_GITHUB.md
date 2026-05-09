
════════════════════════════════════════════════════════════════════════
🔑 CONFIGURAR TOKEN RAILWAY NO GITHUB (PASSO A PASSO)
════════════════════════════════════════════════════════════════════════

O workflow GitHub Actions precisa de um token do Railway para fazer
deploy automático. Siga exatamente:

───────────────────────────────────────────────────────────────────────
PASSO 1 — Obter token no Railway
───────────────────────────────────────────────────────────────────────
1. Acesse: https://railway.app
2. Faça login (se ainda não fez)
3. No menu superior direito, clique no seu avatar
4. Selecione: "Account"
5. No menu lateral, clique: "API Tokens"
6. Clique botão: "Create Token"
7. Dê um nome: "ERPCOZERP GitHub Actions"
8. Clique "Create"
9. **COPIE O TOKEN** (começa com "rlt_" ou "railway_")
   ⚠️  O token só é mostrado UMA VEZ — guarde!

───────────────────────────────────────────────────────────────────────
PASSO 2 — Adicionar token ao GitHub
───────────────────────────────────────────────────────────────────────
1. Acesse: https://github.com/Gabri013/ERPCOZERP/settings/secrets/actions
   (ou vá no repo → Settings → Secrets and variables → Actions)
2. Clique: "New repository secret"
3. Nome: RAILWAY_TOKEN
4. Valor: (cole o token copiado)
5. Clique: "Add secret"

✅ Token configurado!

───────────────────────────────────────────────────────────────────────
PASSO 3 — Disparar deploy (agora!)
───────────────────────────────────────────────────────────────────────
Opção A — Automático (já feito):
  Qualquer push para main já dispara o workflow.
  Como acabamos de commitear, o workflow deve estar rodando.

  Verifique: https://github.com/Gabri013/ERPCOZERP/actions

Opção B — Manual (se quiser disparar agora):
  1. Vá em: https://github.com/Gabri013/ERPCOZERP/actions
  2. No menu esquerdo, clique em "Deploy to Railway"
  3. Clique botão: "Run workflow" → "Run workflow" (branch: main)
  4. Aguarde os steps:
     ✓ Checkout
     ✓ Setup Node
     ✓ Install Railway CLI
     ✓ Deploy to Railway
     ✓ Run Seeds
     ✓ Output URL

───────────────────────────────────────────────────────────────────────
PASSO 4 — Aguarde (~5 minutos)
───────────────────────────────────────────────────────────────────────
O workflow executa:
  1. Faz checkout do código
  2. Instala Node.js 20
  3. Instala Railway CLI
  4. Faz deploy (railway up) → cria Docker + PostgreSQL
  5. Executa prisma:seed (roles, permissões)
  6. Executa seed:cozinca (dados reais)
  7. Mostra URL final

Nos logs, procure:
  ✅ Deploy concluído!
  Backend URL: https://erpcozerp-backend.up.railway.app

───────────────────────────────────────────────────────────────────────
PASSO 5 — Testar
───────────────────────────────────────────────────────────────────────
1. Health check:
   curl https://erpcozerp-backend.up.railway.app/health

2. API Docs (Swagger):
   https://erpcozerp-backend.up.railway.app/api/docs

3. Login no frontend (quando Vercel estiver pronto):
   Email: admin@cozinca.com.br
   Senha:  Cozinca@2026

───────────────────────────────────────────────────────────────────────
⚠️  SE O WORKFLOW FALHAR
───────────────────────────────────────────────────────────────────────
Erro comum: "RAILWAY_TOKEN not found"
→ Confira se o secret está em:
   https://github.com/Gabri013/ERPCOZERP/settings/secrets/actions
   Nome exato: RAILWAY_TOKEN (case-sensitive)

Erro: "PrismaClientInitializationError"
→ Banco ainda não está pronto. O workflow repete automaticamente
   na próxima execução. Ou force: Disparar workflow novamente.

Erro: seed não executa
→ Os seeds rodam após o deploy. Verifique logs do Railway:
   - Vá em Railway.app → Project → Deployments → Logs
   → Ou execute manualmente no console do Railway:
     railway run npm run prisma:seed
     railway run npm run seed:cozinca

───────────────────────────────────────────────────────────────────────
🎯 RESULTADO ESPERADO
───────────────────────────────────────────────────────────────────────
Após sucesso:
  ✅ Backend: https://erpcozerp-backend.up.railway.app
  ✅ Frontend: https://erpcozerp.vercel.app
  ✅ Banco: PostgreSQL Railway (persistente)
  ✅ Dados: Empresa Cozinca + 15 clientes + 16 produtos + 12 usuários

Pronto para uso em produção real.

════════════════════════════════════════════════════════════════════════
