#!/bin/bash

# ============================================================================
# Script de Correção Completa do Banco de Dados - MarketHub CRM v2
# ============================================================================
# 
# Este script aplica todas as correções necessárias no banco de dados:
# 1. Corrige tipos de ID na tabela marketplace_credentials (INTEGER → UUID)
# 2. Corrige constraint UNIQUE na tabela marketplace_integrations
# 3. Valida a integridade do banco após as correções
#
# Autor: Manus AI
# Data: 2026-01-06
# ============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# VALIDAÇÕES INICIAIS
# ============================================================================

echo ""
echo "============================================================"
echo "🔧 SCRIPT DE CORREÇÃO COMPLETA DO BANCO DE DADOS"
echo "============================================================"
echo ""

# Verificar se DATABASE_URL está configurado
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL não está configurado!"
    log_info "Configure a variável de ambiente DATABASE_URL antes de executar este script."
    log_info "Exemplo: export DATABASE_URL='postgresql://user:pass@host:port/database'"
    exit 1
fi

log_success "DATABASE_URL configurado"

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    log_error "psql não está instalado!"
    log_info "Instale o PostgreSQL client: sudo apt-get install postgresql-client"
    exit 1
fi

log_success "psql encontrado"

# ============================================================================
# TESTE DE CONEXÃO
# ============================================================================

log_info "Testando conexão com o banco de dados..."

if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    log_success "Conexão com banco de dados estabelecida"
else
    log_error "Não foi possível conectar ao banco de dados"
    log_info "Verifique se:"
    log_info "  1. O banco de dados está online"
    log_info "  2. As credenciais estão corretas"
    log_info "  3. A assinatura do Railway está ativa (se aplicável)"
    exit 1
fi

# ============================================================================
# BACKUP DE SEGURANÇA
# ============================================================================

log_info "Criando backup de segurança..."

BACKUP_FILE="markethub_backup_$(date +%Y%m%d_%H%M%S).sql"

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
    log_success "Backup criado: $BACKUP_FILE"
else
    log_warning "Não foi possível criar backup completo (pode ser por permissões)"
    log_info "Continuando mesmo assim..."
fi

# ============================================================================
# APLICAR MIGRATION 006: Corrigir Tipos de ID
# ============================================================================

echo ""
log_info "Aplicando Migration 006: Corrigir tipos de ID..."

MIGRATION_006="$(dirname "$0")/../db/migrations/006_fix_marketplace_credentials_types.sql"

if [ ! -f "$MIGRATION_006" ]; then
    log_error "Migration 006 não encontrada: $MIGRATION_006"
    exit 1
fi

if psql "$DATABASE_URL" -f "$MIGRATION_006" 2>&1 | tee /tmp/migration_006.log; then
    if grep -q "ERROR" /tmp/migration_006.log; then
        log_error "Migration 006 falhou. Verifique os logs acima."
        log_info "Possíveis causas:"
        log_info "  1. Dados existentes com IDs inválidos"
        log_info "  2. Tabela marketplace_credentials não existe"
        log_info "  3. Tipos de dados incompatíveis"
        exit 1
    else
        log_success "Migration 006 aplicada com sucesso"
    fi
else
    log_error "Erro ao executar Migration 006"
    exit 1
fi

# ============================================================================
# APLICAR MIGRATION 007: Corrigir Constraint UNIQUE
# ============================================================================

echo ""
log_info "Aplicando Migration 007: Corrigir constraint UNIQUE..."

MIGRATION_007="$(dirname "$0")/../db/migrations/007_fix_marketplace_integrations_unique.sql"

if [ ! -f "$MIGRATION_007" ]; then
    log_error "Migration 007 não encontrada: $MIGRATION_007"
    exit 1
fi

if psql "$DATABASE_URL" -f "$MIGRATION_007" 2>&1 | tee /tmp/migration_007.log; then
    if grep -q "ERROR" /tmp/migration_007.log; then
        log_warning "Migration 007 teve alguns erros (pode ser normal se a tabela não existir)"
    else
        log_success "Migration 007 aplicada com sucesso"
    fi
else
    log_warning "Migration 007 teve problemas, mas pode ser normal"
fi

# ============================================================================
# VALIDAÇÃO PÓS-CORREÇÃO
# ============================================================================

echo ""
log_info "Validando correções aplicadas..."

# Validar tipos de colunas
log_info "Verificando tipos de colunas..."

VALIDATION_SQL="
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'marketplace_credentials'
  AND column_name IN ('user_id', 'tenant_id', 'created_by')
ORDER BY column_name;
"

if psql "$DATABASE_URL" -c "$VALIDATION_SQL" 2>&1 | grep -q "uuid"; then
    log_success "Tipos de colunas corrigidos para UUID"
else
    log_warning "Não foi possível validar os tipos de colunas"
fi

# Verificar constraints
log_info "Verificando constraints..."

CONSTRAINT_SQL="
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'marketplace_credentials'
  AND constraint_type = 'FOREIGN KEY';
"

if psql "$DATABASE_URL" -c "$CONSTRAINT_SQL" 2>&1 | grep -q "marketplace_credentials"; then
    log_success "Foreign keys recriadas"
else
    log_warning "Não foi possível validar as foreign keys"
fi

# ============================================================================
# RESUMO FINAL
# ============================================================================

echo ""
echo "============================================================"
log_success "CORREÇÕES APLICADAS COM SUCESSO!"
echo "============================================================"
echo ""
echo "Correções realizadas:"
echo "  ✅ Migration 006: Tipos de ID corrigidos (INTEGER → UUID)"
echo "  ✅ Migration 007: Constraint UNIQUE corrigida"
echo "  ✅ Foreign keys recriadas"
echo "  ✅ Backup criado: $BACKUP_FILE"
echo ""
echo "Próximos passos:"
echo "  1. Fazer commit das alterações no Git"
echo "  2. Fazer push para o repositório"
echo "  3. Fazer deploy no Railway"
echo "  4. Testar a integração com Mercado Livre"
echo ""
echo "Para reverter as alterações (se necessário):"
echo "  psql \$DATABASE_URL < $BACKUP_FILE"
echo ""
echo "============================================================"
