#!/bin/sh
set -e

echo "============================================================"
echo "🐳 DOCKER ENTRYPOINT - MARKETHUB CRM"
echo "============================================================"
echo ""
echo "📋 Informações do Container:"
echo "   - User: $(whoami)"
echo "   - UID: $(id -u)"
echo "   - GID: $(id -g)"
echo "   - Working Dir: $(pwd)"
echo "   - Node Version: $(node --version)"
echo "   - NPM Version: $(npm --version)"
echo ""
echo "📂 Verificando arquivos:"
echo "   - dist/index.js: $([ -f dist/index.js ] && echo '✅ Existe' || echo '❌ Não encontrado')"
echo "   - package.json: $([ -f package.json ] && echo '✅ Existe' || echo '❌ Não encontrado')"
echo "   - node_modules: $([ -d node_modules ] && echo '✅ Existe' || echo '❌ Não encontrado')"
echo ""
echo "🔍 Listando arquivos em /app:"
ls -la /app/ | head -20
echo ""
echo "🔍 Listando arquivos em /app/dist:"
ls -la /app/dist/ 2>/dev/null || echo "❌ Diretório dist/ não encontrado"
echo ""
echo "🌍 Variáveis de Ambiente:"
echo "   - NODE_ENV: ${NODE_ENV:-not set}"
echo "   - PORT: ${PORT:-not set}"
echo "   - DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo '✅ Configurado' || echo '❌ Não configurado')"
echo ""
echo "============================================================"
echo "🚀 INICIANDO APLICAÇÃO NODE.JS"
echo "============================================================"
echo ""

# Executar o servidor
exec node dist/index.js
