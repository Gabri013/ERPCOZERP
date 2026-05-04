# CORRIGIR DEPLOY RAILWAY - PASSO A PASSO

## ✅ O que foi feito

1. ✅ Removido `railway.json` (estava causando erro)
2. ✅ Criado `Dockerfile` na raiz que:
   - Detecta backend em `apps/backend`
   - Instala dependências
   - Roda migrations
   - Inicia o backend

---

## 🚀 RECONFIGURANDO NO RAILWAY

### **Passo 1: Abrir Dashboard Railway**

Acesse: https://railway.app/dashboard

---

### **Passo 2: Deletar Deploy com Erro**

1. Clique no seu projeto `ERPCOZERP`
2. Abra o serviço que deu erro (talvez chamado "api" ou "backend")
3. Clique em **Settings** (engrenagem no canto superior direito)
4. Scroll até **Danger Zone**
5. Clique em **Delete Service**
6. Confirme a exclusão

---

### **Passo 3: Reconectar Repositório**

1. No dashboard do projeto, clique em **"New"**
2. Selecione **"Deploy from GitHub"**
3. Procure por seu repositório `ERPCOZERP`
4. Clique para importar
5. Railway vai detectar automaticamente:
   - ✅ O novo Dockerfile na raiz
   - ✅ PostgreSQL (criar automaticamente)
   - ✅ Redis (criar automaticamente)

---

### **Passo 4: Configurar Variáveis de Ambiente**

Após o deploy ser criado:

1. Vá para a aba **"Variables"** do serviço
2. Adicione as seguintes variáveis:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=seu_secret_aleatorio_muito_longo_aqui_32_chars_minimo
SEED_ENABLED=true
DEFAULT_MASTER_PASSWORD=SenhaForte123!
DEFAULT_ADMIN_PASSWORD=SenhaForte123!
FRONTEND_URL=https://seu-dominio.railway.app
```

3. PostgreSQL (Railway cria automaticamente):
   - Procure por `DATABASE_URL` - Railway já populará automaticamente
   - Se não tiver, Railway vai criar quando você criar serviço PostgreSQL

4. Redis (Railway cria automaticamente):
   - Railway criará `REDIS_URL` automaticamente
   - Se não aparecer, crie manualmente apontando para o Redis

---

### **Passo 5: Criar Banco de Dados PostgreSQL**

Se ainda não existir:

1. No dashboard do projeto, clique em **"New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Railway vai:
   - Criar banco automaticamente
   - Gerar `DATABASE_URL`
   - Conectar ao seu backend

---

### **Passo 6: Criar Redis (Opcional mas Recomendado)**

1. No dashboard do projeto, clique em **"New"**
2. Selecione **"Database"** → **"Redis"**
3. Railway vai:
   - Criar instância Redis
   - Gerar `REDIS_URL`
   - Conectar ao seu backend

---

### **Passo 7: Aguardar Deploy**

1. Railway vai construir o Docker:
   - Ler `Dockerfile` da raiz
   - Instalar dependências
   - Rodar migrations automaticamente
   - Iniciar backend

2. Você verá na aba **"Deployments"**:
   - 🟡 Building... (construindo)
   - 🟡 Deploying... (fazendo deploy)
   - 🟢 Success! (sucesso!)

---

### **Passo 8: Testar Backend**

Quando estiver verde:

1. Vá para aba **"Settings"** do serviço
2. Procure por **"Domains"** ou **"Public URL"**
3. Copie a URL (exemplo: `https://erp-backend-production-xxxxx.up.railway.app`)
4. Teste no navegador:
   - `https://seu-url.up.railway.app/health`
   - Deve retornar status 200

---

## 🔗 CONECTAR COM FRONTEND (Opcional)

Se você quer Frontend na Vercel:

1. Vá para https://vercel.com
2. Deploy `apps/frontend` como projeto separado
3. Configure variável de ambiente:
   ```env
   VITE_BACKEND_URL=https://seu-backend-railway.app
   ```

---

## ⚡ TROUBLESHOOTING

### "Build falhou"
```
→ Verificar logs: Clique em "Logs" no serviço
→ Comum: DATABASE_URL não configurada
→ Solução: Criar serviço PostgreSQL primeiro
```

### "Migrations falharam"
```
→ Verificar variável DATABASE_URL
→ Verificar se PostgreSQL está rodando
→ Comando: npx prisma migrate deploy
```

### "Aplicação travada"
```
→ Verificar logs: railway logs
→ Reiniciar: Clicar em restart no dashboard
→ Ou fazer novo deploy: git push
```

---

## 📝 RESUME DO COMANDO (se preferir CLI)

```powershell
# 1. Instalar CLI (se não tiver)
npm install -g @railway/cli

# 2. Login
railway login

# 3. Conectar ao projeto
railway link

# 4. Fazer deploy
git push
railway up

# 5. Ver logs
railway logs --follow

# 6. Ver URL
railway open
```

---

## ✅ CHECKLIST FINAL

- [ ] Dockerfile criado na raiz ✅
- [ ] railway.json removido ✅
- [ ] Acessei https://railway.app/dashboard
- [ ] Deletei serviço com erro
- [ ] Reconectei repositório GitHub
- [ ] Criei/configurei PostgreSQL
- [ ] Criei/configurei Redis
- [ ] Configurei variáveis de ambiente
- [ ] Deploy está verde (Success)
- [ ] Backend respondendo em /health
- [ ] Frontend conectado (se usando Vercel)

---

## 🎉 SUCESSO!

Se tudo estiver verde, seu backend está rodando na Railway!

URL: `https://seu-backend-railroad.up.railway.app`

---

**Dúvidas? Execução concluída? Me avisa!** ✨
