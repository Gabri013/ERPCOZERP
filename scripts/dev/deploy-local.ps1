param(
    [int]$Port = 4173,
    [string]$HostName = "127.0.0.1",
    [switch]$SkipInstall,
    [switch]$NoClean
)

$ErrorActionPreference = "Stop"

function Fail($Message) {
    Write-Host "[ERRO] $Message" -ForegroundColor Red
    exit 1
}

function Step($Message) {
    Write-Host "[PASSO] $Message" -ForegroundColor Cyan
}

function Ok($Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

Step "Validando ferramentas (node e npm)"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail "Node.js nao encontrado no PATH. Instale Node 18+ e tente novamente."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Fail "npm nao encontrado no PATH."
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path "package.json")) {
    Fail "package.json nao encontrado na raiz: $root"
}

if (-not $NoClean) {
    Step "Limpando dist antigo"
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
    }
    Ok "Limpeza concluida"
}

if (-not $SkipInstall) {
    Step "Instalando dependencias com npm ci"
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Fail "npm ci falhou"
    }
    Ok "Dependencias instaladas"
} else {
    Step "Pulando instalacao de dependencias (-SkipInstall)"
}

Step "Gerando build de producao"
npm run build
if ($LASTEXITCODE -ne 0) {
    Fail "Build falhou"
}

if (-not (Test-Path "dist/index.html")) {
    Fail "Build terminou mas dist/index.html nao foi encontrado"
}
Ok "Build gerado em dist/"

$url = "http://$HostName`:$Port"
Write-Host ""
Write-Host "Deploy local pronto para teste." -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Yellow
Write-Host "Pressione Ctrl+C para encerrar o servidor." -ForegroundColor Yellow
Write-Host ""

Step "Subindo preview de producao"
npm run preview -- --host $HostName --port $Port
