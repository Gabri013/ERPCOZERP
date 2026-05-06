#!/usr/bin/env pwsh
# ============================================================================
# DEPLOY LOCAL COM ACESSO VIA IP
# ============================================================================

$ErrorActionPreference = "Stop"

function Get-LocalIP {
    try {
        # Tenta obter IP da rede ativa (não loopback)
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
            $_.IPAddress -notlike "127.*" -and 
            $_.IPAddress -notlike "169.254.*" -and
            $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual"
        } | Select-Object -First 1).IPAddress
        
        if (-not $ip) {
            # Fallback: tenta conexão com DNS
            $ip = ([System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | 
                Where-Object { $_.AddressFamily -eq "InterNetwork" -and $_.IPAddressToString -notlike "127.*" } | 
                Select-Object -First 1).IPAddressToString
        }
        
        return $ip
    } catch {
        return "127.0.0.1"
    }
}

function Write-Header {
    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Cyan
    Write-Host "  DEPLOY LOCAL COM ACESSO VIA IP" -ForegroundColor Cyan
    Write-Host "=====================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$message)
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-Error2 {
    param([string]$message)
    Write-Host "[ERRO] $message" -ForegroundColor Red
}

function Write-Info {
    param([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$message)
    Write-Host "[PASSO] $message" -ForegroundColor Magenta
}

Write-Header

# ============================================================================
# 1. VERIFICAR POSTGRESQL
# ============================================================================
Write-Step "Verificando PostgreSQL..."

$postgresPath = $null
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $postgresPath = $path
        break
    }
}

if (-not $postgresPath) {
    Write-Error2 "PostgreSQL nao encontrado!"
    Write-Host "Instale em: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    exit 1
}

$env:Path += ";$(Split-Path $postgresPath)"
Write-Success "PostgreSQL encontrado"

# ============================================================================
# 2. VERIFICAR REDIS
# ============================================================================
Write-Step "Verificando Redis..."

try {
    $redisTest = redis-cli ping 2>&1
    Write-Success "Redis conectado"
} catch {
    Write-Info "Redis nao acessivel (continuando...)"
}

# ============================================================================
# 3. INSTALAR DEPENDENCIAS SE NECESSARIO
# ============================================================================
Write-Step "Verificando dependencias..."

if (-not (Test-Path "node_modules")) {
    Write-Host "  Instalando raiz..." -ForegroundColor Gray
    npm install --silent 2>&1 | Out-Null
}

if (-not (Test-Path "apps/backend/node_modules")) {
    Write-Host "  Instalando backend..." -ForegroundColor Gray
    Push-Location apps/backend
    npm install --silent 2>&1 | Out-Null
    Pop-Location
}

if (-not (Test-Path "apps/frontend/node_modules")) {
    Write-Host "  Instalando frontend..." -ForegroundColor Gray
    Push-Location apps/frontend
    npm install --silent 2>&1 | Out-Null
    Pop-Location
}

Write-Success "Dependencias prontas"

# ============================================================================
# 4. EXECUTAR MIGRACOES
# ============================================================================
Write-Step "Executando migracoes..."

Push-Location apps/backend
npx prisma migrate deploy 2>&1 | Out-Null
Pop-Location

Write-Success "Migracoes concluidas"

# ============================================================================
# 5. INFORMAR IP E PORTAS
# ============================================================================
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  SERVICOS RODANDO" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""

$localIP = Get-LocalIP
Write-Host "  SEU IP LOCAL: $localIP" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ACESSO LOCAL:" -ForegroundColor Cyan
Write-Host "    Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "    Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "  ACESSO REMOTO (compartilhe este endereco):" -ForegroundColor Cyan
Write-Host "    Frontend: http://$localIP:5173" -ForegroundColor Yellow
Write-Host "    Backend:  http://$localIP:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 6. INICIAR SERVICOS
# ============================================================================
Write-Step "Iniciando backend..."
Push-Location apps/backend
& npm run dev
Pop-Location
