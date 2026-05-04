#!/usr/bin/env pwsh
# ============================================================================
# INICIAR DEPLOY COMPLETO - Backend + Frontend
# ============================================================================

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  DEPLOY LOCAL INICIANDO" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""

# Configurar variáveis de ambiente
$env:DATABASE_URL = "postgresql://erpcoz:erpcozpass@localhost:5432/erpcoz"
$env:REDIS_URL = "redis://localhost:6379"
$env:NODE_ENV = "development"

Write-Host "[OK] Banco de dados: PostgreSQL (localhost:5432)" -ForegroundColor Green
Write-Host "[OK] Cache: Redis (localhost:6379)" -ForegroundColor Green
Write-Host ""

# ============================================================================
# ABRIR BACKEND EM NOVA ABA
# ============================================================================
Write-Host "[INFO] Iniciando Backend na porta 3001..." -ForegroundColor Cyan

Start-Process PowerShell -ArgumentList "-NoExit", "-Command", @"
cd 'C:\Users\GABRIEL\Documents\GitHub\ERPCOZERP\apps\backend'
`$env:DATABASE_URL = 'postgresql://erpcoz:erpcozpass@localhost:5432/erpcoz'
`$env:NODE_ENV = 'development'
npm run dev
"@

Start-Sleep -Seconds 3

# ============================================================================
# ABRIR FRONTEND EM NOVA ABA
# ============================================================================
Write-Host "[INFO] Iniciando Frontend na porta 5173..." -ForegroundColor Cyan

Start-Sleep -Seconds 3

# ============================================================================
# ABRIR FRONTEND EM NOVA ABA
# ============================================================================
Write-Host "[INFO] Iniciando Frontend na porta 5173..." -ForegroundColor Cyan

Start-Process PowerShell -ArgumentList "-NoExit", "-Command", @"
cd 'C:\Users\GABRIEL\Documents\GitHub\ERPCOZERP\apps\frontend'
`$env:VITE_BACKEND_URL = 'http://localhost:3001'
`$env:NODE_ENV = 'development'
npm run dev -- --host
"@

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  APLICACAO INICIADA!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Abas do PowerShell foram abertas com Backend e Frontend" -ForegroundColor Cyan
Write-Host ""
Write-Host "ACESSAR APLICACAO:" -ForegroundColor Yellow
Write-Host "  - Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "  - Health:    http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "Dados de LOGIN (padrao seed):" -ForegroundColor Yellow
Write-Host "  - Email:    admin@example.com" -ForegroundColor White
Write-Host "  - Senha:    master123_dev" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Pressione CTRL+C em qualquer janela para parar" -ForegroundColor Gray
Write-Host ""
