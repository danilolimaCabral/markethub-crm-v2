#!/bin/bash

# Script para executar migrations no PostgreSQL do Railway
# Autor: Manus AI
# Data: 11/11/2025

echo "🚀 Iniciando execução das migrations..."
echo "📊 Banco de dados: $DATABASE_URL"
echo ""

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERRO: DATABASE_URL não está configurada!"
    exit 1
fi

# Diretório dos scripts SQL
SQL_DIR="$(dirname "$0")/../database"

# Lista de arquivos SQL em ordem
SQL_FILES=(
    "01_create_tables.sql"
    "02_triggers_functions.sql"
    "03_views.sql"
    "04_seed_data.sql"
    "05_modulo_cmv.sql"
    "06_multi_tenant.sql"
    "07_clientes_master.sql"
    "08_pedidos.sql"
    "09_produtos.sql"
)

# Contador de sucesso
SUCCESS_COUNT=0
TOTAL_COUNT=${#SQL_FILES[@]}

# Executar cada arquivo SQL
for SQL_FILE in "${SQL_FILES[@]}"; do
    echo "📝 Executando: $SQL_FILE"
    
    if psql "$DATABASE_URL" -f "$SQL_DIR/$SQL_FILE" 2>&1; then
        echo "✅ $SQL_FILE executado com sucesso!"
        ((SUCCESS_COUNT++))
    else
        echo "❌ Erro ao executar $SQL_FILE"
        echo "⚠️  Continuando com próximo arquivo..."
    fi
    
    echo ""
done

# Resumo final
echo "================================================"
echo "📊 Resumo da Execução:"
echo "   Total de arquivos: $TOTAL_COUNT"
echo "   Executados com sucesso: $SUCCESS_COUNT"
echo "   Falhas: $((TOTAL_COUNT - SUCCESS_COUNT))"
echo "================================================"

if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
    echo "🎉 Todas as migrations foram executadas com sucesso!"
    exit 0
else
    echo "⚠️  Algumas migrations falharam. Verifique os logs acima."
    exit 1
fi
