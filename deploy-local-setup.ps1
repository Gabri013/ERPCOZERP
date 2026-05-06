#!/usr/bin/env pwsh
# ============================================================================
# DEPLOY LOCAL COM ACESSO VIA IP - VERSAO SIMPLES
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  DEPLOY LOCAL COM ACESSO VIA IP" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Obter IP local
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*"
} | Select-Object -First 1).IPAddress

if (-not $localIP) {
    $localIP = "127.0.0.1"
}

# ============================================================================
# CHECKLIST PRE-REQUISITOS
# ============================================================================
Write-Host "[INFO] Checando pre-requisitos..." -ForegroundColor Cyan
Write-Host ""

# PostgreSQL
$pgPath = $null
$pgVersions = @("18", "16", "15", "14")
foreach ($v in $pgVersions) {
    $p = "C:\Program Files\PostgreSQL\$v\bin\psql.exe"
    if (Test-Path $p) {
        $pgPath = $p
        break
    }
}

if ($pgPath) {
    Write-Host "[OK] PostgreSQL encontrado" -ForegroundColor Green
} else {
    Write-Host "[ERRO] PostgreSQL nao encontrado!" -ForegroundColor Red
    Write-Host "     Instale em: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Redis
try {
    $redis = redis-cli ping 2>$null
    Write-Host "[OK] Redis encontrado" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Redis nao encontrado (opcional)" -ForegroundColor Yellow
}

# Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node --version
    Write-Host "[OK] Node.js $nodeVer encontrado" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Node.js nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[INFO] Instalando dependencias..." -ForegroundColor Cyan
npm install --silent 2>&1 | Out-Null
Push-Location apps/backend
npm install --silent 2>&1 | Out-Null
Pop-Location
Push-Location apps/frontend
npm install --silent 2>&1 | Out-Null
Pop-Location
Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green

Write-Host ""
Write-Host "[INFO] Executando migracoes..." -ForegroundColor Cyan
Push-Location apps/backend
try {
    npx prisma migrate deploy --skip-generate 2>&1 | Where-Object { $_ -notlike "*warn*" } | Out-Null
    Write-Host "[OK] Migracoes concluidas" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Erro na migracao (pode continuar)" -ForegroundColor Yellow
}
Pop-Location

# ============================================================================
# MOSTRAR INFORMACOES
# ============================================================================
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  SERVICOS PRONTOS" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  SEU IP LOCAL: $localIP" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ACESSO LOCAL:" -ForegroundColor White
Write-Host "    Frontend: http://localhost:5173" 
Write-Host "    Backend:  http://localhost:3001"
Write-Host ""
Write-Host "  ACESSO REMOTO (compartilhe este endereco):" -ForegroundColor White
Write-Host "    Frontend: http://$localIP`:5173" -ForegroundColor Yellow
Write-Host "    Backend:  http://$localIP`:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "    1. Abra 2 terminals" -ForegroundColor White
Write-Host ""
Write-Host "    Terminal 1 (Backend):" -ForegroundColor White
Write-Host "      cd apps/backend" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "    Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "      cd apps/frontend" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
