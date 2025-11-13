# 🚀 DEPLOY NO HETZNER CLOUD - Markethub CRM

**Data:** 13/11/2025  
**Servidor:** Hetzner Cloud  
**Projeto ID:** 12430399  
**Servidor ID:** 113058104  

---

## 📊 INFORMAÇÕES DO SEU SERVIDOR HETZNER

### Servidor Atual
```
Projeto: 12430399
Servidor: 113058104
URL: https://www.markthubcrm.com.br
Status: 🟢 ONLINE e FUNCIONANDO
```

### Especificações Típicas Hetzner
```
CPU: 2-4 vCPUs
RAM: 4-8 GB
Storage: 40-80 GB SSD
Localização: Alemanha/Finlândia
Sistema: Ubuntu/Debian Linux
IP: [Seu IP público]
```

---

## 🔧 COMO ESTÁ FUNCIONANDO ATUALMENTE

### Deploy Atual (Provável)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. Você faz push para GitHub                      │
│     ↓                                               │
│  2. GitHub Actions executa (mas falha)             │
│     ↓                                               │
│  3. Deploy manual via SSH no Hetzner               │
│     ou                                              │
│     Webhook/Script automático                      │
│     ↓                                               │
│  4. Servidor Hetzner atualiza código               │
│     ↓                                               │
│  5. PM2/SystemD reinicia aplicação                 │
│     ↓                                               │
│  6. Site fica disponível                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 ACESSO AO SERVIDOR HETZNER

### Via Console Web
```
URL: https://console.hetzner.com/projects/12430399/servers/113058104
```

### Via SSH
```bash
# Acesso básico
ssh root@[IP-DO-SERVIDOR]

# Com chave SSH específica
ssh -i ~/.ssh/hetzner_key root@[IP-DO-SERVIDOR]

# Verificar status da aplicação
ssh root@[IP-DO-SERVIDOR] "pm2 status"
```

---

## 🚀 MÉTODOS DE DEPLOY NO HETZNER

### Método 1: Deploy Manual via SSH ⚡ (Atual - Provável)

```bash
# 1. Conectar no servidor
ssh root@[IP-DO-SERVIDOR]

# 2. Navegar para pasta da aplicação
cd /var/www/markethub-crm
# ou
cd /opt/markethub-crm
# ou
cd ~/markethub-crm

# 3. Atualizar código
git pull origin main

# 4. Instalar dependências
pnpm install --prod

# 5. Build da aplicação
pnpm build

# 6. Rodar migrations
pnpm run migrate

# 7. Reiniciar aplicação
pm2 restart markethub-crm
# ou
systemctl restart markethub-crm

# 8. Verificar status
pm2 status
# ou
systemctl status markethub-crm

# 9. Ver logs
pm2 logs markethub-crm --lines 50
```

### Método 2: Deploy Automático via GitHub Actions ⭐ (RECOMENDADO)

#### Configurar no GitHub

**Passo 1: Adicionar Secrets no GitHub**

```
Settings → Secrets and variables → Actions → New repository secret

Adicionar:
- HETZNER_HOST: [IP do servidor]
- HETZNER_USER: root (ou seu usuário)
- HETZNER_SSH_KEY: [chave privada SSH]
- HETZNER_PORT: 22 (porta SSH)
```

**Passo 2: Criar Workflow de Deploy**

Arquivo: `.github/workflows/deploy-hetzner.yml`

```yaml
name: Deploy to Hetzner

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Hetzner Production
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.HETZNER_SSH_KEY }}

      - name: Add known hosts
        run: |
          ssh-keyscan -H ${{ secrets.HETZNER_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to server
        run: |
          ssh ${{ secrets.HETZNER_USER }}@${{ secrets.HETZNER_HOST }} << 'ENDSSH'
            # Navegar para pasta da aplicação
            cd /var/www/markethub-crm || cd /opt/markethub-crm
            
            # Backup antes de deploy
            echo "📦 Criando backup..."
            tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/ || true
            
            # Atualizar código
            echo "⬇️  Baixando código..."
            git fetch origin
            git reset --hard origin/main
            
            # Instalar dependências
            echo "📚 Instalando dependências..."
            pnpm install --frozen-lockfile --prod
            
            # Build
            echo "🔨 Building aplicação..."
            pnpm build
            
            # Migrations
            echo "💾 Rodando migrations..."
            pnpm run migrate
            
            # Reiniciar aplicação
            echo "🔄 Reiniciando aplicação..."
            pm2 restart markethub-crm || systemctl restart markethub-crm
            
            # Verificar status
            echo "✅ Verificando status..."
            sleep 5
            pm2 status markethub-crm || systemctl status markethub-crm
            
            echo "🎉 Deploy concluído!"
          ENDSSH

      - name: Health check
        run: |
          sleep 10
          curl -f https://www.markthubcrm.com.br/api/health || exit 1
          echo "✅ Health check passou!"

      - name: Notify on success
        if: success()
        run: |
          echo "🎉 Deploy realizado com sucesso!"
          echo "Versão: ${{ github.sha }}"

      - name: Rollback on failure
        if: failure()
        run: |
          ssh ${{ secrets.HETZNER_USER }}@${{ secrets.HETZNER_HOST }} << 'ENDSSH'
            cd /var/www/markethub-crm || cd /opt/markethub-crm
            echo "🚨 Deploy falhou! Fazendo rollback..."
            
            # Restaurar último backup
            LAST_BACKUP=$(ls -t backup-*.tar.gz | head -1)
            if [ -n "$LAST_BACKUP" ]; then
              tar -xzf $LAST_BACKUP
              pm2 restart markethub-crm
              echo "✅ Rollback concluído!"
            fi
          ENDSSH
```

### Método 3: Deploy com Docker 🐳 (AVANÇADO)

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar package files
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile --prod

# Copiar código
COPY . .

# Build
RUN pnpm build

# Expor porta
EXPOSE 3000

# Comando de start
CMD ["node", "dist/index.js"]
```

```bash
# Deploy com Docker
ssh root@[IP-HETZNER]

# Build imagem
docker build -t markethub-crm:latest .

# Parar container antigo
docker stop markethub-crm || true
docker rm markethub-crm || true

# Rodar novo container
docker run -d \
  --name markethub-crm \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="${DATABASE_URL}" \
  -e JWT_SECRET="${JWT_SECRET}" \
  markethub-crm:latest

# Verificar
docker logs -f markethub-crm
```

---

## 🔧 CONFIGURAÇÃO INICIAL DO SERVIDOR HETZNER

### Setup Completo (Primeira Vez)

```bash
# 1. Conectar no servidor
ssh root@[IP-HETZNER]

# 2. Atualizar sistema
apt update && apt upgrade -y

# 3. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Instalar pnpm
npm install -g pnpm pm2

# 5. Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# 6. Configurar PostgreSQL
sudo -u postgres psql << EOF
CREATE DATABASE markethub_crm;
CREATE USER markethub WITH ENCRYPTED PASSWORD 'sua-senha-segura';
GRANT ALL PRIVILEGES ON DATABASE markethub_crm TO markethub;
\q
EOF

# 7. Instalar Nginx
apt install -y nginx

# 8. Configurar Nginx
cat > /etc/nginx/sites-available/markethub << 'EOF'
server {
    listen 80;
    server_name www.markthubcrm.com.br markthubcrm.com.br;

    location / {
        proxy_pass http://localhost:3000;
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
EOF

# 9. Ativar site
ln -s /etc/nginx/sites-available/markethub /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 10. Instalar SSL (Certbot)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d www.markthubcrm.com.br -d markthubcrm.com.br

# 11. Clonar repositório
cd /var/www
git clone https://github.com/danilolimaCabral/markethub-crm-v2.git markethub-crm
cd markethub-crm

# 12. Configurar variáveis de ambiente
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://markethub:sua-senha@localhost:5432/markethub_crm
JWT_SECRET=seu-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=seu-refresh-secret-min-32-chars
# ... outras variáveis
EOF

# 13. Instalar dependências e build
pnpm install --frozen-lockfile
pnpm build

# 14. Rodar migrations
pnpm run migrate

# 15. Configurar PM2
pm2 start dist/index.js --name markethub-crm
pm2 save
pm2 startup

# 16. Configurar firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 17. Verificar status
pm2 status
curl http://localhost:3000/api/health
```

---

## 🔄 AMBIENTE DE STAGING NO HETZNER

### Opção 1: Servidor Separado (Recomendado)

```bash
# Criar novo servidor Hetzner para staging
# Server ID: staging-12430400 (exemplo)

# Mesma configuração da produção
# Mas com domínio diferente:
# staging.markthubcrm.com.br

# Deploy separado
ssh root@[IP-STAGING]
# ... setup igual produção ...
```

### Opção 2: Porta Diferente no Mesmo Servidor

```nginx
# Staging na porta 3001
# /etc/nginx/sites-available/markethub-staging

server {
    listen 80;
    server_name staging.markthubcrm.com.br;

    location / {
        proxy_pass http://localhost:3001;
        # ... resto igual ...
    }
}
```

```bash
# PM2 para staging
pm2 start dist/index.js \
  --name markethub-staging \
  --env production \
  -- --port 3001
```

---

## 📊 MONITORAMENTO NO HETZNER

### Logs da Aplicação

```bash
# Ver logs em tempo real
pm2 logs markethub-crm

# Últimas 100 linhas
pm2 logs markethub-crm --lines 100

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs do sistema
journalctl -u markethub-crm -f
```

### Métricas do Servidor

```bash
# Status PM2
pm2 monit

# Uso de recursos
htop

# Espaço em disco
df -h

# Memória
free -h

# Processos
ps aux | grep node
```

### Alertas Automáticos

```bash
# Instalar PM2 Monitoring (grátis)
pm2 install pm2-server-monit

# Configurar alertas
pm2 set pm2-server-monit:smtp_host smtp.gmail.com
pm2 set pm2-server-monit:smtp_port 587
pm2 set pm2-server-monit:smtp_user seu-email@gmail.com
pm2 set pm2-server-monit:smtp_password sua-senha-app
pm2 set pm2-server-monit:target_email alerta@markethub.com.br

# Alertas se CPU > 80% ou RAM > 80%
```

---

## 🚨 TROUBLESHOOTING

### Deploy Falhou

```bash
# Ver logs
pm2 logs markethub-crm --lines 50

# Ver erro específico
pm2 logs markethub-crm --err

# Verificar processo
pm2 status

# Reiniciar
pm2 restart markethub-crm

# Reiniciar do zero
pm2 delete markethub-crm
pm2 start dist/index.js --name markethub-crm
```

### Site Fora do Ar

```bash
# Verificar Nginx
systemctl status nginx
nginx -t

# Verificar aplicação Node
pm2 status
curl http://localhost:3000/api/health

# Verificar porta
netstat -tlnp | grep 3000

# Verificar firewall
ufw status
```

### Banco de Dados Não Conecta

```bash
# Verificar PostgreSQL
systemctl status postgresql

# Testar conexão
psql -U markethub -d markethub_crm -h localhost

# Ver logs do PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log
```

### SSL Expirado

```bash
# Renovar certificado
certbot renew

# Forçar renovação
certbot renew --force-renewal

# Verificar validade
openssl s_client -connect www.markthubcrm.com.br:443 | openssl x509 -noout -dates
```

---

## 💰 CUSTOS HETZNER

### Planos Típicos

| Plano | CPU | RAM | Storage | Preço/mês | Ideal Para |
|-------|-----|-----|---------|-----------|------------|
| **CX21** | 2 vCPU | 4 GB | 40 GB | €5.39 (~R$30) | Staging |
| **CX31** | 2 vCPU | 8 GB | 80 GB | €10.59 (~R$60) | Produção Pequena |
| **CX41** | 4 vCPU | 16 GB | 160 GB | €20.99 (~R$120) | Produção Média |
| **CX51** | 8 vCPU | 32 GB | 240 GB | €41.39 (~R$230) | Produção Grande |

**Seu servidor atual:** Provavelmente CX31 ou CX41

---

## 📋 CHECKLIST DE DEPLOY HETZNER

### Configuração Inicial
- [ ] Servidor Hetzner criado
- [ ] Node.js 20 instalado
- [ ] pnpm instalado
- [ ] PM2 instalado
- [ ] PostgreSQL configurado
- [ ] Nginx instalado e configurado
- [ ] SSL (Certbot) instalado
- [ ] Firewall (UFW) configurado
- [ ] Domínio apontando para IP

### Aplicação
- [ ] Código clonado do GitHub
- [ ] Dependências instaladas
- [ ] Build executado
- [ ] Migrations rodadas
- [ ] .env configurado
- [ ] PM2 configurado e rodando
- [ ] Logs funcionando

### CI/CD
- [ ] SSH key adicionada no GitHub
- [ ] Workflow de deploy criado
- [ ] Deploy automático testado
- [ ] Rollback testado

### Monitoramento
- [ ] PM2 monitoring configurado
- [ ] Logs centralizados
- [ ] Alertas configurados
- [ ] Backup automático configurado

---

## ✅ PRÓXIMOS PASSOS

### 1. Corrigir GitHub Actions (HOJE)
```bash
# Adicionar secrets no GitHub
HETZNER_HOST=[seu-ip]
HETZNER_USER=root
HETZNER_SSH_KEY=[sua-chave-privada]
```

### 2. Implementar Deploy Automático (AMANHÃ)
- Criar workflow `.github/workflows/deploy-hetzner.yml`
- Testar deploy automático
- Configurar rollback

### 3. Configurar Staging (ESTA SEMANA)
- Criar servidor staging ou porta 3001
- Configurar domínio staging
- Deploy automático para staging

### 4. Melhorar Monitoramento (PRÓXIMA SEMANA)
- Integrar com Sentry
- Configurar alertas por email
- Dashboard de métricas

---

## 🎯 COMANDOS ÚTEIS

```bash
# Deploy manual rápido
ssh root@[IP] "cd /var/www/markethub-crm && git pull && pnpm install && pnpm build && pm2 restart markethub-crm"

# Ver logs em tempo real
ssh root@[IP] "pm2 logs markethub-crm --lines 100"

# Backup do banco
ssh root@[IP] "pg_dump -U markethub markethub_crm > backup-$(date +%Y%m%d).sql"

# Verificar status completo
ssh root@[IP] "pm2 status && systemctl status nginx && df -h"

# Atualizar SSL
ssh root@[IP] "certbot renew"
```

---

**Status:** ✅ DOCUMENTAÇÃO COMPLETA PARA HETZNER  
**Servidor:** Hetzner Cloud #113058104  
**Próximo:** Implementar deploy automático via GitHub Actions  

