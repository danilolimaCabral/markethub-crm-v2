# Guia de Deploy para Produção
## Markthub CRM - Sistema Pronto para Venda
### Data: 12 de Janeiro de 2026

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Instalação](#instalação)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Deploy](#deploy)
7. [Testes Pós-Deploy](#testes-pós-deploy)
8. [Monitoramento](#monitoramento)
9. [Troubleshooting](#troubleshooting)
10. [Checklist Final](#checklist-final)

---

## 🔧 Pré-requisitos

### Servidor
- **Sistema Operacional:** Ubuntu 20.04+ ou similar
- **CPU:** Mínimo 2 cores
- **RAM:** Mínimo 4GB
- **Disco:** Mínimo 20GB SSD
- **Rede:** Conexão estável com internet

### Software
- **Node.js:** v18.0.0 ou superior
- **PostgreSQL:** v14.0 ou superior
- **Git:** v2.0 ou superior
- **PNPM:** v8.0 ou superior (ou npm/yarn)
- **Nginx:** v1.18 ou superior (opcional, para proxy reverso)

### Domínio e SSL
- Domínio configurado apontando para o servidor
- Certificado SSL (recomendado: Let's Encrypt)

---

## 🌍 Configuração do Ambiente

### 1. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Node.js

```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Instalar PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### 4. Instalar PNPM

```bash
npm install -g pnpm
pnpm --version
```

### 5. Instalar Nginx (Opcional)

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📦 Instalação

### 1. Clonar Repositório

```bash
cd /var/www
sudo git clone https://github.com/danilolimaCabral/markethub-crm-v2.git
cd markethub-crm-v2
```

### 2. Instalar Dependências

```bash
# Backend
pnpm install

# Frontend (se necessário)
cd client
pnpm install
cd ..
```

### 3. Build do Projeto

```bash
# Build do frontend
cd client
pnpm run build
cd ..

# Build do backend (se necessário)
pnpm run build
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Criar Usuário e Banco de Dados

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar usuário
CREATE USER markethub_user WITH PASSWORD 'senha_segura_aqui';

# Criar banco de dados
CREATE DATABASE markethub_crm;

# Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE markethub_crm TO markethub_user;

# Sair
\q
```

### 2. Executar Migrações

```bash
# Configurar variável de ambiente temporária
export DATABASE_URL="postgresql://markethub_user:senha_segura_aqui@localhost:5432/markethub_crm"

# Executar migrações
node scripts/migrate.js

# Ou usar o comando do package.json
pnpm run migrate
```

### 3. Verificar Tabelas

```bash
sudo -u postgres psql -d markethub_crm

# Listar tabelas
\dt

# Verificar estrutura de uma tabela
\d tenants

# Sair
\q
```

---

## 🔐 Variáveis de Ambiente

### 1. Criar Arquivo .env

```bash
cd /var/www/markethub-crm-v2
sudo nano .env
```

### 2. Configurar Variáveis

```env
# Ambiente
NODE_ENV=production
PORT=3000

# Banco de Dados
DATABASE_URL=postgresql://markethub_user:senha_segura_aqui@localhost:5432/markethub_crm

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_com_pelo_menos_32_caracteres

# CORS
CORS_ORIGIN=https://seudominio.com

# APIs Externas
MERCADOLIVRE_CLIENT_ID=seu_client_id
MERCADOLIVRE_CLIENT_SECRET=seu_client_secret

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# Logs
LOG_LEVEL=info
```

### 3. Proteger Arquivo .env

```bash
sudo chmod 600 .env
sudo chown www-data:www-data .env
```

---

## 🚀 Deploy

### Opção 1: PM2 (Recomendado)

#### 1. Instalar PM2

```bash
sudo npm install -g pm2
```

#### 2. Criar Arquivo de Configuração

```bash
sudo nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'markethub-crm',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

#### 3. Iniciar Aplicação

```bash
# Criar diretório de logs
mkdir -p logs

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Verificar status
pm2 status
pm2 logs markethub-crm
```

### Opção 2: Systemd Service

#### 1. Criar Service File

```bash
sudo nano /etc/systemd/system/markethub-crm.service
```

```ini
[Unit]
Description=Markethub CRM
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/markethub-crm-v2
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=markethub-crm
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### 2. Iniciar Service

```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Iniciar serviço
sudo systemctl start markethub-crm

# Habilitar no boot
sudo systemctl enable markethub-crm

# Verificar status
sudo systemctl status markethub-crm

# Ver logs
sudo journalctl -u markethub-crm -f
```

---

## 🌐 Configuração do Nginx

### 1. Criar Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/markethub-crm
```

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logs
    access_log /var/log/nginx/markethub-crm-access.log;
    error_log /var/log/nginx/markethub-crm-error.log;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Arquivos estáticos
    location /assets {
        alias /var/www/markethub-crm-v2/client/dist/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

### 2. Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/markethub-crm /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 3. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Renovação automática já está configurada
sudo certbot renew --dry-run
```

---

## 🧪 Testes Pós-Deploy

### 1. Verificar Aplicação

```bash
# Testar endpoint de health check
curl http://localhost:3000/api/system/health

# Testar via domínio
curl https://seudominio.com/api/system/health
```

### 2. Testar Criação de Tenant

```bash
# Teste com dados inválidos (deve rejeitar)
curl -X POST https://seudominio.com/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"nome_empresa": "Teste"}'

# Teste com dados válidos (deve aceitar)
curl -X POST https://seudominio.com/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "nome_empresa": "Empresa Teste",
    "cnpj": "00000000000191",
    "email_contato": "teste@empresa.com",
    "integrations": ["MercadoLivre"]
  }'
```

### 3. Testar Busca de CNPJ

```bash
curl https://seudominio.com/api/cnpj/00000000000191
```

### 4. Testar Frontend

```bash
# Acessar no navegador
https://seudominio.com

# Verificar páginas
https://seudominio.com/clientes
https://seudominio.com/relatorios
https://seudominio.com/admin-master
```

---

## 📊 Monitoramento

### 1. PM2 Monitoring

```bash
# Instalar PM2 Plus (opcional)
pm2 install pm2-server-monit

# Ver métricas
pm2 monit

# Ver logs em tempo real
pm2 logs markethub-crm --lines 100
```

### 2. Logs do Sistema

```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/markethub-crm-access.log
sudo tail -f /var/log/nginx/markethub-crm-error.log

# Logs da aplicação (PM2)
pm2 logs markethub-crm

# Logs da aplicação (Systemd)
sudo journalctl -u markethub-crm -f
```

### 3. Monitoramento de Recursos

```bash
# CPU e memória
htop

# Espaço em disco
df -h

# Conexões PostgreSQL
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🔧 Troubleshooting

### Problema: Aplicação não inicia

**Solução:**
```bash
# Verificar logs
pm2 logs markethub-crm --err

# Verificar variáveis de ambiente
cat .env

# Verificar permissões
ls -la /var/www/markethub-crm-v2

# Testar manualmente
cd /var/www/markethub-crm-v2
node server/index.js
```

### Problema: Erro de conexão com banco de dados

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -U markethub_user -d markethub_crm -h localhost

# Verificar DATABASE_URL no .env
grep DATABASE_URL .env
```

### Problema: CNPJ não retorna dados

**Solução:**
```bash
# Testar API diretamente
curl https://brasilapi.com.br/api/cnpj/v1/00000000000191

# Verificar logs da aplicação
pm2 logs markethub-crm | grep cnpj

# Verificar se a rota está registrada
curl http://localhost:3000/api/cnpj/00000000000191
```

### Problema: Links quebrados no frontend

**Solução:**
```bash
# Verificar se o build foi feito
ls -la client/dist

# Rebuild do frontend
cd client
pnpm run build
cd ..

# Reiniciar aplicação
pm2 restart markethub-crm
```

---

## ✅ Checklist Final

### Antes do Deploy
- [ ] Código commitado no GitHub
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Banco de dados criado e migrações executadas
- [ ] Testes locais passando (100%)
- [ ] Build do frontend concluído
- [ ] Certificado SSL configurado

### Durante o Deploy
- [ ] Aplicação iniciada com PM2/Systemd
- [ ] Nginx configurado e rodando
- [ ] SSL funcionando (HTTPS)
- [ ] Logs sendo gerados corretamente
- [ ] Aplicação acessível via domínio

### Após o Deploy
- [ ] Endpoint de health check respondendo
- [ ] Criação de tenant funcionando
- [ ] Busca de CNPJ funcionando
- [ ] Links do frontend funcionando
- [ ] Validações obrigatórias ativas
- [ ] Monitoramento configurado

### Validações Críticas
- [ ] CNPJ obrigatório e validado
- [ ] Email obrigatório e validado
- [ ] Integrações obrigatórias
- [ ] Sem emails temporários gerados
- [ ] Todos os links funcionais

---

## 📞 Suporte

### Logs Importantes
```bash
# Aplicação
pm2 logs markethub-crm

# Nginx
sudo tail -f /var/log/nginx/markethub-crm-error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Sistema
sudo journalctl -xe
```

### Comandos Úteis
```bash
# Reiniciar aplicação
pm2 restart markethub-crm

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Ver processos
ps aux | grep node

# Ver portas em uso
sudo netstat -tulpn | grep :3000
```

---

## 🎯 Próximos Passos

### Melhorias Recomendadas
1. **Backup Automático:** Configurar backup diário do banco de dados
2. **Monitoramento Avançado:** Integrar com Datadog, New Relic ou similar
3. **CDN:** Configurar CDN para assets estáticos
4. **Cache:** Implementar Redis para cache
5. **Rate Limiting:** Configurar rate limiting no Nginx
6. **WAF:** Configurar Web Application Firewall
7. **CI/CD:** Configurar pipeline de deploy automático

### Segurança
1. **Firewall:** Configurar UFW/iptables
2. **Fail2Ban:** Proteger contra ataques de força bruta
3. **Atualizações:** Manter sistema e dependências atualizadas
4. **Audit Logs:** Implementar logs de auditoria
5. **2FA:** Implementar autenticação de dois fatores

---

**Status:** ✅ **SISTEMA PRONTO PARA PRODUÇÃO**

Todas as correções foram aplicadas, validações implementadas e o sistema está pronto para ser comercializado.
