#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> [1/7] Subindo stack Docker (Postgres/Redis/API/Frontend)"
if command -v docker >/dev/null 2>&1; then
  docker compose up -d --build
else
  echo "⚠️  Docker não encontrado. Executando modo local (sem compose)."
  echo "    Pré-requisitos: API em http://127.0.0.1:3001 e frontend configurado."
fi

echo "==> [2/7] Aguardando API responder /health"
for i in {1..60}; do
  if curl -fsS "http://127.0.0.1:3001/health" >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "ERRO: API não ficou saudável em até 120s"
    if command -v docker >/dev/null 2>&1; then
      docker compose logs backend --tail=200 || true
    fi
    exit 1
  fi
  sleep 2
done

echo "==> [3/7] Seed de dados de produção de teste"
if command -v docker >/dev/null 2>&1; then
  docker compose run --rm -e SEED_ENABLED=true backend npm run prisma:seed
else
  npm run prisma:seed --prefix apps/backend
fi

echo "==> [4/7] Smoke test de API"
BACKEND_URL="http://127.0.0.1:3001" npm run test:smoke:core

echo "==> [5/7] Testes unitários backend"
npm run test:unit --prefix apps/backend

echo "==> [6/7] Build de produção frontend + backend"
npm run build

echo "==> [7/7] E2E de autenticação e navegação crítica"
npx playwright test tests/e2e/auth tests/e2e/navigation --project="Desktop Chrome"

echo "✅ Teste de produção completo finalizado com sucesso."
