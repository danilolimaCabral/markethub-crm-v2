# 🚀 Guia de Deploy Permanente - MarketHub CRM

**Domínio:** markethubcrm.manus.space  
**Versão:** 2.1.0  
**Data:** 10 de novembro de 2025

---

## 📋 Pré-requisitos

### Servidor

- **Sistema Operacional:** Ubuntu 22.04 LTS ou superior
- **RAM:** Mínimo 2GB (recomendado 4GB)
- **CPU:** Mínimo 2 cores
- **Disco:** Mínimo 20GB livres
- **Acesso:** SSH com sudo

### Software Necessário

```bash
# Docker
Docker Engine 24.0+
Docker Compose 2.20+

# Nginx (para proxy reverso)
Nginx 1.18+

# Certbot (para SSL)
Certbot (Let's Encrypt)

# Git
Git 2.34+
```

---

## 🔧 Passo 1: Preparar o Servidor

### 1.1 Conectar via SSH

```bash
ssh usuario@seu-servidor-ip
```

### 1.2 Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Docker

```bash
# Remover versões antigas
sudo apt remove docker docker-engine docker.io containerd runc

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Testar
docker run hello-world
```

### 1.4 Instalar Nginx

```bash
sudo apt install -y nginx

# Verificar instalação
nginx -v

# Iniciar e habilitar
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.5 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx

# Verificar instalação
certbot --version
```

---

## 🌐 Passo 2: Configurar DNS

### 2.1 Acessar Painel de DNS

Acesse o painel de gerenciamento do domínio **manus.space**.

### 2.2 Adicionar Registro A

Crie um novo registro DNS:

```
Tipo: A
Nome: markethubcrm
Valor: [IP_DO_SEU_SERVIDOR]
TTL: 3600 (1 hora)
```

**Exemplo:**
```
markethubcrm.manus.space → 203.0.113.10
```

### 2.3 Verificar Propagação

```bash
# Aguardar propagação (pode levar até 48h, geralmente 5-15 minutos)
nslookup markethubcrm.manus.space

# Ou usar
dig markethubcrm.manus.space

# Ou testar online
# https://dnschecker.org
```

---

## 📦 Passo 3: Clonar Repositório

### 3.1 Criar Diretório de Projetos

```bash
mkdir -p ~/projetos
cd ~/projetos
```

### 3.2 Clonar do GitHub

```bash
git clone https://github.com/danilolimaCabral/markethub-crm-v2.git
cd markethub-crm-v2
```

### 3.3 Verificar Arquivos

```bash
ls -la

# Deve mostrar:
# - Dockerfile
# - docker-compose.yml
# - docker-compose.prod.yml
# - nginx.conf
# - deploy.sh
# - client/
# - server/
# - database/
```

---

## 🔐 Passo 4: Configurar Variáveis de Ambiente

### 4.1 Criar Arquivo .env

```bash
nano .env.production
```

### 4.2 Adicionar Configurações

```env
# Aplicação
NODE_ENV=production
PORT=3000

# Domínio
DOMAIN=markethubcrm.manus.space
PROTOCOL=https

# Google Gemini AI (Mia de Suporte)
GEMINI_API_KEY=sua_chave_gemini_aqui

# Personalização
VITE_APP_TITLE=MarketHub CRM
VITE_APP_LOGO=/logo-markethub.png

# Integrações (Opcional)
VITE_ASAAS_API_URL=https://api.asaas.com/v3
VITE_ASAAS_API_KEY=sua_chave_asaas

VITE_ML_CLIENT_ID=seu_client_id_ml
VITE_ML_CLIENT_SECRET=seu_client_secret_ml
VITE_ML_REDIRECT_URI=https://markethubcrm.manus.space/callback

# PostgreSQL (Futuro)
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/markethub
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=markethub
# DB_USER=postgres
# DB_PASSWORD=senha_segura

# Segurança
# JWT_SECRET=chave_secreta_muito_segura_aqui
# SESSION_SECRET=outra_chave_secreta_aqui

# Email (Futuro)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=seu_email@gmail.com
# SMTP_PASS=sua_senha_app
```

**Salvar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 4.3 Proteger Arquivo

```bash
chmod 600 .env.production
```

---

## 🐳 Passo 5: Build e Deploy com Docker

### 5.1 Build da Imagem

```bash
docker build -t markethub-crm:latest .
```

**Tempo estimado:** 3-5 minutos

### 5.2 Verificar Imagem

```bash
docker images | grep markethub
```

Deve mostrar:
```
markethub-crm   latest   abc123def456   2 minutes ago   150MB
```

### 5.3 Iniciar com Docker Compose

```bash
# Usando arquivo de produção
docker compose -f docker-compose.prod.yml up -d
```

### 5.4 Verificar Containers

```bash
docker compose -f docker-compose.prod.yml ps
```

Deve mostrar:
```
NAME                    STATUS              PORTS
markethub-crm-app       Up 10 seconds       0.0.0.0:3000->3000/tcp
markethub-crm-nginx     Up 10 seconds       0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 5.5 Ver Logs

```bash
# Logs da aplicação
docker compose -f docker-compose.prod.yml logs -f markethub-app

# Logs do Nginx
docker compose -f docker-compose.prod.yml logs -f nginx

# Todos os logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🔒 Passo 6: Configurar SSL (HTTPS)

### 6.1 Obter Certificado SSL

```bash
sudo certbot --nginx -d markethubcrm.manus.space
```

**Perguntas do Certbot:**

1. **Email:** Digite seu email para notificações
2. **Termos:** Aceite os termos (Y)
3. **Compartilhar email:** Opcional (N)
4. **Redirect HTTP → HTTPS:** Sim (2)

### 6.2 Verificar Certificado

```bash
sudo certbot certificates
```

### 6.3 Testar Renovação Automática

```bash
sudo certbot renew --dry-run
```

### 6.4 Configurar Renovação Automática

O Certbot já configura um cron job automaticamente. Verificar:

```bash
sudo systemctl status certbot.timer
```

---

## ✅ Passo 7: Verificar Deploy

### 7.1 Testar Localmente

```bash
curl http://localhost:3000
```

### 7.2 Testar via Domínio

```bash
curl https://markethubcrm.manus.space
```

### 7.3 Acessar no Navegador

Abra o navegador e acesse:

**https://markethubcrm.manus.space**

Deve carregar a landing page do MarketHub CRM com:
- ✅ Logo
- ✅ Calculadora de taxas ML
- ✅ Planos de preços
- ✅ Botão "Área do Cliente"
- ✅ Chatbot Mia (botão flutuante)

### 7.4 Testar Login

1. Clicar em **Área do Cliente**
2. Fazer login com: `admin` / `admin123`
3. Verificar se carrega o dashboard
4. Testar menu lateral
5. Acessar **Painel Master**
6. Testar **Mia de Suporte**

---

## 🔄 Passo 8: Configurar Atualizações Automáticas

### 8.1 Criar Script de Atualização

```bash
nano ~/update-markethub.sh
```

Adicionar:

```bash
#!/bin/bash

# Script de atualização do MarketHub CRM
# Autor: MarketHub Team
# Data: 2025-11-10

set -e

echo "🚀 Iniciando atualização do MarketHub CRM..."

# Ir para diretório do projeto
cd ~/projetos/markethub-crm-v2

# Fazer backup do .env
echo "📦 Fazendo backup das configurações..."
cp .env.production .env.production.backup

# Puxar atualizações do GitHub
echo "⬇️ Baixando atualizações..."
git pull origin main

# Rebuild da imagem
echo "🔨 Reconstruindo imagem Docker..."
docker build -t markethub-crm:latest .

# Parar containers
echo "⏸️ Parando containers..."
docker compose -f docker-compose.prod.yml down

# Iniciar novamente
echo "▶️ Iniciando containers atualizados..."
docker compose -f docker-compose.prod.yml up -d

# Limpar imagens antigas
echo "🧹 Limpando imagens antigas..."
docker image prune -f

# Verificar status
echo "✅ Verificando status..."
docker compose -f docker-compose.prod.yml ps

echo "🎉 Atualização concluída com sucesso!"
echo "🌐 Acesse: https://markethubcrm.manus.space"
```

**Salvar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 8.2 Tornar Executável

```bash
chmod +x ~/update-markethub.sh
```

### 8.3 Testar Script

```bash
~/update-markethub.sh
```

---

## 📊 Passo 9: Configurar Monitoramento

### 9.1 Verificar Logs em Tempo Real

```bash
# Logs da aplicação
docker logs -f markethub-app

# Logs do Nginx
docker logs -f markethub-nginx
```

### 9.2 Verificar Uso de Recursos

```bash
# CPU e Memória dos containers
docker stats

# Espaço em disco
df -h

# Uso de disco do Docker
docker system df
```

### 9.3 Configurar Alertas (Opcional)

Instalar ferramentas de monitoramento:

```bash
# Instalar htop
sudo apt install -y htop

# Usar
htop
```

---

## 🛡️ Passo 10: Segurança

### 10.1 Configurar Firewall

```bash
# Instalar UFW
sudo apt install -y ufw

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

### 10.2 Configurar Fail2Ban (Proteção contra Brute Force)

```bash
# Instalar
sudo apt install -y fail2ban

# Copiar configuração
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Editar
sudo nano /etc/fail2ban/jail.local

# Habilitar proteção SSH
# [sshd]
# enabled = true
# maxretry = 3
# bantime = 3600

# Reiniciar
sudo systemctl restart fail2ban

# Verificar
sudo fail2ban-client status
```

### 10.3 Atualizar Sistema Regularmente

```bash
# Criar script de atualização
echo '#!/bin/bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
docker system prune -f
' | sudo tee /usr/local/bin/update-system.sh

# Tornar executável
sudo chmod +x /usr/local/bin/update-system.sh

# Executar semanalmente (cron)
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/update-system.sh") | crontab -
```

---

## 🔧 Comandos Úteis

### Gerenciar Containers

```bash
# Ver status
docker compose -f docker-compose.prod.yml ps

# Parar
docker compose -f docker-compose.prod.yml stop

# Iniciar
docker compose -f docker-compose.prod.yml start

# Reiniciar
docker compose -f docker-compose.prod.yml restart

# Parar e remover
docker compose -f docker-compose.prod.yml down

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Executar comando no container
docker compose -f docker-compose.prod.yml exec markethub-app sh
```

### Backup

```bash
# Backup completo
tar -czf markethub-backup-$(date +%Y%m%d).tar.gz ~/projetos/markethub-crm-v2

# Backup apenas dados (quando tiver PostgreSQL)
# docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres markethub > backup.sql
```

### Restaurar

```bash
# Restaurar de backup
tar -xzf markethub-backup-20251110.tar.gz -C ~/projetos/
```

---

## 🚨 Troubleshooting

### Problema: Site não carrega

**Verificar:**

```bash
# Status dos containers
docker compose -f docker-compose.prod.yml ps

# Logs de erro
docker compose -f docker-compose.prod.yml logs

# Nginx rodando?
sudo systemctl status nginx

# DNS propagado?
nslookup markethubcrm.manus.space
```

### Problema: Erro 502 Bad Gateway

**Solução:**

```bash
# Reiniciar containers
docker compose -f docker-compose.prod.yml restart

# Verificar se porta 3000 está aberta
netstat -tulpn | grep 3000

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### Problema: SSL não funciona

**Solução:**

```bash
# Renovar certificado
sudo certbot renew --force-renewal

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar configuração
sudo nginx -t
```

### Problema: Container não inicia

**Solução:**

```bash
# Ver logs detalhados
docker logs markethub-app

# Verificar variáveis de ambiente
docker compose -f docker-compose.prod.yml config

# Rebuild forçado
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

---

## 📈 Otimizações de Performance

### 1. Habilitar Compressão Gzip

Já está configurado no `nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### 2. Cache de Assets

Já está configurado no `nginx.conf`:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Limitar Recursos do Container

Editar `docker-compose.prod.yml`:

```yaml
services:
  markethub-app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 🎯 Checklist de Deploy

- [ ] Servidor preparado (Ubuntu, Docker, Nginx)
- [ ] DNS configurado (markethubcrm.manus.space → IP)
- [ ] Repositório clonado
- [ ] Variáveis de ambiente configuradas (.env.production)
- [ ] Imagem Docker buildada
- [ ] Containers iniciados
- [ ] SSL configurado (Certbot)
- [ ] Site acessível via HTTPS
- [ ] Login funcionando
- [ ] Painel Master acessível
- [ ] Mia de Vendas funcionando
- [ ] Mia de Suporte funcionando
- [ ] Firewall configurado
- [ ] Fail2Ban instalado
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] Script de atualização criado

---

## 📞 Suporte

### Documentação

- **Repositório:** https://github.com/danilolimaCabral/markethub-crm-v2
- **Guias:** Veja pasta `/docs` no repositório

### Logs

```bash
# Aplicação
docker logs markethub-app

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Sistema
sudo journalctl -u docker
```

---

## 🎉 Conclusão

Seguindo este guia, o **MarketHub CRM** estará rodando permanentemente em:

**🌐 https://markethubcrm.manus.space**

Com:
- ✅ SSL/HTTPS habilitado
- ✅ Docker containerizado
- ✅ Nginx como proxy reverso
- ✅ Renovação automática de SSL
- ✅ Firewall configurado
- ✅ Monitoramento ativo
- ✅ Backup automatizado
- ✅ Atualizações facilitadas

**O sistema está pronto para produção!** 🚀

---

**Desenvolvido com ❤️ usando Manus AI**  
**Data:** 10 de novembro de 2025
