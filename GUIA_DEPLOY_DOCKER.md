# 🐳 Guia de Deploy com Docker - MarketHub CRM

**Versão:** 1.0.0  
**Última Atualização:** 10 de novembro de 2025  
**Autor:** Manus AI

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação do Docker](#instalação-do-docker)
3. [Build da Imagem](#build-da-imagem)
4. [Deploy Rápido](#deploy-rápido)
5. [Deploy com Docker Compose](#deploy-com-docker-compose)
6. [Configuração Avançada](#configuração-avançada)
7. [Troubleshooting](#troubleshooting)

---

## 💻 Pré-requisitos

### Requisitos Mínimos do Servidor

Para executar o MarketHub CRM em produção, você precisará de um servidor com as seguintes especificações mínimas.

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **CPU** | 1 core | 2+ cores |
| **RAM** | 1 GB | 2 GB+ |
| **Disco** | 10 GB | 20 GB+ |
| **Sistema Operacional** | Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+) | Ubuntu 22.04 LTS |

### Software Necessário

Você precisará ter instalado no servidor:

- **Docker** versão 20.10 ou superior
- **Docker Compose** versão 2.0 ou superior (opcional, mas recomendado)

---

## 🔧 Instalação do Docker

### Ubuntu / Debian

Execute os seguintes comandos para instalar o Docker e Docker Compose no Ubuntu ou Debian.

```bash
# Atualizar repositórios
sudo apt update

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Adicionar chave GPG oficial do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório do Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Atualizar repositórios novamente
sudo apt update

# Instalar Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker (para não precisar usar sudo)
sudo usermod -aG docker $USER

# Verificar instalação
docker --version
docker compose version
```

### CentOS / RHEL

Para sistemas baseados em Red Hat, use os comandos abaixo.

```bash
# Instalar dependências
sudo yum install -y yum-utils

# Adicionar repositório do Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Instalar Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Verificar instalação
docker --version
docker compose version
```

**Importante:** Após adicionar o usuário ao grupo docker, faça logout e login novamente para que as mudanças tenham efeito.

---

## 🏗️ Build da Imagem

### Opção 1: Build Manual

Se você clonou o repositório e quer fazer o build da imagem localmente, siga os passos abaixo.

```bash
# Navegar até o diretório do projeto
cd markethub-crm-v2

# Fazer build da imagem
docker build -t markethub-crm:latest .

# Verificar imagem criada
docker images | grep markethub-crm
```

O build levará aproximadamente **2-3 minutos** dependendo da velocidade da sua conexão e do processador.

### Opção 2: Build com Tag Versionada

Para manter controle de versões, você pode criar tags específicas.

```bash
# Build com tag de versão
docker build -t markethub-crm:1.0.0 -t markethub-crm:latest .

# Listar imagens
docker images | grep markethub-crm
```

---

## 🚀 Deploy Rápido

### Método 1: Executar Container Diretamente

A forma mais rápida de colocar o sistema no ar é executar o container diretamente.

```bash
# Executar container em background
docker run -d \
  --name markethub-crm \
  --restart unless-stopped \
  -p 3000:3000 \
  markethub-crm:latest

# Verificar se está rodando
docker ps | grep markethub-crm

# Ver logs
docker logs -f markethub-crm
```

O sistema estará disponível em: **http://seu-servidor:3000**

### Método 2: Com Variáveis de Ambiente

Para configurar variáveis de ambiente personalizadas, use o parâmetro `-e`.

```bash
docker run -d \
  --name markethub-crm \
  --restart unless-stopped \
  -p 3000:3000 \
  -e VITE_APP_TITLE="Meu CRM Personalizado" \
  -e VITE_APP_LOGO="/logo-custom.png" \
  markethub-crm:latest
```

---

## 🎼 Deploy com Docker Compose

O Docker Compose facilita o gerenciamento de containers e suas configurações. Esta é a **forma recomendada** para produção.

### Passo 1: Preparar Arquivo de Configuração

O arquivo `docker-compose.yml` já está incluído no projeto. Você pode editá-lo conforme necessário.

```bash
# Editar configurações (opcional)
nano docker-compose.yml
```

### Passo 2: Iniciar Serviços

Execute o comando abaixo para iniciar todos os serviços definidos no docker-compose.yml.

```bash
# Iniciar em background
docker compose up -d

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f
```

### Passo 3: Acessar Sistema

Após alguns segundos, o sistema estará disponível em: **http://seu-servidor:3000**

### Comandos Úteis do Docker Compose

Aqui estão os comandos mais utilizados para gerenciar o sistema.

```bash
# Parar serviços
docker compose stop

# Iniciar serviços parados
docker compose start

# Reiniciar serviços
docker compose restart

# Parar e remover containers
docker compose down

# Parar, remover e limpar volumes
docker compose down -v

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f markethub-crm

# Executar comandos dentro do container
docker compose exec markethub-crm sh

# Atualizar imagem e reiniciar
docker compose pull
docker compose up -d
```

---

## ⚙️ Configuração Avançada

### Variáveis de Ambiente

O sistema suporta as seguintes variáveis de ambiente para personalização.

#### Aplicação

| Variável | Descrição | Padrão | Obrigatória |
|----------|-----------|--------|-------------|
| `NODE_ENV` | Ambiente de execução | `production` | Não |
| `PORT` | Porta do servidor | `3000` | Não |
| `VITE_APP_TITLE` | Título da aplicação | `MarketHub CRM` | Não |
| `VITE_APP_LOGO` | Caminho do logo | `/logo-final.png` | Não |

#### Integrações

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `VITE_ASAAS_API_URL` | URL da API Asaas | Não |
| `VITE_ASAAS_API_KEY` | Chave API Asaas | Não |
| `GEMINI_API_KEY` | Chave API Google Gemini | Não |
| `VITE_ML_CLIENT_ID` | Client ID Mercado Livre | Não |
| `VITE_ML_CLIENT_SECRET` | Client Secret Mercado Livre | Não |

#### Analytics (Opcional)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `VITE_ANALYTICS_ENDPOINT` | Endpoint do Umami | Não |
| `VITE_ANALYTICS_WEBSITE_ID` | ID do site no Umami | Não |

### Arquivo .env

Para facilitar o gerenciamento de variáveis de ambiente, crie um arquivo `.env` na raiz do projeto.

```bash
# Criar arquivo .env
cat > .env << 'EOF'
# Aplicação
VITE_APP_TITLE=MarketHub CRM
VITE_APP_LOGO=/logo-final.png

# Integrações (configure conforme necessário)
# VITE_ASAAS_API_URL=https://api-sandbox.asaas.com/v3
# VITE_ASAAS_API_KEY=your_api_key_here
# GEMINI_API_KEY=your_gemini_key_here

# Analytics (opcional)
# VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
# VITE_ANALYTICS_WEBSITE_ID=your_website_id
EOF
```

Depois, referencie o arquivo no docker-compose.yml:

```yaml
services:
  markethub-crm:
    env_file:
      - .env
```

### Configurar Nginx como Reverse Proxy

Para usar Nginx como reverse proxy com SSL, crie o arquivo `nginx.conf`.

```nginx
events {
    worker_connections 1024;
}

http {
    upstream markethub {
        server markethub-crm:3000;
    }

    server {
        listen 80;
        server_name seu-dominio.com;

        # Redirecionar HTTP para HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name seu-dominio.com;

        # Certificados SSL
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Configurações SSL
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Proxy para aplicação
        location / {
            proxy_pass http://markethub;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

Depois, descomente a seção do Nginx no `docker-compose.yml`.

### Configurar PostgreSQL (Migração Futura)

Quando estiver pronto para migrar do localStorage para PostgreSQL, descomente a seção do PostgreSQL no `docker-compose.yml` e configure as variáveis de ambiente.

```yaml
environment:
  - DATABASE_URL=postgresql://markethub:senha_segura@postgres:5432/markethub
```

---

## 🔍 Troubleshooting

### Problema: Container não inicia

**Sintomas:** Container para imediatamente após iniciar.

**Solução:**
```bash
# Ver logs de erro
docker logs markethub-crm

# Verificar se a porta está em uso
sudo netstat -tulpn | grep 3000

# Remover container e tentar novamente
docker rm -f markethub-crm
docker run -d --name markethub-crm -p 3000:3000 markethub-crm:latest
```

### Problema: Porta 3000 já está em uso

**Sintomas:** Erro "port is already allocated".

**Solução:**
```bash
# Usar outra porta
docker run -d --name markethub-crm -p 8080:3000 markethub-crm:latest

# Ou parar o processo que está usando a porta 3000
sudo lsof -ti:3000 | xargs kill -9
```

### Problema: Imagem muito grande

**Sintomas:** Build demora muito ou imagem ocupa muito espaço.

**Solução:**
```bash
# Limpar cache do Docker
docker system prune -a

# Fazer build novamente
docker build -t markethub-crm:latest .
```

### Problema: Não consegue acessar de fora do servidor

**Sintomas:** Funciona em localhost mas não externamente.

**Solução:**
```bash
# Verificar firewall
sudo ufw allow 3000/tcp

# Ou para iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables-save
```

### Problema: Container reinicia constantemente

**Sintomas:** Container fica em loop de restart.

**Solução:**
```bash
# Ver logs detalhados
docker logs --tail 100 markethub-crm

# Verificar health check
docker inspect markethub-crm | grep -A 10 Health

# Desabilitar restart automático temporariamente
docker update --restart=no markethub-crm
```

---

## 📊 Monitoramento

### Ver Status dos Containers

```bash
# Status resumido
docker ps

# Status detalhado
docker stats markethub-crm

# Logs em tempo real
docker logs -f --tail 100 markethub-crm
```

### Health Check

O container possui health check automático que verifica se o servidor está respondendo.

```bash
# Verificar status do health check
docker inspect markethub-crm | grep -A 5 Health
```

---

## 🚀 Deploy em Produção

### Checklist de Produção

Antes de colocar em produção, verifique os seguintes itens.

- [ ] Configurar variáveis de ambiente sensíveis
- [ ] Configurar backup automático (se usar PostgreSQL)
- [ ] Configurar SSL/HTTPS (via Nginx ou Traefik)
- [ ] Configurar firewall
- [ ] Configurar domínio personalizado
- [ ] Testar health checks
- [ ] Configurar monitoramento (Prometheus, Grafana)
- [ ] Configurar logs centralizados
- [ ] Documentar credenciais de acesso

### Serviços de Cloud Recomendados

O MarketHub CRM pode ser facilmente deployado em diversos serviços de cloud.

#### DigitalOcean (Recomendado)

Custo estimado: **$6-12/mês**

```bash
# Criar droplet Ubuntu 22.04
# Instalar Docker
# Clonar repositório
# Executar docker compose up -d
```

#### AWS EC2

Custo estimado: **$10-20/mês** (t3.small)

#### Google Cloud Platform

Custo estimado: **$10-20/mês** (e2-small)

#### Azure

Custo estimado: **$15-25/mês** (B1s)

---

## 📝 Comandos Rápidos

### Build e Deploy em Uma Linha

```bash
docker build -t markethub-crm:latest . && docker run -d --name markethub-crm --restart unless-stopped -p 3000:3000 markethub-crm:latest
```

### Atualizar Sistema

```bash
# Parar container
docker stop markethub-crm

# Remover container
docker rm markethub-crm

# Fazer novo build
docker build -t markethub-crm:latest .

# Iniciar novo container
docker run -d --name markethub-crm --restart unless-stopped -p 3000:3000 markethub-crm:latest
```

### Backup e Restore (com PostgreSQL)

```bash
# Backup
docker exec markethub-postgres pg_dump -U markethub markethub > backup.sql

# Restore
docker exec -i markethub-postgres psql -U markethub markethub < backup.sql
```

---

## 🎯 Conclusão

Com este guia, você tem tudo o que precisa para fazer o deploy do MarketHub CRM usando Docker. O sistema está otimizado para produção e pronto para escalar conforme suas necessidades.

Para suporte adicional, consulte a documentação completa no repositório ou abra uma issue no GitHub.

---

**Desenvolvido com ❤️ usando Manus AI**
