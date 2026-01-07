#!/bin/bash

# ============================================================================
# Script de Validação de Ambiente - MarketHub CRM v2
# ============================================================================
# 
# Este script valida todas as configurações necessárias para o funcionamento
# correto do sistema, incluindo:
# - Variáveis de ambiente
# - Conexão com banco de dados
# - Credenciais de integração
# - Estrutura do banco de dados
#
# Autor: Manus AI
# Data: 2026-01-06
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contadores
ERRORS=0
WARNINGS=0
SUCCESS=0

# Funções de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((SUCCESS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

echo ""
echo "============================================================"
echo "🔍 VALIDAÇÃO DE AMBIENTE - MARKETHUB CRM V2"
echo "============================================================"
echo ""

# ============================================================================
# 1. VALIDAR VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS
# ============================================================================

log_info "Validando variáveis de ambiente obrigatórias..."

# Database
if [ -n "$DATABASE_URL" ]; then
    log_success "DATABASE_URL configurado"
else
    log_error "DATABASE_URL não configurado"
fi

# JWT
if [ -n "$JWT_SECRET" ]; then
    if [ ${#JWT_SECRET} -ge 32 ]; then
        log_success "JWT_SECRET configurado (${#JWT_SECRET} caracteres)"
    else
        log_warning "JWT_SECRET muito curto (${#JWT_SECRET} caracteres, recomendado: 32+)"
    fi
else
    log_error "JWT_SECRET não configurado"
fi

if [ -n "$JWT_REFRESH_SECRET" ]; then
    if [ ${#JWT_REFRESH_SECRET} -ge 32 ]; then
        log_success "JWT_REFRESH_SECRET configurado (${#JWT_REFRESH_SECRET} caracteres)"
    else
        log_warning "JWT_REFRESH_SECRET muito curto (${#JWT_REFRESH_SECRET} caracteres)"
    fi
else
    log_error "JWT_REFRESH_SECRET não configurado"
fi

# Encryption
if [ -n "$ENCRYPTION_KEY" ]; then
    if [ ${#ENCRYPTION_KEY} -ge 32 ]; then
        log_success "ENCRYPTION_KEY configurado (${#ENCRYPTION_KEY} caracteres)"
        if [ "$ENCRYPTION_KEY" = "default-key-32-chars-long!!!!!!" ]; then
            log_warning "ENCRYPTION_KEY usando valor padrão (INSEGURO em produção)"
        fi
    else
        log_error "ENCRYPTION_KEY muito curto (${#ENCRYPTION_KEY} caracteres, mínimo: 32)"
    fi
else
    log_error "ENCRYPTION_KEY não configurado"
fi

# Session
if [ -n "$SESSION_SECRET" ]; then
    log_success "SESSION_SECRET configurado"
else
    log_warning "SESSION_SECRET não configurado (recomendado)"
fi

# Node Environment
if [ -n "$NODE_ENV" ]; then
    log_success "NODE_ENV configurado ($NODE_ENV)"
else
    log_warning "NODE_ENV não configurado (padrão: development)"
fi

# ============================================================================
# 2. VALIDAR CREDENCIAIS DE INTEGRAÇÃO (OPCIONAL MAS RECOMENDADO)
# ============================================================================

echo ""
log_info "Validando credenciais de integração..."

# Mercado Livre
if [ -n "$ML_CLIENT_ID" ] && [ -n "$ML_CLIENT_SECRET" ]; then
    log_success "Credenciais do Mercado Livre configuradas"
    if [ -n "$ML_REDIRECT_URI" ]; then
        log_success "ML_REDIRECT_URI configurado"
    else
        log_warning "ML_REDIRECT_URI não configurado"
    fi
else
    log_warning "Credenciais do Mercado Livre não configuradas (opcional)"
fi

# Amazon
if [ -n "$AMAZON_CLIENT_ID" ] && [ -n "$AMAZON_CLIENT_SECRET" ]; then
    log_success "Credenciais da Amazon configuradas"
else
    log_info "Credenciais da Amazon não configuradas (opcional)"
fi

# Shopee
if [ -n "$SHOPEE_CLIENT_ID" ] && [ -n "$SHOPEE_CLIENT_SECRET" ]; then
    log_success "Credenciais da Shopee configuradas"
else
    log_info "Credenciais da Shopee não configuradas (opcional)"
fi

# ============================================================================
# 3. VALIDAR CONEXÃO COM BANCO DE DADOS
# ============================================================================

echo ""
log_info "Validando conexão com banco de dados..."

if [ -z "$DATABASE_URL" ]; then
    log_error "Não é possível testar conexão: DATABASE_URL não configurado"
else
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            log_success "Conexão com banco de dados estabelecida"
            
            # Verificar se tabelas principais existem
            log_info "Verificando estrutura do banco..."
            
            TABLES=("users" "tenants" "mercadolivre_integrations" "marketplace_credentials")
            
            for table in "${TABLES[@]}"; do
                if psql "$DATABASE_URL" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
                    log_success "Tabela '$table' existe"
                else
                    log_warning "Tabela '$table' não existe ou está vazia"
                fi
            done
            
        else
            log_error "Não foi possível conectar ao banco de dados"
            log_info "Verifique se o banco está online e as credenciais estão corretas"
        fi
    else
        log_warning "psql não instalado - não é possível testar conexão"
        log_info "Instale com: sudo apt-get install postgresql-client"
    fi
fi

# ============================================================================
# 4. VALIDAR TIPOS DE COLUNAS (SE CONECTADO)
# ============================================================================

if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo ""
        log_info "Validando tipos de colunas..."
        
        # Verificar se marketplace_credentials tem tipos corretos
        USER_ID_TYPE=$(psql "$DATABASE_URL" -t -c "
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'marketplace_credentials' AND column_name = 'user_id';
        " 2>/dev/null | xargs)
        
        if [ "$USER_ID_TYPE" = "uuid" ]; then
            log_success "marketplace_credentials.user_id tem tipo correto (UUID)"
        elif [ -n "$USER_ID_TYPE" ]; then
            log_error "marketplace_credentials.user_id tem tipo incorreto ($USER_ID_TYPE, esperado: UUID)"
            log_info "Execute: ./scripts/fix-database-complete.sh"
        else
            log_warning "Não foi possível verificar tipo de marketplace_credentials.user_id"
        fi
    fi
fi

# ============================================================================
# 5. RESUMO FINAL
# ============================================================================

echo ""
echo "============================================================"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "============================================================"
echo ""
echo -e "${GREEN}✅ Sucesso: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARNINGS${NC}"
echo -e "${RED}❌ Erros: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 Ambiente totalmente configurado e pronto para uso!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Ambiente configurado com alguns avisos. Revise os itens acima.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Ambiente com erros críticos. Corrija os problemas antes de continuar.${NC}"
    echo ""
    echo "Ações recomendadas:"
    echo "  1. Configure as variáveis de ambiente faltantes"
    echo "  2. Execute: ./scripts/fix-database-complete.sh"
    echo "  3. Execute este script novamente para validar"
    echo ""
    exit 1
fi
