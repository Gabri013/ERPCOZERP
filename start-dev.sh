#!/bin/bash

echo "🚀 ERPCOZERP - Development Mode" -e "\n"

# Verificar conexões
if ! psql -h localhost -p 5432 -U erpcoz -d erpcoz -c "SELECT 1;" &>/dev/null; then
    echo "❌ PostgreSQL não acessível"
    echo "   Verifique: sudo service postgresql start"
    exit 1
fi
echo "✅ PostgreSQL conectado"

if ! redis-cli ping | grep -q "PONG"; then
    echo "❌ Redis não acessível"
    echo "   Verifique: sudo service redis-server start"
    exit 1
fi
echo "✅ Redis conectado"

echo ""
echo "🎯 Iniciando serviços..." -e "\n"

# Verificar se concurrently está instalado
if command -v concurrently &>/dev/null; then -n " concurrently "cd apps/backend && npm run dev" "cd apps/frontend && npm run dev -- --host"
else
    echo "Instalando concurrently..."
    npm install -g concurrently
    echo ""
fi

concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "green.bold,blue.bold" \
  "cd apps/backend && npm run dev" \
  "cd apps/frontend && npm run dev -- --host"
