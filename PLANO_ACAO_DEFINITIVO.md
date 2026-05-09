# 🚀 PLANO DE AÇÃO DEFINITIVO — ERPCOZERP
## Estado Real em 09/05/2026

---
## ✅ PASSO 1 — LIMPEZA REAL DA RAIZ

**Status:** RAÍZ ATUAL = 19 arquivos (meta ≤22)

Removidos:
- NOTA_A.md
- ts-errors.txt, ts-errors-v2.txt
- setup-db.sql

**GitHub Languages esperado:**
- TypeScript >60%
- JavaScript <10% (só prettier.config.mjs 0.2KB)

Se ainda houver lixo na raiz:
```bash
git rm ts-errors*.txt 2>$null
git commit -m "chore: cleanup remaining"
git push origin main
```

---
## ✅ PASSO 2 — SEED COZINCA (DADOS REAIS)

**Arquivo:** apps/backend/prisma/seed-cozinca.ts

**Conteúdo:**
- Empresa: Cozinca Tecnologia em Cozinhas Profissionais Ltda (CNPJ 12.345.678/0001-90)
- 15 clientes reais (SESC, HC, Rede D''Or, Sodexo, GRSA, Sírio-Libanês, EMBRAER, etc.)
- 16 produtos do catálogo real (fogões, fornos, refrigeração, prensas, processadores)
- 12 usuários da equipe real (vendas, produção, engenharia, compras, operadores, qualidade)
- 5 pedidos de venda demo com histórico

**Executar local:**
```bash
npm run seed:cozinca
# ou
cd apps/backend && SEED_COZINCA=true npx tsx prisma/seed-cozinca.ts
```

**Login master:** admin@cozinca.com.br / Cozinca@2026

---
## ✅ PASSO 3 — USUÁRIOS E PERMISSÕES

**Roles já criadas em seed.ts:**
- master, gerente, gerente_producao, orcamentista_vendas, projetista, compras
- corte_laser, dobra_montagem, solda, expedicao, qualidade, financeiro, rh

**Permissões vinculadas** automaticamente (seed-cozinca.ts):
- Cada usuário recebe a role correspondente
- Master recebe todas as permissões

**Perfil de acesso:**
| Papel | Email | Permissões principais |
|-------|-------|---------------------|
| Master | admin@cozinca.com.br | Total |
| Gerente | gerente@cozinca.com.br | Vendas+ Produção+ Financeiro |
| Vendas | vendas@cozinca.com.br | Pedidos, Clientes, Orçamentos |
| Produção | prod@cozinca.com.br | OP, Apontar, Kanban |
| Engenharia | eng@cozinca.com.br | Produtos, BOM, Roteiros |
| Compras | compras@cozinca.com.br | OC, Fornecedores |

---
## ✅ PASSO 4 — DEPLOY RAILWAY

**Configuração criada:** railway.yml

**Como implantar:**

### Via Railway CLI:
```bash
npm i -g @railway/cli
railway login
railway init
railway add   # PostgreSQL
railway up
```

### Via GitHub (Web):
1. railway.app → New Project → Deploy from GitHub
2. Selecione: Gabri013/ERPCOZERP
3. Railway detecta railway.yml automaticamente
4. Configure env vars no painel:
   - FRONTEND_URL (preencher após Vercel)
   - JWT_SECRET (gerado auto)
   - DATABASE_URL (auto)
5. Aguarde build Docker

**Após deploy:**
- URL: https://erpcozerp-backend.up.railway.app
- Health: /health
- Docs: /api/docs

**Frontend (Vercel):**
- Conecte repo no vercel.com
- Root dir: `apps/frontend`
- Env var NEXT_PUBLIC_API_URL = URL do Railway backend

---
## 📋 CHECKLIST FINAL

- [x] Raiz com 19 arquivos (≤22) ✅
- [x] Prompt de limpeza definitiva criado ✅
- [x] Seed Cozinca real criado ✅
- [ ] Seed executado localmente (pendente)
- [x] railway.yml configurado ✅
- [ ] Deploy no Railway executado (pendente)
- [ ] Frontend Vercel conectado (pendente)

---
**Próximos comandos:**
```bash
# 1. Teste local
npm run seed:cozinca

# 2. Deploy Railway
railway login && railway up

# 3. Deploy Vercel (frontend)
cd apps/frontend && vercel --prod
```
