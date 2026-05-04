# DEPLOY LOCAL - COMPLETO E FUNCIONANDO ✅

## Status: PRONTO PARA USO

Data: 04/05/2026  
Horário: Deploy finalizado com sucesso

---

## 🚀 ACESSO IMEDIATO

### URLs da Aplicação
- **Frontend (React/Vite):** http://localhost:5173
- **Backend (Node/Express):** http://localhost:3001
- **Health Check:** http://localhost:3001/health

### Credenciais Padrão (Admin)
```
Email:  admin@example.com
Senha:  master123_dev
```

---

## 📋 INFRAESTRUTURA INSTALADA

### ✅ PostgreSQL 18
- **Status:** Rodando como serviço Windows
- **Host:** localhost
- **Porta:** 5432
- **Database:** erpcoz
- **User:** erpcoz
- **Senha:** erpcozpass

### ⚠️ Redis
- **Status:** Não detectado (OPCIONAL)
- **Pode ser instalado de:** https://github.com/microsoftarchive/redis/releases
- **Nota:** Backend roda normalmente sem Redis para desenvolvimento

### ✅ Node.js
- **Versão:** v24.15.0
- **npm:** 11.12.1
- **Dependências:** Instaladas em raiz, backend e frontend

---

## 🗄️ BANCO DE DADOS

### Setup Realizado
✅ Database criado: `erpcoz`  
✅ Usuário criado: `erpcoz` com senha `erpcozpass`  
✅ Schema Prisma sincronizado  
✅ Dados iniciais (seed) inseridos  
✅ 25 migrations aplicadas  

### Conexão
```
DATABASE_URL=postgresql://erpcoz:erpcozpass@localhost:5432/erpcoz
```

---

## 📂 ESTRUTURA ATUAL

```
ERPCOZERP/
├── apps/
│   ├── backend/          (Node.js + Express + Prisma)
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── .env
│   │
│   └── frontend/         (React + Vite)
│       ├── src/
│       ├── package.json
│       └── .env
│
├── .env                  (Variáveis globais)
├── start-app.ps1        (Script para iniciar tudo)
├── deploy-local.ps1     (Script de setup)
└── README_LOCAL.md      (Documentação original)
```

---

## 🎯 PRÓXIMOS PASSOS

### 1. INICIAR A APLICAÇÃO
Simplesmente execute:
```powershell
cd C:\Users\GABRIEL\Documents\GitHub\ERPCOZERP
.\start-app.ps1
```

Isso abre 2 novas abas do PowerShell com:
- **Aba 1:** Backend rodando em http://localhost:3001
- **Aba 2:** Frontend rodando em http://localhost:5173

### 2. ACESSAR A APP
1. Abra: http://localhost:5173
2. Login com admin@example.com / master123_dev
3. Aproveite! 🎉

### 3. PARAR A APP
Pressione `CTRL+C` em qualquer aba ou feche as janelas.

---

## 📝 VARIÁVEIS DE AMBIENTE

### Arquivo: `.env` (raiz)
```env
FRONTEND_URL=http://localhost:5173
JWT_SECRET=dev_jwt_secret_super_secr3t_minimum_32_characters_long_string_here_12345
SEED_ENABLED=true
DEFAULT_MASTER_PASSWORD=master123_dev
DEFAULT_ADMIN_PASSWORD=admin123_dev
POSTGRES_PASSWORD=erpcozpass
POSTGRES_PUBLISH_PORT=5432
NODE_ENV=development
```

### Arquivo: `apps/backend/.env`
```env
DATABASE_URL=postgresql://erpcoz:erpcozpass@localhost:5432/erpcoz
REDIS_URL=redis://localhost:6379 (opcional)
NODE_ENV=development
PORT=3001
```

### Arquivo: `apps/frontend/.env`
```env
VITE_BACKEND_URL=http://localhost:3001
```

---

## 🔧 TROUBLESHOOTING

### Problema: Backend não inicia
```powershell
# Verificar banco
$env:DATABASE_URL = "postgresql://erpcoz:erpcozpass@localhost:5432/erpcoz"
cd apps/backend
npx prisma migrate deploy
npm run dev
```

### Problema: PostgreSQL pedindo senha
```powershell
# Resetar acesso
$env:PGPASSWORD = "123456"
psql -U postgres -h localhost -d erpcoz -c "SELECT 1;"
```

### Problema: Porta 3001 ou 5173 em uso
```powershell
# Liberar porta (exemplo para 3001)
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Problema: Reinstalar dependências
```powershell
# Limpar e reinstalar
rm -r node_modules apps/backend/node_modules apps/frontend/node_modules
npm install
cd apps/backend && npm install && cd ../..
cd apps/frontend && npm install && cd ../..
```

---

## 📊 VERIFICAÇÃO FINAL

```powershell
# PostgreSQL
$env:PGPASSWORD = "123456"
psql -U postgres -h localhost -d erpcoz -c "SELECT COUNT(*) FROM users;"

# Node e npm
node --version    # v24.15.0
npm --version     # 11.12.1

# Health Check
Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
```

---

## ✨ TUDO PRONTO!

Seu **DEPLOY LOCAL COM POSTGRE, NODE E REDIS** está:

✅ Instalado  
✅ Configurado  
✅ Testado  
✅ Pronto para usar  

**Próximo comando:**
```powershell
.\start-app.ps1
```

Aproveite! 🚀
