#!/bin/sh
set -e

echo "============================================================"
echo "🚀 INICIANDO MARKETHUB CRM"
echo "============================================================"
echo ""

# Executar migrations
echo "📦 Executando migrations do banco de dados..."
node scripts/migrate.js

# Verificar se migrations foram bem-sucedidas
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations concluídas com sucesso!"
    echo ""
else
    echo ""
    echo "❌ Erro ao executar migrations!"
    echo ""
    exit 1
fi

# Iniciar servidor
echo "🚀 Iniciando servidor..."
echo ""
exec node dist/index.js
