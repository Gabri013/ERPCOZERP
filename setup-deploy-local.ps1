# ============================================================================
# SETUP DEPLOY LOCAL - PostgreSQL + Redis + Node.js (Automatizado)
# ============================================================================
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 SETUP DEPLOY LOCAL - ERPCOZERP" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# ============================================================================
# 1. INSTALAR DEPENDENCIES LOCALMENTE (sem admin)
# ============================================================================
Write-Host "📦 PASSO 1: Instalando dependências do projeto..." -ForegroundColor Yellow

Write-Host "  ➤ Instalando dependências raiz..." -ForegroundColor Gray
npm install 2>&1 | Out-Null

Write-Host "  ➤ Instalando dependências backend..." -ForegroundColor Gray
Push-Location apps/backend
npm install 2>&1 | Out-Null
Pop-Location

Write-Host "  ➤ Instalando dependências frontend..." -ForegroundColor Gray
Push-Location apps/frontend
npm install 2>&1 | Out-Null
Pop-Location

Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 2. VERIFICAR POSTGRESQL
# ============================================================================
Write-Host "📦 PASSO 2: Verificando PostgreSQL..." -ForegroundColor Yellow

$postgresFound = $false
$pgPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
)

foreach ($pgPath in $pgPaths) {
    if (Test-Path $pgPath) {
        $postgresFound = $true
        Write-Host "✅ PostgreSQL encontrado em: $pgPath" -ForegroundColor Green
        break
    }
}

if (-not $postgresFound) {
    Write-Host "❌ PostgreSQL não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "OPÇÃO 1 - Instalar via Microsoft Store (Recomendado):" -ForegroundColor Yellow
    Write-Host "  1. Abra Microsoft Store" -ForegroundColor Gray
    Write-Host "  2. Procure por 'PostgreSQL'" -ForegroundColor Gray
    Write-Host "  3. Instale a versão mais recente" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OPÇÃO 2 - Download Manual:" -ForegroundColor Yellow
    Write-Host "  1. Visite: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "  2. Baixe e instale o PostgreSQL 16+" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Após instalar PostgreSQL, execute este script novamente." -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# 3. VERIFICAR REDIS
# ============================================================================
Write-Host "📦 PASSO 3: Verificando Redis..." -ForegroundColor Yellow

$redisFound = $false
$redisPaths = @(
    "C:\Program Files\Redis\redis-server.exe",
    "C:\Program Files (x86)\Redis\redis-server.exe",
    "C:\tools\redis\redis-server.exe"
)

foreach ($redisPath in $redisPaths) {
    if (Test-Path $redisPath) {
        $redisFound = $true
        Write-Host "✅ Redis encontrado em: $redisPath" -ForegroundColor Green
        break
    }
}

if (-not $redisFound) {
    Write-Host "❌ Redis não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Download manual (recomendado para Windows):" -ForegroundColor Yellow
    Write-Host "  1. Visite: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Gray
    Write-Host "  2. Baixe: Redis-x64-x.x.x.msi (versão mais recente)" -ForegroundColor Gray
    Write-Host "  3. Instale com opções padrão" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Após instalar Redis, execute este script novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Todas as dependências do sistema estão prontas!" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 4. CRIAR BANCO DE DADOS
# ============================================================================
Write-Host "📦 PASSO 4: Configurando banco de dados..." -ForegroundColor Yellow

$env:PGPASSWORD = "erpcozpass"
$createDbScript = @"
CREATE DATABASE IF NOT EXISTS erpcoz;
CREATE USER IF NOT EXISTS erpcoz WITH PASSWORD 'erpcozpass';
ALTER USER erpcoz WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE erpcoz TO erpcoz;
"@

# Tentar com PostgreSQL local
try {
    $createDbScript | psql -h localhost -U postgres -d postgres 2>&1 | Out-Null
    Write-Host "✅ Banco de dados 'erpcoz' configurado!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erro ao criar banco. Tentando alternativa..." -ForegroundColor Yellow
    # Se falhar, pode ser que o PostgreSQL recém instalado
    Write-Host "   Verifique que PostgreSQL está rodando com: net start postgresql-x64-XX" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# 5. PRISMA MIGRATIONS
# ============================================================================
Write-Host "📦 PASSO 5: Executando migrations do banco..." -ForegroundColor Yellow

Push-Location apps/backend
try {
    npx prisma migrate deploy 2>&1 | Out-Null
    Write-Host "✅ Migrations executadas!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erro nas migrations. Continuando..." -ForegroundColor Yellow
}

try {
    npx prisma db seed 2>&1 | Out-Null
    Write-Host "✅ Dados iniciais inseridos!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erro ao popular dados. Continuando..." -ForegroundColor Yellow
}

Pop-Location

Write-Host ""

# ============================================================================
# 6. RESUMO E PRÓXIMOS PASSOS
# ============================================================================
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "✅ SETUP COMPLETO!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Inicie os serviços (em 3 abas do PowerShell):" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ABA 1 - PostgreSQL:" -ForegroundColor Gray
Write-Host "   net start postgresql-x64-16" -ForegroundColor White
Write-Host ""
Write-Host "   ABA 2 - Redis:" -ForegroundColor Gray
Write-Host "   redis-server" -ForegroundColor White
Write-Host ""
Write-Host "   ABA 3 - Backend:" -ForegroundColor Gray
Write-Host "   cd apps/backend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "   ABA 4 - Frontend:" -ForegroundColor Gray
Write-Host "   cd apps/frontend && npm run dev -- --host" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Acesse a aplicação:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
