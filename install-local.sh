#!/bin/bash
set -e

echo "🚀 ERPCOZERP - Instalação Local (Linux/macOS)" -e "\n"

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não encontrado!"
    echo "   Instale:"
    echo "   • Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "   • macOS: brew install postgresql"
    exit 1
fi
echo "✅ PostgreSQL encontrado"

# Verificar Redis
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis não encontrado!"
    echo "   Instale:"
    echo "   • Ubuntu/Debian: sudo apt install redis-server"
    echo "   • macOS: brew install redis"
    exit 1
fi
echo "✅ Redis encontrado"

# Iniciar serviços (se não estiverem rodando)
echo ""
echo "🔹 Iniciando PostgreSQL..."
sudo service postgresql start 2>/dev/null || brew services start postgresql 2>/dev/null || true
sleep 2

echo "🔹 Iniciando Redis..."
sudo service redis-server start 2>/dev/null || brew services start redis 2>/dev/null || true
sleep 1

# Configurar banco
echo ""
echo "🗄️  Configurando PostgreSQL..."
su - postgres -c "psql -c \"CREATE DATABASE erpcoz;\"" 2>/dev/null || echo "   ⚠️  Banco pode já existir"
su - postgres -c "psql -c \"CREATE USER erpcoz WITH PASSWORD 'erpcozpass';\"" 2>/dev/null || echo "   ⚠️  Usuário pode já existir"
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE erpcoz TO erpcoz;\"" 2>/dev/null || true
echo "✅ Banco configurado"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install
cd apps/backend && npm install && cd ../..
cd apps/frontend && npm install && cd ../..

# Prisma
echo ""
echo "🔄 Executando Prisma migrate deploy..."
cd apps/backend
npx prisma migrate deploy
npx prisma seed || echo "⚠️  Seed falhou (opcional)"
cd ../..

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "🚀 Para iniciar:" -e "\n"
echo "   ./start-dev.sh"
echo ""
echo "Ou manualmente:" -e "\n"
echo "   Terminal 1: cd apps/backend && npm run dev"
echo "   Terminal 2: cd apps/frontend && npm run dev -- --host"
echo ""
