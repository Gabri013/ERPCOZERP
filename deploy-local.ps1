#!/usr/bin/env pwsh
# ============================================================================
# DEPLOY LOCAL AUTOMATIZADO - PostgreSQL + Redis + Node.js
# ============================================================================

$ErrorActionPreference = "Stop"
$script:hasErrors = $false

function Write-Status {
    param([string]$message, [string]$type = "info")
    
    switch ($type) {
        "success" { Write-Host "[OK] $message" -ForegroundColor Green }
        "error" { Write-Host "[ERROR] $message" -ForegroundColor Red; $script:hasErrors = $true }
        "warning" { Write-Host "[WARN] $message" -ForegroundColor Yellow }
        "info" { Write-Host "[INFO] $message" -ForegroundColor Cyan }
        "step" { Write-Host "[STEP] $message" -ForegroundColor Magenta }
        default { Write-Host $message }
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  DEPLOY LOCAL - PostgreSQL + Redis + Node.js" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. VERIFICAR E CONFIGURAR POSTGRESQL
# ============================================================================
Write-Status "Passo 1: Verificando PostgreSQL..." "step"

$postgresPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $postgresPath)) {
    $postgresPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
}
if (-not (Test-Path $postgresPath)) {
    $postgresPath = "C:\Program Files\PostgreSQL\15\bin\psql.exe"
}

if (Test-Path $postgresPath) {
    $env:Path += ";$([System.IO.Path]::GetDirectoryName($postgresPath))"
    Write-Status "PostgreSQL encontrado: $(psql --version)" "success"
} else {
    Write-Status "PostgreSQL não encontrado! Instale em: https://www.postgresql.org/download/windows/" "error"
    exit 1
}

# ============================================================================
# 2. VERIFICAR REDIS
# ============================================================================
Write-Status "Passo 2: Verificando Redis..." "step"

$redisFound = $false
$redisPaths = @(
    "C:\Program Files\Redis\redis-cli.exe",
    "C:\Program Files (x86)\Redis\redis-cli.exe",
    "C:\tools\redis\redis-cli.exe"
)

foreach ($path in $redisPaths) {
    if (Test-Path $path) {
        $env:Path += ";$([System.IO.Path]::GetDirectoryName($path))"
        $redisFound = $true
        break
    }
}

if ($redisFound) {
    try {
        $redisTest = redis-cli ping 2>&1
        Write-Status "Redis conectado: $redisTest" "success"
    } catch {
        Write-Status "Redis instalado mas não acessível. Verifique se está rodando." "warning"
    }
} else {
    Write-Status "Redis não encontrado em caminhos padrão" "warning"
    Write-Status "Instale em: https://github.com/microsoftarchive/redis/releases" "warning"
}

# ============================================================================
# 3. INSTALAR DEPENDÊNCIAS NPM
# ============================================================================
Write-Status "Passo 3: Instalando dependências npm..." "step"

try {
    Write-Host "  → npm install (raiz)..." -ForegroundColor Gray
    npm install --silent 2>&1 | Out-Null
    
    Write-Host "  → npm install (backend)..." -ForegroundColor Gray
    Push-Location apps/backend
    npm install --silent 2>&1 | Out-Null
    Pop-Location
    
    Write-Host "  → npm install (frontend)..." -ForegroundColor Gray
    Push-Location apps/frontend
    npm install --silent 2>&1 | Out-Null
    Pop-Location
    
    Write-Status "Dependências npm instaladas!" "success"
} catch {
    Write-Status "Erro ao instalar dependências: $_" "error"
}

# ============================================================================
# 4. CRIAR BANCO DE DADOS
# ============================================================================
Write-Status "Passo 4: Configurando banco de dados PostgreSQL..." "step"

$createDbScript = @"
-- Criar database se não existir
CREATE DATABASE IF NOT EXISTS erpcoz;

-- Criar usuário
CREATE USER IF NOT EXISTS erpcoz WITH PASSWORD 'erpcozpass';

-- Dar permissões necessárias
ALTER USER erpcoz WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE erpcoz TO erpcoz;

-- Conectar ao banco
\c erpcoz

-- Extensions úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
"@

try {
    $env:PGPASSWORD = "postgres"
    
    # Tentar criar com default user postgres
    $createDbScript | psql -h localhost -U postgres 2>&1 | Out-Null
    
    Write-Status "Banco de dados 'erpcoz' criado/configurado!" "success"
    
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
} catch {
    Write-Status "Erro ao criar banco de dados: $_" "warning"
    Write-Status "Tente criar manualmente:" "warning"
    Write-Host "  psql -U postgres" -ForegroundColor Gray
    Write-Host "  CREATE DATABASE erpcoz;" -ForegroundColor Gray
    Write-Host "  CREATE USER erpcoz WITH PASSWORD 'erpcozpass';" -ForegroundColor Gray
    Write-Host "  ALTER USER erpcoz WITH SUPERUSER;" -ForegroundColor Gray
    Write-Host "  GRANT ALL PRIVILEGES ON DATABASE erpcoz TO erpcoz;" -ForegroundColor Gray
}

# ============================================================================
# 5. PRISMA MIGRATIONS
# ============================================================================
Write-Status "Passo 5: Executando Prisma migrations..." "step"

$env:DATABASE_URL = "postgresql://erpcoz:erpcozpass@localhost:5432/erpcoz"

Push-Location apps/backend

try {
    Write-Host "  → npx prisma migrate deploy..." -ForegroundColor Gray
    npx prisma migrate deploy 2>&1 | Out-Null
    Write-Status "Migrations executadas!" "success"
} catch {
    Write-Status "Erro nas migrations: $_" "warning"
}

try {
    Write-Host "  → npx prisma db seed..." -ForegroundColor Gray
    npx prisma db seed 2>&1 | Out-Null
    Write-Status "Dados iniciais inseridos!" "success"
} catch {
    Write-Status "Erro ao popular dados: $_" "warning"
}

Pop-Location

# ============================================================================
# 6. RESUMO E INSTRUÇÕES
# ============================================================================
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETO!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""

Write-Status "Ambiente pronto para desenvolvimento" "success"
Write-Host ""
Write-Host "INICIAR A APLICACAO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Abra 4 terminais PowerShell/CMD e execute:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 - PostgreSQL (se nao estiver rodando como servico):" -ForegroundColor Gray
Write-Host "  postgres -D 'C:\Program Files\PostgreSQL\18\data'" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 - Redis (se nao estiver rodando como servico):" -ForegroundColor Gray
Write-Host "  redis-server" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 3 - Backend:" -ForegroundColor Gray
Write-Host "  cd apps/backend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 4 - Frontend:" -ForegroundColor Gray
Write-Host "  cd apps/frontend && npm run dev -- --host" -ForegroundColor White
Write-Host ""
Write-Host "ACESSAR APLICACAO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  - Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "  - Health:    http://localhost:3001/health" -ForegroundColor White
Write-Host ""

if (-not $redisFound) {
    Write-Host "[AVISO] Redis nao detectado:" -ForegroundColor Yellow
    Write-Host "  Se precisar de cache/sessoes, instale Redis em:" -ForegroundColor Gray
    Write-Host "  https://github.com/microsoftarchive/redis/releases" -ForegroundColor Gray
    Write-Host ""
}

if ($script:hasErrors) {
    Write-Host "[AVISO] Alguns avisos foram exibidos acima. Revise se necessario." -ForegroundColor Yellow
}

Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
