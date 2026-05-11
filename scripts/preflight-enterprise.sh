#!/usr/bin/env bash
set -euo pipefail

echo "==> Preflight enterprise"

missing=0

check_cmd() {
  local c="$1"
  if ! command -v "$c" >/dev/null 2>&1; then
    echo "❌ Dependência ausente: $c"
    missing=1
  else
    echo "✅ $c encontrado"
  fi
}

check_cmd node
check_cmd npm
check_cmd curl

if command -v docker >/dev/null 2>&1; then
  echo "✅ docker encontrado (modo compose habilitado)"
else
  echo "⚠️ docker não encontrado (modo local será usado)"
fi

if [[ -z "${JWT_SECRET:-}" ]]; then
  echo "⚠️ JWT_SECRET não definido no ambiente shell atual."
fi

if [[ $missing -eq 1 ]]; then
  echo "Preflight falhou: instale dependências obrigatórias."
  exit 1
fi

echo "✅ Preflight concluído."
