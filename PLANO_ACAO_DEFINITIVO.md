# 🚀 PLANO DE AÇÃO DEFINITIVO — ERPCOZERP
## Estado Real em 09/05/2026

---
## ✅ PASSO 1 — LIMPEZA REAL DA RAIZ (CONCLUÍDO)

**Status:** RAÍZ ATUAL = 19 arquivos (meta ≤22)

Removidos:
- NOTA_A.md
- ts-errors.txt, ts-errors-v2.txt
- setup-db.sql

GitHub Languages esperado:
- TypeScript >60%
- JavaScript <10% (só prettier.config.mjs 0.2KB)

Se ainda houver lixo na raiz:
```bash
git rm ts-errors*.txt 2>NUL
git commit -m "chore: cleanup remaining"
git push origin main
```

---
## ✅ PASSO 2 — SEED COZINCA (DADOS REAIS)

**Arquivo:** apps/backend/prisma/seed-cozinca.ts

**Conteúdo:**
- Empresa: Cozinca Tecnologia em Cozinhas Profissionais Ltda (CNPJ 12.345.678/0001-90)
- 15 clientes reais (SESC, HC, Rede D'Or, Sodexo, GRSA, Sírio-Libanês, EMBRAER, PETROBRAS, BRF...)
- 16 produtos reais (fogões, fornos, refrigeração, prensas, processadores, coifas, lava-louças)
- 12 usuários da equipe (vendas, produção, engenharia, compras, operadores, qualidade, financeiro, RH)
- 5 pedidos de venda demo

**Executar (escolha uma opção):**

### Opção A — No Railway (mais fácil, **recomendado**)
```bash
# 1. Deploy no Railway (vai criar banco PostgreSQL automaticamente)
railway login
railway up

# 2. Após deploy, execute os seeds via Railway CLI:
railway variables set SEED_ENABLED=true
railway variables set SEED_COZINCA=true
railway run npm run prisma:seed
railway run npm run seed:cozinca

# 3. Desative as variáveis (opcional):
railway variables unset SEED_ENABLED
railway variables unset SEED_COZINCA
```

### Opção B — Local (requer PostgreSQL instalado)
Se você **tem PostgreSQL local**:

1. **Crie o banco** (psql como admin):
   ```sql
   CREATE DATABASE erpcoz;
   CREATE USER erpcoz WITH PASSWORD 'erpcozpass';
   GRANT ALL ON DATABASE erpcoz TO erpcoz;
   ```

2. **Configure .env** em `apps/backend/.env` (já configurado):
   ```
   DATABASE_URL=postgresql://erpcoz:erpcozpass@localhost:5432/erpcoz
   ```

3. **Execute os seeds:**
   ```bash
   cd apps/backend
   npm run prisma:seed      # cria roles, permissões, locations
   npm run seed:cozinca     # dados reais da Cozinca
   ```

**Login master:** admin@cozinca.com.br / Cozinca@2026

---
## ✅ PASSO 3 — USUÁRIOS E PERMISSÕES

**Roles** (criadas por `prisma:seed`):
master, gerente, gerente_producao, orcamentista_vendas, projetista, compras,
corte_laser, dobra_montagem, solda, expedicao, qualidade, financeiro, rh

**Seed Cozinca** vincula 12 usuários reais a essas roles.

**Perfis de acesso:**
| Papel | Email | Permissões principais |
|-------|-------|---------------------|
| Master | admin@cozinca.com.br | Total |
| Gerente | gerente@cozinca.com.br | Vendas+Produção+Financeiro |
| Vendas | vendas@cozinca.com.br | Pedidos, Clientes, Orçamentos |
| Produção | prod@cozinca.com.br | OP, Apontar, Kanban |
| Engenharia | eng@cozinca.com.br | Produtos, BOM, Roteiros |
| Compras | compras@cozinca.com.br | OC, Fornecedores |
| Operadores | laser, dobra, solda | Visualizar OP, Apontar |
| Qualidade | qualidade@cozinca.com.br | Inspeções, NC |
| Expedição | expedicao@cozinca.com.br | Expedição, Baixa de estoque |
| Financeiro | financeiro@cozinca.com.br | Contas, Fiscal |
| RH | rh@cozinca.com.br | Funcionários, Folha |

---
## ✅ PASSO 4 — DEPLOY NO RAILWAY (PRONTO)

**Configuração:** `railway.yml` já define:
- Serviço web (Dockerfile em `apps/backend/`)
- PostgreSQL basic-256mb
- Env vars: JWT_SECRET (auto), DATABASE_URL (auto), FRONTEND_URL (manual)

**Deploy:**

1. **Via Railway CLI** (recomendado):
   ```bash
   npm i -g @railway/cli
   railway login
   railway init   # selecione o repo Gabri013/ERPCOZERP
   railway up
   ```

2. **Via GitHub Web**:
   - railway.app → New Project → Deploy from GitHub
   - Selecione `Gabri013/ERPCOZERP`
   - Railway detecta `railway.yml` automaticamente
   - Após deploy, configure variáveis no painel:
     - `FRONTEND_URL` → URL do frontend (Vercel)
   - Anote a URL do backend (ex: `https://erpcozerp-backend.up.railway.app`)

**Executar seeds no Railway (uma vez):**
```bash
railway run npm run prisma:seed
railway run npm run seed:cozinca
```

**Frontend (Vercel):**
- Conecte o repositório no Vercel
- Root directory: `apps/frontend`
- Após deploy, configure `NEXT_PUBLIC_API_URL` com a URL do Railway backend

---
## 📋 CHECKLIST FINAL

- [x] Raiz com 19 arquivos (≤22) ✅
- [x] Prompt de limpeza definitivo criado ✅
- [x] Seed Cozinca real criado ✅
- [x] Cross-env adicionado (Windows compatível) ✅
- [x] Entrypoint atualizado (suporte SEED_COZINCA) ✅
- [x] Railway config pronto ✅
- [ ] Seed executado localmente (opcional — requer PostgreSQL)
- [ ] Deploy no Railway executado
- [ ] Frontend Vercel conectado

---
**Comandos rápidos:**

```bash
# Commit já feito — código no GitHub
git status   # deve estar limpo

# Para testar local (se tiver PostgreSQL):
cd apps/backend
npm run prisma:seed
npm run seed:cozinca

# Para deploy no Railway (recomendado):
railway login
railway up
# Aguarde ~5 min. URL será https://erpcozerp-backend.up.railway.app

# Verificar saúde:
curl https://<seu-backend>.up.railway.app/health
```

---
**Notas:**
- Sem PostgreSQL local? Pule o seed local e vá direto ao Railway.
- Docker não é necessário para develop se usar Railway.
- Senhas padrão devem ser trocadas em produção.
- TypeScript errors no backend são pré-existentes (schema Prisma desatualizado — não afeta seed).
