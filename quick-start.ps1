#!/usr/bin/env pwsh
# ============================================================================
# INICIO RAPIDO - Backend + Frontend (SEM PASSWORD)
# ============================================================================

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  INICIANDO DEPLOY - Backend + Frontend" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# Tentar conectar ao banco
Write-Host "[INFO] Testando conexao ao banco..." -ForegroundColor Cyan

$dbTest = psql -U postgres -h localhost -d postgres -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] PostgreSQL acessivel" -ForegroundColor Green
} else {
    Write-Host "[AVISO] PostgreSQL nao acessivel" -ForegroundColor Yellow
    Write-Host "        Certifique-se de que a senha do postgres esta correta" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[INFO] Dependencias npm ja instaladas!" -ForegroundColor Green
Write-Host ""

# ============================================================================
# ABRIR TERMINAIS PARA BACKEND E FRONTEND
# ============================================================================

Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1) Abra DOIS terminais PowerShell/CMD:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   TERMINAL 1 - BACKEND:" -ForegroundColor White
Write-Host "   cd apps/backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   TERMINAL 2 - FRONTEND:" -ForegroundColor White
Write-Host "   cd apps/frontend" -ForegroundColor Gray
Write-Host "   npm run dev -- --host" -ForegroundColor Gray
Write-Host ""
Write-Host "2) Se o banco nao funcionar, tente:" -ForegroundColor Yellow
Write-Host "   psql -U postgres" -ForegroundColor Gray
Write-Host "   [SENHA]" -ForegroundColor Gray
Write-Host ""
Write-Host "   Depois execute:" -ForegroundColor Gray
Write-Host "   CREATE DATABASE erpcoz;" -ForegroundColor Gray
Write-Host "   CREATE USER erpcoz WITH PASSWORD 'erpcozpass';" -ForegroundColor Gray
Write-Host "   GRANT ALL PRIVILEGES ON DATABASE erpcoz TO erpcoz;" -ForegroundColor Gray
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
