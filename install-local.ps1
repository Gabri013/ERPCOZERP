param(
    [switch]$Force,
    [switch]$SkipServices
)

Write-Host "🔧 ERPCOZERP - Instalação Local" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como administrador (necessário para iniciar serviços no Windows)
if (-not $SkipServices -and -not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "⚠️  Este script precisa ser executado como Administrador para gerenciar serviços." -ForegroundColor Yellow
    Write-Host "   Re-execute o PowerShell como Administrador ou use -SkipServices para pular esta etapa." -ForegroundColor Gray
    Write-Host ""
    $answer = Read-Host "Deseja continuar sem iniciar serviços? (s/N)"
    if ($answer -ne 's' -and $answer -ne 'S') {
        exit 1
    }
    $SkipServices = $true
}

if (-not $SkipServices) {
    # Verificar PostgreSQL
    Write-Host "📦 Verificando PostgreSQL..." -ForegroundColor Yellow
    try {
        $pgVer = psql --version 2>&1
        Write-Host "   PostgreSQL encontrado: $pgVer" -ForegroundColor Green
    } catch {
        Write-Host "❌ PostgreSQL não encontrado!" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Instale PostgreSQL manualmente:" -ForegroundColor Gray
        Write-Host "   • Windows: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
        Write-Host "   • Chocolatey: choco install postgresql" -ForegroundColor Gray
        Write-Host "   • Linux: sudo apt install postgresql postgresql-contrib" -ForegroundColor Gray
        Write-Host "   • macOS: brew install postgresql" -ForegroundColor Gray
        exit 1
    }

    # Verificar Redis
    Write-Host "📦 Verificando Redis..." -ForegroundColor Yellow
    try {
        $redisVer = redis-server --version 2>&1
        Write-Host "   Redis encontrado: $redisVer" -ForegroundColor Green
    } catch {
        Write-Host "❌ Redis não encontrado!" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Instale Redis manualmente:" -ForegroundColor Gray
        Write-Host "   • Windows: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Gray
        Write-Host "   • Chocolatey: choco install redis-64" -ForegroundColor Gray
        Write-Host "   • Linux: sudo apt install redis-server" -ForegroundColor Gray
        Write-Host "   • macOS: brew install redis" -ForegroundColor Gray
        exit 1
    }

    # Iniciar serviços
    Write-Host ""
    Write-Host "🔹 Iniciando PostgreSQL..." -ForegroundColor Yellow
    try {
        $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($pgService) {
            Start-Service -InputObject $pgService -ErrorAction Stop
            Start-Sleep -Seconds 2
            Write-Host "   ✅ PostgreSQL iniciado" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Serviço PostgreSQL não encontrado. Inicie manualmente:" -ForegroundColor Yellow
            Write-Host "     1. Verifique se PostgreSQL está instalado" -ForegroundColor Gray
            Write-Host "     2. Execute: Start-Service postgresql" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ⚠️  Erro ao iniciar PostgreSQL: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "      Execute manualmente: Start-Service postgresql" -ForegroundColor Gray
    }

    Write-Host "🔹 Iniciando Redis..." -ForegroundColor Yellow
    try {
        $redisService = Get-Service -Name "Redis*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($redisService) {
            Start-Service -InputObject $redisService -ErrorAction Stop
            Start-Sleep -Seconds 1
            Write-Host "   ✅ Redis iniciado" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Serviço Redis não encontrado. Inicie manualmente:" -ForegroundColor Yellow
            Write-Host "     1. Verifique se Redis está instalado" -ForegroundColor Gray
            Write-Host "     2. Execute: Start-Service Redis" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ⚠️  Erro ao iniciar Redis: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "      Execute manualmente: Start-Service Redis" -ForegroundColor Gray
    }

    # Aguardar serviços
    Write-Host ""
    Write-Host "⏳ Aguardando serviços ficarem prontos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

# Configurar banco de dados
Write-Host ""
Write-Host "🗄️  Configurando PostgreSQL..." -ForegroundColor Cyan

try {
    $null = psql -U postgres -c "CREATE DATABASE erpcoz;" 2>$null
    Write-Host "   ✅ Banco 'erpcoz' criado/verificado" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -notlike "*already exists*") {
        Write-Host "   ⚠️  $errorMsg" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Banco 'erpcoz' já existe" -ForegroundColor Green
    }
}

try {
    psql -U postgres -c "CREATE USER erpcoz WITH PASSWORD 'erpcozpass';" 2>$null
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE erpcoz TO erpcoz;" 2>$null
    Write-Host "   ✅ Usuário 'erpcoz' configurado" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -notlike "*already exists*") {
        Write-Host "   ⚠️  $errorMsg" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Usuário 'erpcoz' já existe" -ForegroundColor Green
    }
}

# Instalar dependências
Write-Host ""
Write-Host "📦 Instalando dependências Node.js..." -ForegroundColor Cyan

if (-not (Test-Path "node_modules") -or $Force) {
    Write-Host "   npm install (raiz)..." -ForegroundColor Gray
    npm install
}

if (-not (Test-Path "apps/backend/node_modules") -or $Force) {
    Write-Host "   npm install (backend)..." -ForegroundColor Gray
    Push-Location apps/backend
    npm install
    Pop-Location
}

if (-not (Test-Path "apps/frontend/node_modules") -or $Force) {
    Write-Host "   npm install (frontend)..." -ForegroundColor Gray
    Push-Location apps/frontend
    npm install
    Pop-Location
}

Write-Host "   ✅ Dependências instaladas" -ForegroundColor Green

# Prisma
Write-Host ""
Write-Host "🔄 Executando Prisma migrate deploy..." -ForegroundColor Cyan
Push-Location apps/backend
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no migrate deploy" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "   ✅ Migrations aplicadas" -ForegroundColor Green

Write-Host "🌱 Executando seed..." -ForegroundColor Cyan
npx prisma seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Seed falhou (pode ser opcional)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Seed executado" -ForegroundColor Green
}
Pop-Location

Write-Host ""
Write-Host "✅ Instalação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Para iniciar a aplicação:" -ForegroundColor Cyan
Write-Host "   .\start-dev.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Ou manualmente em terminais separados:" -ForegroundColor Gray
Write-Host "   Terminal 1: cd apps/backend; npm run dev" -ForegroundColor Gray
Write-Host "   Terminal 2: cd apps/frontend; npm run dev -- --host" -ForegroundColor Gray
Write-Host ""
