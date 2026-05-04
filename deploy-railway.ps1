#!/usr/bin/env pwsh
# ============================================================================
# DEPLOY AUTOMATIZADO NA RAILWAY
# ============================================================================

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  DEPLOY RAILWAY - AUTOMATIZADO" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Railway CLI está instalado
Write-Host "[INFO] Verificando Railway CLI..." -ForegroundColor Yellow

$railwayCheck = npm list -g @railway/cli 2>&1
if ($railwayCheck -like "*@railway/cli*") {
    Write-Host "[OK] Railway CLI instalado" -ForegroundColor Green
} else {
    Write-Host "[INSTALAR] Railway CLI não encontrado" -ForegroundColor Yellow
    Write-Host "   Executando: npm install -g @railway/cli" -ForegroundColor Gray
    npm install -g @railway/cli
}

Write-Host ""

# ============================================================================
# MENU DE OPCOES
# ============================================================================
Write-Host "SELECIONE UMA OPCAO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1) LOGIN no Railway" -ForegroundColor White
Write-Host "  2) INICIAR novo projeto" -ForegroundColor White
Write-Host "  3) FAZER DEPLOY (push)" -ForegroundColor White
Write-Host "  4) VER LOGS" -ForegroundColor White
Write-Host "  5) VER VARIAVEIS DE AMBIENTE" -ForegroundColor White
Write-Host "  6) ABRIR APLICACAO" -ForegroundColor White
Write-Host "  7) CONFIGURAR VARIAVEIS" -ForegroundColor White
Write-Host ""

$opcao = Read-Host "Digite o numero (1-7)"

switch ($opcao) {
    "1" {
        Write-Host ""
        Write-Host "[INFO] Abrindo Railway para login..." -ForegroundColor Cyan
        railway auth browser
        Write-Host "[OK] Login realizado!" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "[INFO] Iniciando novo projeto Railway..." -ForegroundColor Cyan
        railroad init
        Write-Host "[OK] Projeto criado!" -ForegroundColor Green
        Write-Host "[PROXIMO] Execute: .\deploy-railway.ps1 -opcao 3" -ForegroundColor Yellow
    }
    
    "3" {
        Write-Host ""
        Write-Host "[INFO] Fazendo DEPLOY para Railway..." -ForegroundColor Cyan
        Write-Host ""
        
        # Commit changes
        Write-Host "  → Commitando alteracoes..." -ForegroundColor Gray
        git add .
        git commit -m "Deploy para Railway - $(Get-Date -Format 'dd/MM/yyyy HH:mm')" -ErrorAction SilentlyContinue
        git push
        
        Write-Host "  → Fazendo deploy..." -ForegroundColor Gray
        railway up
        
        Write-Host ""
        Write-Host "[OK] DEPLOY CONCLUIDO!" -ForegroundColor Green
        Write-Host "[PROXIMO] Execute: .\deploy-railway.ps1 -opcao 6" -ForegroundColor Yellow
    }
    
    "4" {
        Write-Host ""
        Write-Host "[INFO] Exibindo logs em tempo real..." -ForegroundColor Cyan
        Write-Host "[DICA] Pressione CTRL+C para parar" -ForegroundColor Gray
        Write-Host ""
        railroad logs --follow
    }
    
    "5" {
        Write-Host ""
        Write-Host "[INFO] Variaveis de ambiente configuradas:" -ForegroundColor Cyan
        Write-Host ""
        railway variables
    }
    
    "6" {
        Write-Host ""
        Write-Host "[INFO] Abrindo aplicacao..." -ForegroundColor Cyan
        railroad open
    }
    
    "7" {
        Write-Host ""
        Write-Host "[INFO] Configurar variaveis de ambiente" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Abra o dashboard Railway e configure:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  DATABASE_URL = postgresql://..." -ForegroundColor Gray
        Write-Host "  NODE_ENV = production" -ForegroundColor Gray
        Write-Host "  JWT_SECRET = [sua-chave-secreta]" -ForegroundColor Gray
        Write-Host "  FRONTEND_URL = https://seu-dominio.railway.app" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Link: https://railway.app/dashboard" -ForegroundColor White
    }
    
    default {
        Write-Host "[ERRO] Opcao invalida!" -ForegroundColor Red
    }
}

Write-Host ""
