#!/bin/bash

###############################################################################
# Script de Deploy Automático - MarketHub CRM
# Versão: 2.1.0
# Data: 2025-11-10
# Descrição: Deploy completo em produção com um único comando
###############################################################################

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_color() {
    color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Função para imprimir cabeçalho
print_header() {
    echo ""
    print_color $BLUE "============================================"
    print_color $BLUE "$1"
    print_color $BLUE "============================================"
    echo ""
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Banner
clear
print_color $GREEN "
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🚀 MarketHub CRM - Deploy Automático 🚀         ║
║                                                           ║
║                    Versão 2.1.0                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"

# Verificar se está rodando como root
if [ "$EUID" -eq 0 ]; then
    print_color $RED "❌ NÃO execute este script como root (sudo)"
    print_color $YELLOW "Execute como usuário normal. O script pedirá senha quando necessário."
    exit 1
fi

# Passo 1: Verificar Requisitos
print_header "📋 Passo 1/8: Verificando Requisitos"

MISSING_DEPS=()

if ! command_exists docker; then
    MISSING_DEPS+=("docker")
    print_color $RED "❌ Docker não instalado"
else
    print_color $GREEN "✅ Docker instalado: $(docker --version)"
fi

if ! command_exists git; then
    MISSING_DEPS+=("git")
    print_color $RED "❌ Git não instalado"
else
    print_color $GREEN "✅ Git instalado: $(git --version)"
fi

if ! command_exists nginx; then
    MISSING_DEPS+=("nginx")
    print_color $RED "❌ Nginx não instalado"
else
    print_color $GREEN "✅ Nginx instalado: $(nginx -v 2>&1)"
fi

if ! command_exists certbot; then
    MISSING_DEPS+=("certbot")
    print_color $RED "❌ Certbot não instalado"
else
    print_color $GREEN "✅ Certbot instalado: $(certbot --version 2>&1 | head -1)"
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    print_color $YELLOW "\n⚠️  Dependências faltando: ${MISSING_DEPS[*]}"
    print_color $YELLOW "Deseja instalar automaticamente? (s/n)"
    read -r install_deps
    
    if [ "$install_deps" = "s" ] || [ "$install_deps" = "S" ]; then
        print_header "📦 Instalando Dependências"
        
        sudo apt update
        
        for dep in "${MISSING_DEPS[@]}"; do
            case $dep in
                docker)
                    print_color $BLUE "Instalando Docker..."
                    curl -fsSL https://get.docker.com -o get-docker.sh
                    sudo sh get-docker.sh
                    sudo usermod -aG docker $USER
                    rm get-docker.sh
                    print_color $GREEN "✅ Docker instalado"
                    ;;
                git)
                    print_color $BLUE "Instalando Git..."
                    sudo apt install -y git
                    print_color $GREEN "✅ Git instalado"
                    ;;
                nginx)
                    print_color $BLUE "Instalando Nginx..."
                    sudo apt install -y nginx
                    sudo systemctl enable nginx
                    print_color $GREEN "✅ Nginx instalado"
                    ;;
                certbot)
                    print_color $BLUE "Instalando Certbot..."
                    sudo apt install -y certbot python3-certbot-nginx
                    print_color $GREEN "✅ Certbot instalado"
                    ;;
            esac
        done
        
        print_color $YELLOW "\n⚠️  Docker foi instalado. Você precisa fazer logout e login novamente."
        print_color $YELLOW "Depois execute este script novamente."
        exit 0
    else
        print_color $RED "❌ Instale as dependências manualmente e execute novamente."
        exit 1
    fi
fi

# Passo 2: Configurar Variáveis
print_header "⚙️  Passo 2/8: Configuração"

DOMAIN="markethubcrm.manus.space"
PROJECT_DIR="$HOME/projetos/markethub-crm-v2"
REPO_URL="https://github.com/danilolimaCabral/markethub-crm-v2.git"

print_color $BLUE "Domínio: $DOMAIN"
print_color $BLUE "Diretório: $PROJECT_DIR"

# Verificar se DNS está configurado
print_color $YELLOW "\n🌐 Verificando DNS..."
if nslookup $DOMAIN >/dev/null 2>&1; then
    IP=$(nslookup $DOMAIN | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
    print_color $GREEN "✅ DNS configurado: $DOMAIN → $IP"
else
    print_color $RED "❌ DNS não configurado para $DOMAIN"
    print_color $YELLOW "Configure o DNS antes de continuar:"
    print_color $YELLOW "  Tipo: A"
    print_color $YELLOW "  Nome: markethubcrm"
    print_color $YELLOW "  Valor: $(curl -s ifconfig.me)"
    print_color $YELLOW "\nDeseja continuar mesmo assim? (s/n)"
    read -r continue_anyway
    if [ "$continue_anyway" != "s" ] && [ "$continue_anyway" != "S" ]; then
        exit 1
    fi
fi

# Passo 3: Clonar/Atualizar Repositório
print_header "📦 Passo 3/8: Baixando Código"

if [ -d "$PROJECT_DIR" ]; then
    print_color $YELLOW "⚠️  Projeto já existe. Deseja atualizar? (s/n)"
    read -r update_repo
    if [ "$update_repo" = "s" ] || [ "$update_repo" = "S" ]; then
        cd "$PROJECT_DIR"
        print_color $BLUE "Atualizando repositório..."
        git pull origin main
        print_color $GREEN "✅ Repositório atualizado"
    fi
else
    print_color $BLUE "Clonando repositório..."
    mkdir -p "$HOME/projetos"
    git clone $REPO_URL "$PROJECT_DIR"
    print_color $GREEN "✅ Repositório clonado"
fi

cd "$PROJECT_DIR"

# Passo 4: Configurar Variáveis de Ambiente
print_header "🔐 Passo 4/8: Variáveis de Ambiente"

if [ -f ".env.production" ]; then
    print_color $YELLOW "⚠️  Arquivo .env.production já existe. Deseja recriar? (s/n)"
    read -r recreate_env
    if [ "$recreate_env" != "s" ] && [ "$recreate_env" != "S" ]; then
        print_color $BLUE "Mantendo .env.production existente"
    else
        rm .env.production
    fi
fi

if [ ! -f ".env.production" ]; then
    print_color $BLUE "Criando .env.production..."
    
    # Solicitar chave do Gemini
    print_color $YELLOW "\n🤖 Digite sua chave do Google Gemini AI (ou deixe em branco):"
    read -r gemini_key
    
    cat > .env.production << EOF
# Aplicação
NODE_ENV=production
PORT=3000

# Domínio
DOMAIN=$DOMAIN
PROTOCOL=https

# Google Gemini AI (Mia de Suporte)
GEMINI_API_KEY=${gemini_key:-sua_chave_gemini_aqui}

# Personalização
VITE_APP_TITLE=MarketHub CRM
VITE_APP_LOGO=/logo-markethub.png

# Integrações (Opcional - Configure depois)
# VITE_ASAAS_API_URL=https://api.asaas.com/v3
# VITE_ASAAS_API_KEY=

# VITE_ML_CLIENT_ID=
# VITE_ML_CLIENT_SECRET=
# VITE_ML_REDIRECT_URI=https://$DOMAIN/callback

# PostgreSQL (Futuro)
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/markethub

# Segurança (Futuro)
# JWT_SECRET=$(openssl rand -base64 32)
# SESSION_SECRET=$(openssl rand -base64 32)
EOF
    
    chmod 600 .env.production
    print_color $GREEN "✅ Arquivo .env.production criado"
fi

# Passo 5: Build da Imagem Docker
print_header "🐳 Passo 5/8: Build Docker"

print_color $BLUE "Construindo imagem Docker..."
docker build -t markethub-crm:latest .

print_color $GREEN "✅ Imagem Docker criada"

# Passo 6: Iniciar Containers
print_header "🚀 Passo 6/8: Iniciando Containers"

# Parar containers antigos se existirem
if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_color $YELLOW "Parando containers antigos..."
    docker compose -f docker-compose.prod.yml down
fi

print_color $BLUE "Iniciando containers..."
docker compose -f docker-compose.prod.yml up -d

# Aguardar containers iniciarem
print_color $BLUE "Aguardando containers iniciarem..."
sleep 5

# Verificar status
if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_color $GREEN "✅ Containers iniciados com sucesso"
    docker compose -f docker-compose.prod.yml ps
else
    print_color $RED "❌ Erro ao iniciar containers"
    docker compose -f docker-compose.prod.yml logs
    exit 1
fi

# Passo 7: Configurar SSL
print_header "🔒 Passo 7/8: Configurando SSL"

print_color $YELLOW "Deseja configurar SSL com Let's Encrypt? (s/n)"
read -r setup_ssl

if [ "$setup_ssl" = "s" ] || [ "$setup_ssl" = "S" ]; then
    print_color $BLUE "Digite seu email para notificações do Let's Encrypt:"
    read -r email
    
    print_color $BLUE "Obtendo certificado SSL..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $email --redirect
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✅ SSL configurado com sucesso"
        
        # Testar renovação automática
        print_color $BLUE "Testando renovação automática..."
        sudo certbot renew --dry-run
        
        if [ $? -eq 0 ]; then
            print_color $GREEN "✅ Renovação automática configurada"
        fi
    else
        print_color $RED "❌ Erro ao configurar SSL"
        print_color $YELLOW "Configure manualmente com: sudo certbot --nginx -d $DOMAIN"
    fi
else
    print_color $YELLOW "⚠️  SSL não configurado. Site acessível apenas via HTTP."
fi

# Passo 8: Configurar Firewall
print_header "🛡️  Passo 8/8: Configurando Firewall"

if command_exists ufw; then
    print_color $YELLOW "Deseja configurar firewall (UFW)? (s/n)"
    read -r setup_firewall
    
    if [ "$setup_firewall" = "s" ] || [ "$setup_firewall" = "S" ]; then
        print_color $BLUE "Configurando firewall..."
        sudo ufw allow 22/tcp comment 'SSH'
        sudo ufw allow 80/tcp comment 'HTTP'
        sudo ufw allow 443/tcp comment 'HTTPS'
        
        print_color $YELLOW "Habilitar firewall agora? (s/n)"
        read -r enable_firewall
        
        if [ "$enable_firewall" = "s" ] || [ "$enable_firewall" = "S" ]; then
            sudo ufw --force enable
            print_color $GREEN "✅ Firewall habilitado"
            sudo ufw status
        fi
    fi
else
    print_color $YELLOW "⚠️  UFW não instalado. Instale com: sudo apt install ufw"
fi

# Finalização
print_header "🎉 Deploy Concluído!"

print_color $GREEN "
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              ✅ DEPLOY REALIZADO COM SUCESSO! ✅           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"

print_color $BLUE "📊 Informações do Deploy:"
echo ""
print_color $GREEN "🌐 URL: https://$DOMAIN"
print_color $GREEN "📁 Diretório: $PROJECT_DIR"
print_color $GREEN "🐳 Containers: $(docker compose -f docker-compose.prod.yml ps --services | wc -l)"
echo ""

print_color $YELLOW "📝 Próximos Passos:"
echo ""
print_color $BLUE "1. Acesse: https://$DOMAIN"
print_color $BLUE "2. Faça login com: admin / admin123"
print_color $BLUE "3. Configure integrações no .env.production"
print_color $BLUE "4. Teste todas as funcionalidades"
echo ""

print_color $YELLOW "🔧 Comandos Úteis:"
echo ""
print_color $BLUE "Ver logs:          docker compose -f docker-compose.prod.yml logs -f"
print_color $BLUE "Reiniciar:         docker compose -f docker-compose.prod.yml restart"
print_color $BLUE "Parar:             docker compose -f docker-compose.prod.yml stop"
print_color $BLUE "Atualizar:         cd $PROJECT_DIR && git pull && docker compose -f docker-compose.prod.yml up -d --build"
echo ""

print_color $GREEN "✨ MarketHub CRM está no ar! ✨"
echo ""
