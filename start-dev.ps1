Write-Host "🚀 ERPCOZERP - Development Mode (Backend + Frontend)" -ForegroundColor Cyan
Write-Host ""

# Verificar se PostgreSQL e Redis estão acessíveis
try {
    $pgTest = psql -h localhost -p 5432 -U erpcoz -d erpcoz -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ PostgreSQL não acessível. Verifique:" -ForegroundColor Red
        Write-Host "   1. PostgreSQL está instalado?" -ForegroundColor Gray
        Write-Host "   2. Serviço está rodando?" -ForegroundColor Gray
        Write-Host "   3. Banco 'erpcoz' existe? (rode: createdb -U postgres erpcoz)" -ForegroundColor Gray
        exit 1
    }
    Write-Host "✅ PostgreSQL conectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao conectar ao PostgreSQL: $_" -ForegroundColor Red
    exit 1
}

try {
    $redisTest = redis-cli ping 2>&1
    if ($redisTest -notlike "PONG*") {
        Write-Host "❌ Redis não acessível. Verifique:" -ForegroundColor Red
        Write-Host "   1. Redis está instalado?" -ForegroundColor Gray
        Write-Host "   2. Serviço está rodando? (redis-server)" -ForegroundColor Gray
        exit 1
    }
    Write-Host "✅ Redis conectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao conectar ao Redis: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Verificando dependências..." -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependências da raiz..."
    npm install
}

if (-not (Test-Path "apps/backend/node_modules")) {
    Write-Host "Instalando dependências do backend..."
    Set-Location apps/backend
    npm install
    Set-Location ../..
}

if (-not (Test-Path "apps/frontend/node_modules")) {
    Write-Host "Instalando dependências do frontend..."
    Set-Location apps/frontend
    npm install
    Set-Location ../..
}

Write-Host ""
Write-Host "⏳ Aplicando migrations (se houver novas)..." -ForegroundColor Cyan
Set-Location apps/backend
npx prisma migrate deploy
Set-Location ../..

Write-Host ""
Write-Host "🎯 Iniciando serviços (concurrently)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Pressione Ctrl+C para parar." -ForegroundColor Gray
Write-Host ""

npm run dev
