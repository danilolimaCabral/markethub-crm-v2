# Deploy Rápido - Markthub CRM V2

## 🚀 Deploy em 30 Minutos

Este guia mostra como fazer o deploy do Markthub CRM V2 rapidamente em produção.

---

## 📋 Pré-requisitos

- [ ] Conta no Railway/Render/Vercel (ou servidor VPS)
- [ ] Conta no Mercado Livre Developers
- [ ] Domínio próprio (opcional mas recomendado)
- [ ] Conta PostgreSQL (ou usar o do Railway)

---

## Opção 1: Deploy no Railway (Recomendado)

### Passo 1: Preparar Repositório

```bash
# Clonar o repositório
git clone https://github.com/danilolimaCabral/markethub-crm-v2.git
cd markethub-crm-v2

# Fazer push para seu próprio repositório
git remote set-url origin https://github.com/SEU_USUARIO/markethub-crm-v2.git
git push -u origin main
```

### Passo 2: Criar Projeto no Railway

1. Acesse https://railway.app
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório `markethub-crm-v2`

### Passo 3: Adicionar PostgreSQL

1. No projeto Railway, clique em "+ New"
2. Selecione "Database" → "PostgreSQL"
3. Aguarde provisionamento (1-2 min)

### Passo 4: Configurar Variáveis de Ambiente

No Railway, vá em Settings → Variables e adicione:

```env
# Aplicação
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://seu-dominio.railway.app

# Banco de Dados (auto-preenchido pelo Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT (GERAR NOVOS!)
JWT_SECRET=GERAR_STRING_ALEATORIA_32_CHARS
JWT_REFRESH_SECRET=GERAR_STRING_ALEATORIA_32_CHARS

# Mercado Livre
ML_CLIENT_ID=seu_client_id
ML_CLIENT_SECRET=seu_client_secret
ML_REDIRECT_URI=https://seu-dominio.railway.app/api/integrations/mercadolivre/callback

# Super Admin
SUPER_ADMIN_USER=admin
SUPER_ADMIN_PASS=SENHA_FORTE_AQUI
```

**Gerar JWT Secrets:**
```bash
# No terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Passo 5: Deploy

1. Railway fará deploy automaticamente
2. Aguarde build (3-5 min)
3. Acesse a URL fornecida

### Passo 6: Configurar Domínio (Opcional)

1. No Railway, vá em Settings → Domains
2. Clique em "Generate Domain" ou adicione domínio customizado
3. Configure DNS do seu domínio:
   - CNAME: `seu-app.railway.app`

---

## Opção 2: Deploy em VPS (Ubuntu)

### Passo 1: Conectar ao Servidor

```bash
ssh root@seu-servidor.com
```

### Passo 2: Instalar Dependências

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Nginx
apt install -y nginx

# Instalar Certbot (SSL)
apt install -y certbot python3-certbot-nginx
```

### Passo 3: Configurar PostgreSQL

```bash
# Criar banco de dados
sudo -u postgres psql
```

```sql
CREATE DATABASE markethub_crm;
CREATE USER markethub WITH PASSWORD 'senha_forte_aqui';
GRANT ALL PRIVILEGES ON DATABASE markethub_crm TO markethub;
\q
```

### Passo 4: Clonar e Configurar Aplicação

```bash
# Criar usuário para aplicação
adduser markethub
su - markethub

# Clonar repositório
git clone https://github.com/danilolimaCabral/markethub-crm-v2.git
cd markethub-crm-v2

# Instalar dependências
pnpm install

# Configurar .env
cp .env.example .env
nano .env
# Editar com suas configurações

# Build
pnpm build
```

### Passo 5: Configurar PM2 (Process Manager)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

### Passo 6: Configurar Nginx

```bash
# Voltar para root
exit

# Criar configuração Nginx
nano /etc/nginx/sites-available/markethub
```

Cole:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

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
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/markethub /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Passo 7: Configurar SSL

```bash
# Obter certificado SSL
certbot --nginx -d seu-dominio.com

# Renovação automática já está configurada
```

---

## Opção 3: Deploy no Vercel (Frontend) + Railway (Backend)

### Frontend no Vercel

1. Acesse https://vercel.com
2. Import repository
3. Configure:
   - Framework Preset: Vite
   - Build Command: `pnpm build`
   - Output Directory: `dist/public`
4. Deploy

### Backend no Railway

Siga os passos da Opção 1, mas apenas para o backend.

---

## ✅ Checklist Pós-Deploy

### Testes Essenciais

- [ ] Acessar URL e ver landing page
- [ ] Criar conta de teste
- [ ] Fazer login
- [ ] Conectar com Mercado Livre (usar credenciais de teste)
- [ ] Sincronizar pedidos de teste
- [ ] Verificar dashboard com dados
- [ ] Testar criação de produto
- [ ] Verificar logs no servidor

### Segurança

- [ ] HTTPS funcionando (cadeado verde)
- [ ] Variáveis de ambiente não expostas
- [ ] Backup automático configurado
- [ ] Firewall configurado (se VPS)
- [ ] Rate limiting ativo

### Monitoramento

- [ ] Configurar alertas de erro (Sentry)
- [ ] Monitorar uso de recursos
- [ ] Configurar backup diário do banco
- [ ] Testar restauração de backup

---

## 🆘 Troubleshooting

### Erro: "Cannot connect to database"

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Verificar conexão
psql -U markethub -d markethub_crm -h localhost
```

### Erro: "Port 3000 already in use"

**Solução:**
```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 PID
```

### Erro: "Mercado Livre redirect URI mismatch"

**Solução:**
1. Verificar URL exata no .env
2. Atualizar no painel do ML Developers
3. Reiniciar aplicação

### Site não carrega (502 Bad Gateway)

**Solução:**
```bash
# Verificar se aplicação está rodando
pm2 status

# Ver logs
pm2 logs

# Reiniciar
pm2 restart all
```

---

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
pm2 logs

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs da aplicação
tail -f /home/markethub/markethub-crm-v2/logs/app.log
```

### Métricas

```bash
# Uso de recursos
pm2 monit

# Espaço em disco
df -h

# Memória
free -h

# Processos
htop
```

---

## 🔄 Atualizações

### Atualizar Aplicação

```bash
# Conectar ao servidor
ssh markethub@seu-servidor.com

# Ir para diretório
cd markethub-crm-v2

# Backup antes de atualizar
pg_dump markethub_crm > backup_$(date +%Y%m%d).sql

# Atualizar código
git pull origin main

# Instalar novas dependências
pnpm install

# Rebuild
pnpm build

# Reiniciar
pm2 restart all
```

---

## 📞 Suporte

**Problemas técnicos:**
- GitHub Issues: https://github.com/danilolimaCabral/markethub-crm-v2/issues
- Email: suporte@markethubcrm.com.br

**Documentação completa:**
- Ver `GUIA_DEPLOY_RAILWAY.md`
- Ver `GUIA_PRODUCAO.md`

---

**Tempo estimado de deploy:** 30-45 minutos  
**Dificuldade:** Intermediária  
**Versão**: 1.0
