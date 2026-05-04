# Deploy Local — PostgreSQL + Redis + Node.js (Sem Docker)

## 📋 Visão Geral

Este projeto roda completamente localmente sem Docker, usando:

| Serviço    | Tecnologia | Porta | Credenciais (dev)           |
|------------|------------|-------|-----------------------------|
| Backend    | Node.js    | 3001  |                             |
| Frontend   | Vite/React | 5173  |                             |
| Banco      | PostgreSQL | 5432  | user: `erpcoz` / pass: `erpcozpass` |
| Cache      | Redis      | 6379  | (sem senha em dev)          |

---

## 🚀 Início Rápido

### Windows (PowerShell)

```powershell
# 1. Instalar PostgreSQL e Redis manualmente se ainda não tiver:
#    • PostgreSQL: https://www.postgresql.org/download/windows/
#    • Redis: https://github.com/microsoftarchive/redis/releases

# 2. Executar instalação automatizada:
.\install-local.ps1

# 3. Iniciar a aplicação:
.\start-dev.ps1
```

### Linux/macOS

```bash
# 1. Instalar dependências do sistema:
# Ubuntu/Debian: sudo apt install postgresql postgresql-contrib redis-server
# macOS: brew install postgresql redis

# 2. Executar instalação:
./install-local.sh

# 3. Iniciar:
./start-dev.sh
```

---

## 📁 Arquivos Criados

```
ERPCOZERP/
├── .env                    # Variáveis de ambiente da raiz (desenvolvimento)
├── .env.development        # Template para development
├── backend/
│   └── .env                # Configurações específicas do backend
├── apps/frontend/
│   └── .env                # VITE_BACKEND_URL=http://localhost:3001
├── install-local.ps1       # Instalação automática (Windows)
├── install-local.sh        # Instalação automática (Linux/macOS)
├── start-dev.ps1           # Inicializa app (Windows)
├── start-dev.sh            # Inicializa app (Linux/macOS)
├── INSTALL_LOCAL.md        # Guia detalhado de instalação
└── README_LOCAL.md         # Este arquivo
```

---

## 🔧 Configuração Manual

Se preferir configurar manualmente:

### 1. PostgreSQL
```bash
# Criar banco e usuário
psql -U postgres -c "CREATE DATABASE erpcoz;"
psql -U postgres -c "CREATE USER erpcoz WITH PASSWORD 'erpcozpass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE erpcoz TO erpcoz;"
```

### 2. Redis
```bash
# Iniciar serviço
redis-server
# ou como serviço:
sudo service redis-server start   # Linux
brew services start redis         # macOS
Start-Service Redis               # Windows
```

### 3. Node.js dependencies
```bash
npm install
cd apps/backend && npm install && cd ../..
cd apps/frontend && npm install && cd ../..
```

### 4. Prisma
```bash
cd apps/backend
npx prisma migrate deploy
npx prisma seed
cd ../..
```

### 5. Executar
```bash
# Na raiz:
npm run dev
```

---

## 🔍 Verificação

- **Backend health:** http://localhost:3001/health
- **Frontend:** http://localhost:5173
- **Prisma Studio:** `cd apps/backend && npx prisma studio`

---

## ⚙️ Variáveis de Ambiente

| Variável            | Padrão (dev)                          | Obrigatório | Descrição                    |
|---------------------|---------------------------------------|-------------|------------------------------|
| `DATABASE_URL`      | `postgresql://erpcoz:erpcozpass@localhost:5432/erpcoz` | Sim (backend) | Conexão PostgreSQL           |
| `REDIS_URL`         | `redis://localhost:6379`              | Não         | Conexão Redis                |
| `JWT_SECRET`        | `dev_jwt_secret_change_me_please_...` | Sim (prod)  | Segredo JWT                  |
| `PORT`              | `3001`                                | Não         | Porta do backend             |
| `FRONTEND_URL`      | `http://localhost:5173`               | Não         | URL do frontend              |
| `VITE_BACKEND_URL`  | `http://localhost:3001`               | Não         | URL da API (frontend)        |

---

## 🐛 Troubleshooting

### PostgreSQL connection refused
```powershell
# Verificar se o serviço está rodando
pg_isready -h localhost -p 5432

# Iniciar manualmente se necessário
Start-Service postgresql
```

### Redis connection refused
```powershell
redis-cli ping
# Se erro, iniciar:
Start-Service Redis
```

### Porta em uso
Altere a porta no `.env` correspondente:
```env
PORT=3002
VITE_BACKEND_URL=http://localhost:3002
```

### Erro no `prisma migrate deploy`
```bash
cd apps/backend
npx prisma generate
npx prisma migrate reset --force  # Apaga dados! Cuidado.
```

---

## 📦 Estrutura do Projeto

```
ERPCOZERP/               # Raiz monorepo
├── apps/
│   ├── backend/         # Node.js + Express + Prisma
│   │   ├── src/
│   │   ├── prisma/
│   │   └── package.json
│   └── frontend/        # Vite + React + Tailwind
│       ├── src/
│       ├── vite.config.js
│       └── package.json
├── scripts/             # Scripts diversos
├── tests/               # Testes e2e/smoke
└── data/                # Uploads (criado automaticamente)
```

---

## 🎯 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Backend + Frontend (concurrently)
npm run dev:backend            # Apenas backend
npm run dev:frontend           # Apenas frontend

# Banco de dados
cd apps/backend && npx prisma studio    # Prisma Studio (GUI)
cd apps/backend && npx prisma migrate dev   # Nova migration

# Testes
npm run test:backend
npm run test:frontend
npm run test:all

# Build de produção
npm run build
```

---

## 🔄 Migração do Docker para Local

Se você já usava Docker e quer migrar para local:

1. **Parar containers:**
   ```powershell
   docker compose down
   ```

2. **Remover volumes Docker** (CUIDADO - apaga dados):
   ```powershell
   docker volume rm erpcozerp_pg_data erpcozerp_redis_data
   ```

3. **Usar configuração local** (este arquivo)

4. **Executar install-local.ps1** para configurar tudo

---

## 📚 Documentação

- [INSTALL_LOCAL.md](INSTALL_LOCAL.md) — Guia detalhado de instalação
- [docker-compose.yml](docker-compose.yml) — Configuração Docker (referência)
- [apps/backend/README.md](apps/backend/README.md) — Docs do backend
- [apps/frontend/README.md](apps/frontend/README.md) — Docs do frontend

---

**Desenvolvido com ❤️ para rodar local sem Docker**
