#!/bin/bash

# ============================================================================
# MarketHub CRM - Script de Deploy Automatizado
# ============================================================================
# Este script automatiza o processo de build e deploy do MarketHub CRM
# ============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

# Verificar se Docker está instalado
check_docker() {
    print_info "Verificando instalação do Docker..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado!"
        print_info "Por favor, instale o Docker primeiro:"
        print_info "https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker está instalado: $(docker --version)"
}

# Verificar se Docker Compose está instalado
check_docker_compose() {
    print_info "Verificando instalação do Docker Compose..."
    if ! docker compose version &> /dev/null; then
        print_warning "Docker Compose não está instalado"
        print_info "Você pode instalar com: sudo apt install docker-compose-plugin"
        return 1
    fi
    print_success "Docker Compose está instalado: $(docker compose version)"
    return 0
}

# Parar containers existentes
stop_existing() {
    print_info "Parando containers existentes..."
    if docker ps -a | grep -q markethub-crm; then
        docker stop markethub-crm 2>/dev/null || true
        docker rm markethub-crm 2>/dev/null || true
        print_success "Containers existentes removidos"
    else
        print_info "Nenhum container existente encontrado"
    fi
}

# Build da imagem
build_image() {
    print_header "FAZENDO BUILD DA IMAGEM"
    print_info "Iniciando build da imagem Docker..."
    print_info "Isso pode levar alguns minutos..."
    
    docker build -t markethub-crm:latest . || {
        print_error "Falha no build da imagem"
        exit 1
    }
    
    print_success "Imagem criada com sucesso!"
    
    # Mostrar tamanho da imagem
    IMAGE_SIZE=$(docker images markethub-crm:latest --format "{{.Size}}")
    print_info "Tamanho da imagem: $IMAGE_SIZE"
}

# Deploy com Docker Compose
deploy_compose() {
    print_header "DEPLOY COM DOCKER COMPOSE"
    print_info "Iniciando serviços com Docker Compose..."
    
    docker compose up -d || {
        print_error "Falha ao iniciar serviços"
        exit 1
    }
    
    print_success "Serviços iniciados com sucesso!"
}

# Deploy direto com Docker
deploy_docker() {
    print_header "DEPLOY COM DOCKER"
    print_info "Iniciando container..."
    
    docker run -d \
        --name markethub-crm \
        --restart unless-stopped \
        -p 3000:3000 \
        markethub-crm:latest || {
        print_error "Falha ao iniciar container"
        exit 1
    }
    
    print_success "Container iniciado com sucesso!"
}

# Verificar status
check_status() {
    print_header "VERIFICANDO STATUS"
    
    sleep 3  # Aguardar inicialização
    
    print_info "Status do container:"
    docker ps | grep markethub-crm || {
        print_error "Container não está rodando!"
        print_info "Verificando logs:"
        docker logs markethub-crm
        exit 1
    }
    
    print_success "Container está rodando!"
    
    # Verificar health check
    print_info "Aguardando health check..."
    sleep 5
    
    HEALTH_STATUS=$(docker inspect markethub-crm --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
    
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        print_success "Health check: OK"
    elif [ "$HEALTH_STATUS" = "starting" ]; then
        print_warning "Health check: Iniciando..."
    elif [ "$HEALTH_STATUS" = "no-healthcheck" ]; then
        print_info "Health check: Não configurado"
    else
        print_warning "Health check: $HEALTH_STATUS"
    fi
}

# Mostrar informações de acesso
show_access_info() {
    print_header "INFORMAÇÕES DE ACESSO"
    
    # Obter IP do servidor
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    print_success "Deploy concluído com sucesso!"
    echo ""
    print_info "Acesse o sistema em:"
    echo -e "  ${GREEN}➜${NC} Local:    http://localhost:3000"
    echo -e "  ${GREEN}➜${NC} Rede:     http://${SERVER_IP}:3000"
    echo ""
    print_info "Credenciais padrão:"
    echo -e "  ${YELLOW}Usuário:${NC} admin"
    echo -e "  ${YELLOW}Senha:${NC}   admin123"
    echo ""
    print_info "Comandos úteis:"
    echo -e "  ${BLUE}Ver logs:${NC}       docker logs -f markethub-crm"
    echo -e "  ${BLUE}Parar:${NC}          docker stop markethub-crm"
    echo -e "  ${BLUE}Reiniciar:${NC}      docker restart markethub-crm"
    echo -e "  ${BLUE}Status:${NC}         docker ps | grep markethub-crm"
    echo ""
}

# Mostrar logs
show_logs() {
    print_header "LOGS DO CONTAINER"
    print_info "Mostrando últimas 50 linhas de log..."
    echo ""
    docker logs --tail 50 markethub-crm
    echo ""
    print_info "Para ver logs em tempo real, execute:"
    print_info "docker logs -f markethub-crm"
}

# Menu principal
show_menu() {
    print_header "MARKETHUB CRM - DEPLOY AUTOMATIZADO"
    echo "Escolha uma opção:"
    echo ""
    echo "  1) Deploy completo (build + deploy com Docker Compose)"
    echo "  2) Deploy completo (build + deploy com Docker)"
    echo "  3) Apenas build da imagem"
    echo "  4) Apenas deploy (usar imagem existente)"
    echo "  5) Parar e remover containers"
    echo "  6) Ver logs"
    echo "  7) Ver status"
    echo "  0) Sair"
    echo ""
    read -p "Opção: " option
    echo ""
    
    case $option in
        1)
            check_docker
            if check_docker_compose; then
                stop_existing
                build_image
                deploy_compose
                check_status
                show_access_info
            else
                print_error "Docker Compose não está disponível"
                exit 1
            fi
            ;;
        2)
            check_docker
            stop_existing
            build_image
            deploy_docker
            check_status
            show_access_info
            ;;
        3)
            check_docker
            build_image
            print_success "Build concluído!"
            ;;
        4)
            check_docker
            stop_existing
            if check_docker_compose && [ -f "docker-compose.yml" ]; then
                deploy_compose
            else
                deploy_docker
            fi
            check_status
            show_access_info
            ;;
        5)
            stop_existing
            print_success "Containers removidos"
            ;;
        6)
            show_logs
            ;;
        7)
            check_status
            ;;
        0)
            print_info "Saindo..."
            exit 0
            ;;
        *)
            print_error "Opção inválida!"
            exit 1
            ;;
    esac
}

# Verificar se foi passado argumento
if [ $# -eq 0 ]; then
    # Sem argumentos, mostrar menu
    show_menu
else
    # Com argumentos, executar comando direto
    case $1 in
        build)
            check_docker
            build_image
            ;;
        deploy)
            check_docker
            stop_existing
            if check_docker_compose && [ -f "docker-compose.yml" ]; then
                deploy_compose
            else
                deploy_docker
            fi
            check_status
            show_access_info
            ;;
        full)
            check_docker
            stop_existing
            build_image
            if check_docker_compose && [ -f "docker-compose.yml" ]; then
                deploy_compose
            else
                deploy_docker
            fi
            check_status
            show_access_info
            ;;
        stop)
            stop_existing
            ;;
        logs)
            show_logs
            ;;
        status)
            check_status
            ;;
        *)
            print_error "Comando inválido: $1"
            print_info "Comandos disponíveis: build, deploy, full, stop, logs, status"
            exit 1
            ;;
    esac
fi
