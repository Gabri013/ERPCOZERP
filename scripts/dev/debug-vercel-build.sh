#!/bin/bash

# Diagnóstico de build do frontend para Vercel

echo "🔍 Verificando estrutura do projeto..."
echo ""

# 1. Verifica arquivos essenciais
echo "📁 Arquivos necessários:"
for file in package.json vite.config.js index.html vercel.json; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - FALTA"
  fi
done

echo ""
echo "📁 Pasta src:"
if [ -d "src" ]; then
  echo "  ✅ src/ existe"
  echo "  📄 Arquivos principais:"
  ls src/*.jsx src/*.js 2>/dev/null | head -5
else
  echo "  ❌ src/ não encontrada"
fi

echo ""
echo "📦 Dependências:"
if [ -d "node_modules" ]; then
  echo "  ✅ node_modules instalado"
else
  echo "  ⚠️  node_modules não encontrado — rode npm ci"
fi

echo ""
echo "🔨 Testando build local..."
npm run build 2>&1 | head -20

echo ""
echo "📂 Conteúdo de dist/ após build:"
if [ -d "dist" ]; then
  ls -la dist/
  echo ""
  echo "📄 index.html existe? $(if [ -f dist/index.html ]; then echo '✅'; else echo '❌'; fi)"
else
  echo "  ❌ Pasta dist/ não existe"
fi

echo ""
echo "🌐 Para deploy na Vercel:"
echo "  1. vercel login"
echo "  2. vercel --prod"
echo ""
echo "📋 Ou crie projeto no dashboard.vercel.com:"
echo "   - Root: ."
echo "   - Build: npm run build"
echo "   - Output: dist"
