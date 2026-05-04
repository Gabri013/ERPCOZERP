# Instalação Local (Sem Docker)

## Requisitos

- **Node.js** 18+ (recomendado 20+)
- **PostgreSQL** 14+
- **Redis** 6+

### Windows

```powershell
# Node.js (já instalado)
node --version

# PostgreSQL - Baixe o instalador:
# https://www.postgresql.org/download/windows/
# Ou via Chocolatey:
choco install postgresql

# Redis - Baixe o instalador:
# https://github.com/microsoftarchive/redis/releases
# Ou via Chocolatey:
choco install redis-64
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib redis-server
```

### macOS

```bash
brew install node postgresql redis
brew services start postgresql
brew services start redis
```

---

## Configuração

### 1. Iniciar serviços

**Windows (PowerShell como Admin):**
```powershell
# PostgreSQL
Start-Service postgresql

# Redis
Start-Service Redis
```

**Linux/macOS:**
```bash
sudo service postgresql start
sudo service redis-server start
# ou
brew services start postgresql
brew services start redis
```

### 2. Criar banco e usuário

```bash
# Entrar no PostgreSQL
psql -U postgres

# No prompt do PostgreSQL:
CREATE DATABASE erpcoz;
CREATE USER erpcoz WITH PASSWORD 'erpcozpass';
GRANT ALL PRIVILEGES ON DATABASE erpcoz TO erpcoz;
\q
```

### 3. Configurar variáveis de ambiente

Copiar `.env.development` para `.env` na raiz (já criado):

```powershell
copy .env.development .env
```

Ajustar se necessário:
- `DATABASE_URL`: `postgresql://erpcoz:erpcozpass@localhost:5432/erpcoz`
- `REDIS_URL`: `redis://localhost:6379`
- `JWT_SECRET`: chave secreta forte (mín. 32 chars)

### 4. Instalar dependências

```powershell
npm install
cd apps/backend
npm install
cd ../apps/frontend
npm install
cd ../..
```

### 5. Executar migrations

```powershell
cd apps/backend
npx prisma migrate deploy
npx prisma seed
cd ../..
```

---

## Execução

### Opção A — Script rápido (Windows)

```powershell
.\start-dev.ps1
```

### Opção B — Manual (cross-platform)

**Terminal 1 — Backend:**
```powershell
cd apps/backend
npm run dev
```

**Terminal 2 — Frontend:**
```powershell
cd apps/frontend
npm run dev -- --host
```

---

## Acesso

- **API Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173
- **Health check:** http://localhost:3001/health

---

## Solução de Problemas

### PostgreSQL connection refused
```powershell
# Verificar se está rodando
pg_isready -h localhost -p 5432

# Se não estiver, iniciar
Start-Service postgresql
```

### Redis connection refused
```powershell
# Verificar se está rodando
redis-cli ping

# Se não estiver, iniciar
Start-Service Redis
```

### Porta em uso
Altere as portas no `.env`:
```env
PORT=3001          # Backend
VITE_BACKEND_URL=http://localhost:3001
```

### Erro no Prisma migrate
```powershell
cd apps/backend
npx prisma generate
npx prisma migrate reset --force  # CUIDADO: apaga dados
```

---

## Estrutura do Projeto

```
ERPCOZERP/
├── apps/
│   ├── backend/     # Node.js + Express + Prisma
│   └── frontend/    # Next.js/React
├── .env             # Variáveis de ambiente (development)
├── .env.development # Template para development
├── start-dev.ps1    # Script de inicialização (Windows)
└── INSTALL_LOCAL.md # Este arquivo
```
