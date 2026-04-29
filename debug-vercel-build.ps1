# Diagnóstico de build do frontend para Vercel (Windows PowerShell)

Write-Host "🔍 Verificando estrutura do projeto..." -ForegroundColor Cyan

# 1. Arquivos essenciais
Write-Host "`n📁 Arquivos necessários:" -ForegroundColor Yellow
$files = @("package.json", "vite.config.js", "index.html", "vercel.json")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - FALTA" -ForegroundColor Red
    }
}

# 2. Pasta src
Write-Host "`n📁 Pasta src:" -ForegroundColor Yellow
if (Test-Path "src") {
    Write-Host "  ✅ src/ existe" -ForegroundColor Green
    Write-Host "  📄 Arquivos principais:" -ForegroundColor Cyan
    Get-ChildItem src/*.jsx, src/*.js 2>$null | Select-Object -First 5 | ForEach-Object { Write-Host "    $($_.Name)" }
} else {
    Write-Host "  ❌ src/ não encontrada" -ForegroundColor Red
}

# 3. Node modules
Write-Host "`n📦 Dependências:" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ✅ node_modules instalado" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  node_modules não encontrado — rode npm ci" -ForegroundColor Yellow
}

# 4. Testa build
Write-Host "`n🔨 Testando build local..." -ForegroundColor Cyan
npm run build 2>&1 | Select-Object -First 20

# 5. Verifica dist
Write-Host "`n📂 Conteúdo de dist/ após build:" -ForegroundColor Yellow
if (Test-Path "dist") {
    Get-ChildItem dist/ | Format-Table Name, Length
    $indexExists = Test-Path "dist/index.html"
    if ($indexExists) {
        Write-Host "  ✅ index.html existe" -ForegroundColor Green
    } else {
        Write-Host "  ❌ index.html NÃO encontrado em dist/" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Pasta dist/ não existe" -ForegroundColor Red
}

Write-Host "`n🌐 Comandos para deploy na Vercel:" -ForegroundColor Cyan
Write-Host "  1. vercel login" -ForegroundColor White
Write-Host " 2. vercel --prod" -ForegroundColor White
Write-Host ""
Write-Host "📋 Ou crie projeto no dashboard.vercel.com:" -ForegroundColor Cyan
Write-Host "   - Root: ." -ForegroundColor White
Write-Host "   - Build: npm run build" -ForegroundColor White
Write-Host "   - Output: dist" -ForegroundColor White

Write-Host "`n✅ Diagnóstico completo!" -ForegroundColor Green
