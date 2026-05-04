#!/usrhellpw

Write-Host "🚀 ERPCOZERP - Inicialização Local (PostgreSQL + Redis + Node)" -ForegroundColor Cyan
Write-Host ""

# Verificar se PostgreSQL está instalado e rodando
try {
    $pgStatus = pg_isready -h localhost -p 5432 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  PostgreSQL não está rodando. Tentando iniciar..." -ForegroundColor Yellow
        # Tentar iniciar serviço do PostgreSQL (Windows)
        Start-Service -Name "postgresql*" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        $pgStatus = pg_isready -h localhost -p 5432 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ PostgreSQL não está rodando. Instale PostgreSQL ou inicie o serviço manualmente." -ForegroundColor Red
            Write-Host "   Download: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
            exit 1
        }
    }
    Write-Host "✅ PostgreSQL: $pgStatus" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL não encontrado. Instale PostgreSQL primeiro." -ForegroundColor Red
    Write-Host "   Download: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    exit 1
}

# Verificar se Redis está instalado e rodando
try {
    $redisPing = redis-cli ping 2>&1
    if ($redisPing -notlike "PONG*") {
        Write-Host "⚠️  Redis não está rodando. Tentando iniciar..." -ForegroundColor Yellow
        # Tentar iniciar serviço do Redis (Windows)
        Start-Service -Name "Redis" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        $redisPing = redis-cli ping 2>&1
        if ($redisPing -notlike "PONG*") {
            Write-Host "❌ Redis não está rodando. Instale Redis ou inicie o serviço manualmente." -ForegroundColor Red
            Write-Host "   Download: https://github.com/microsoftarchive/redis/releases (ou use chocolatey: choco install redis-64)" -ForegroundColor Gray
            exit 1
        }
    }
    Write-Host "✅ Redis: PONG" -ForegroundColor Green
} catch {
    Write-Host "❌ Redis não encontrado. Instale Redis primeiro." -ForegroundColor Red
    Write-Host "   Download: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
npm install
cd apps/backend
npm install
cd ../frontend
npm install
cd ..

Write-Host ""
Write-Host "🗄️  Configurando banco de dados..." -ForegroundColor Cyan

# Criar banco de dados se não existir
try {
    psql -U postgres -c "CREATE DATABASE erpcoz;" 2>&1 | Out-Null
    Write-Host "✅ Banco 'erpcoz' criado/verificado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Banco pode já existir ou erro ao criar: $_" -ForegroundColor Yellow
}

# Criar usuário se não existir
try {
    psql -U postgres -c "CREATE USER erpcoz WITH PASSWORD 'erpcozpass';" 2>&1 | Out-Null
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE erpcoz TO erpcoz;" 2>&1 | Out-Null
    Write-Host "✅ Usuário 'erpcoz' configurado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Usuário pode já existir: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Executando migrations do Prisma..." -ForegroundColor Cyan
cd apps/backend
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao executar migrations" -ForegroundColor Red
    exit 1
}

Write-Host "🌱 Executando seed..." -ForegroundColor Cyan
npx prisma seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Erro ao executar seed (pode ser opcional)" -ForegroundColor Yellow
}
cd ../..

Write-Host ""
Write-Host "🎉 Tudo pronto! Iniciando aplicação..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Pressione Ctrl+C para parar todos os serviços." -ForegroundColor Gray
Write-Host ""

# Iniciar backend e frontend em paralelo
$backendJob = Start-Job -ScriptBlock {
    cd "$using:pwd\apps\backend"
    npm run dev
}

$frontendJob = Start-Job -ScriptBlock {
    cd "$using:pwd\apps\frontend"
    npm run dev -- --host
}

# Aguardar e mostrar logs
Wait-Job $backendJob, $frontendJob
