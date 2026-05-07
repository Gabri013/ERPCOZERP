# DEPLOY NA RAILWAY - GUIA COMPLETO

## Por que Railway ao invés de Vercel?

✅ **Railway suporta:**
- Backend Node.js rodando 24/7
- PostgreSQL com dados persistentes
- Redis para cache
- Variáveis de ambiente
- Docker (para máximo controle)

❌ **Vercel NÃO suporta:**
- Banco de dados persistente
- Processos rodando 24/7
- Redis
- Conexões long-running

---

## 🚀 DEPLOY RAILWAY EM 3 PASSOS

### **PASSO 1: Criar Conta Railway**

1. Vá para https://railway.app
2. Faça login/signup com GitHub
3. Autorize o acesso ao seu repositório

---

### **PASSO 2: Criar Novo Projeto**

**Opção A: Via CLI (mais rápido)**

```powershell
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Criar projeto
cd C:\Users\GABRIEL\Documents\GitHub\ERPCOZERP
railway init

# Selecionar: "Deploy from GitHub"
```

**Opção B: Via Website**

1. Acesse https://railway.app/dashboard
2. Clique em **"New Project"**
3. Clique em **"Deploy from GitHub"**
4. Procure por `ERPCOZERP` e clique
5. Selecione **Branch:** `main` (ou sua branch)

---

### **PASSO 3: Configurar Variáveis de Ambiente**

No dashboard do Railway, vá para **Variables** e adicione:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/erpcoz

# Redis (Railway cria automaticamente)
REDIS_URL=redis://host:port

# Aplicação
NODE_ENV=production
PORT=3000
JWT_SECRET=seu_secret_aleatorio_muito_longo_aqui_32_chars
SEED_ENABLED=false

# Credenciais admin
DEFAULT_MASTER_PASSWORD=SenhaForte123!
DEFAULT_ADMIN_PASSWORD=SenhaForte123!

# URLs
FRONTEND_URL=https://seu-dominio-railway.app
```

---

## 📋 ESTRUTURA DO PROJETO RAILWAY

Railway vai detectar automaticamente:

```
ERPCOZERP/
├── apps/
│   ├── backend/        ← Railway roda "npm start"
│   └── frontend/
├── package.json        ← Precisa ter scripts
├── docker-compose.yml  ← Para local
├── Dockerfile          ← Se usar (Railway detecta)
└── railway.json        ← Configuração (criado)
```

---

## 🐳 USAR DOCKER NO RAILWAY (Recomendado)

Railway detecta automaticamente se você tem Dockerfile.

Você já tem `docker-compose.yml`, vou criar o Dockerfile da raiz:

### **apps/backend/Dockerfile** (já existe)

Verify:
```bash
cat apps/backend/Dockerfile
```

### **apps/frontend/Dockerfile** (já existe)

Verify:
```bash
cat apps/frontend/Dockerfile
```

**Railway vai:**
1. Ler `docker-compose.yml`
2. Criar serviços PostgreSQL, Redis, Backend, Frontend
3. Conectar tudo automaticamente
4. Escalar conforme necessário

---

## 💰 PREÇOS RAILWAY

**Plano Gratuito:**
- $5 crédito mensal (suficiente para começar)
- PostgreSQL incluído
- Redis incluído
- Exemplo: Backend + DB + Redis = ~$2/mês

**Upgrade:**
- Pay-as-you-go (pague conforme usar)

---

## ⚡ DEPLOY RÁPIDO (Railway CLI)

```powershell
# 1. Login
railway login

# 2. Link ao projeto
railway link

# 3. Deploy
railway up

# 4. Ver logs
railway logs

# 5. Ver variáveis
railway variables

# 6. Acessar app
railway open
```

---

## 🔗 INTEGRAÇÃO COM FRONTEND (Vercel Optional)

Você **pode** optar por:

**Opção 1: Tudo Railway (Simples)**
```
http://seu-app.railway.app ← Tudo junto
```

**Opção 2: Frontend Vercel + Backend Railway (Recomendado)**
```
Frontend:  https://seu-app.vercel.app
Backend:   https://seu-api.railway.app
```

Se escolher Opção 2, na Vercel configure:
```env
VITE_BACKEND_URL=https://seu-api.railway.app
```

---

## 📊 MONITORAMENTO

Railway oferece:
- ✅ Logs em tempo real
- ✅ Métricas (CPU, RAM, Disk)
- ✅ Deploy history
- ✅ Rollback automático
- ✅ Health checks

---

## 🔒 SSL/TLS

O Railway provê HTTPS automaticamente para domínios customizados.
Para Render: SSL é provido automaticamente em todos os planos.
Para VPS próprio: execute scripts/setup-ssl.sh seu-dominio.com.br admin@seu-dominio.com.br

---

## 🆘 TROUBLESHOOTING

### App não inicia?
```powershell
railway logs
# Vê o erro em tempo real
```

### Banco não conecta?
```powershell
railway variables
# Verifica se DATABASE_URL está correto
```

### Erro de permissão?
```powershell
railway auth
# Re-autentica
```

---

## ✅ CHECKLIST DEPLOY RAILWAY

- [ ] Criar conta Railway (gratuito)
- [ ] Conectar repositório GitHub
- [ ] Confirmar Branch (main/master)
- [ ] Railway detecta docker-compose.yml
- [ ] Configurar variáveis de ambiente
- [ ] Deploy automático
- [ ] Testar https://seu-app.railway.app
- [ ] Configurar domain custom (opcional)

---

## 🎯 PRÓXIMO PASSO

**Você quer que eu:**

1. ⭕ Configure Railway pra você agora?
2. ⭕ Dê mais detalhes sobre algo específico?
3. ⭕ Crie scripts de deployment automático?

**Qual você prefere?**
