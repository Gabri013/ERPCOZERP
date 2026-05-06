#!/bin/bash
set -e

echo "🔧 Configurando ERPCOZERP..."

npm install
npm install --prefix apps/frontend
npm install --prefix apps/backend

cd apps/backend
npx prisma migrate dev --name init || true
cd ../..

echo "✅ Setup concluído. Rode: npm run dev"
