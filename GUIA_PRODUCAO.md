# MarketHub CRM - Guia de Preparação para Produção

**Autor:** Manus AI  
**Data:** Janeiro 2025  
**Versão:** 1.0

---

## Sumário Executivo

Este documento fornece um guia completo para preparar o **MarketHub CRM** para ambiente de produção (ADP). O sistema está desenvolvido com React 19, Tailwind CSS 4 e arquitetura frontend-only com localStorage, pronto para ser conectado a um backend PostgreSQL.

---

## 1. Checklist de Pré-Produção

### 1.1 Otimizações de Performance

**Build de Produção**

O sistema utiliza Vite como bundler, que automaticamente otimiza o código para produção. Execute o comando de build:

```bash
pnpm build
```

Este comando gera a pasta `dist/` com:
- JavaScript minificado e tree-shaken
- CSS otimizado e purgado
- Assets com hash para cache busting
- Chunks separados para lazy loading

**Otimizações Aplicadas**

- **Code Splitting**: Rotas carregadas sob demanda
- **Tree Shaking**: Remoção de código não utilizado
- **Minificação**: JavaScript e CSS compactados
- **Compressão de Imagens**: Logos otimizadas
- **Lazy Loading**: Componentes carregados quando necessário

### 1.2 Variáveis de Ambiente

Crie arquivo `.env.production` na raiz do projeto:

```env
# Informações do App
VITE_APP_TITLE=MarketHub CRM
VITE_APP_LOGO=/logo-markethub-v2.png

# URLs de API (configurar quando backend estiver pronto)
VITE_API_URL=https://api.markethub.com
VITE_API_KEY=sua_chave_api_aqui

# OAuth (se necessário)
VITE_OAUTH_PORTAL_URL=https://auth.markethub.com
VITE_APP_ID=seu_app_id_aqui

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=https://analytics.markethub.com
VITE_ANALYTICS_WEBSITE_ID=seu_website_id_aqui

# Feature Flags
VITE_ENABLE_2FA=true
VITE_ENABLE_MARKETPLACE_SYNC=true
```

### 1.3 Segurança

**Proteções Implementadas**

- ✅ Autenticação com hash bcrypt
- ✅ 2FA com TOTP (Google Authenticator)
- ✅ Sistema de permissões granulares
- ✅ Validação de inputs
- ✅ Proteção contra XSS (React sanitiza automaticamente)
- ✅ HTTPS obrigatório em produção

**Recomendações Adicionais**

1. **CSP (Content Security Policy)**: Adicionar headers no servidor
2. **Rate Limiting**: Implementar no backend quando conectado
3. **CORS**: Configurar origens permitidas
4. **Secrets Management**: Usar variáveis de ambiente, nunca hardcode

### 1.4 Banco de Dados

**Scripts Disponíveis**

O sistema inclui estrutura completa PostgreSQL em `/database/`:

- `01_create_tables.sql` - Criação de todas as tabelas
- `02_triggers_functions.sql` - Triggers e functions automáticas
- `03_views.sql` - Views para relatórios e analytics
- `04_seed_data.sql` - Dados iniciais e usuário admin

**Executar em Ordem**

```bash
# 1. Criar database
createdb markethub_crm

# 2. Executar scripts
psql -d markethub_crm -f database/01_create_tables.sql
psql -d markethub_crm -f database/02_triggers_functions.sql
psql -d markethub_crm -f database/03_views.sql
psql -d markethub_crm -f database/04_seed_data.sql
```

**Credenciais Padrão**

Após executar seed:
- **Usuário**: admin
- **Senha**: admin123
- ⚠️ **ALTERAR NO PRIMEIRO LOGIN!**

---

## 2. Opções de Deploy

### 2.1 Vercel (Recomendado para Frontend)

**Vantagens**
- Deploy automático via Git
- CDN global
- SSL gratuito
- Serverless functions para API
- Zero configuração

**Passos**

1. Criar conta em [vercel.com](https://vercel.com)
2. Conectar repositório GitHub/GitLab
3. Configurar variáveis de ambiente
4. Deploy automático a cada push

**Configuração** (`vercel.json`):

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2.2 Netlify

**Vantagens**
- Interface simples
- Deploy previews
- Forms e Functions integradas
- SSL gratuito

**Configuração** (`netlify.toml`):

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2.3 VPS (Servidor Próprio)

**Recomendado para controle total e backend integrado**

**Requisitos Mínimos**
- 2 vCPU
- 4 GB RAM
- 40 GB SSD
- Ubuntu 22.04 LTS

**Stack Completa**

```
┌─────────────────────────────────┐
│   Nginx (Reverse Proxy + SSL)  │
├─────────────────────────────────┤
│   Frontend (React - Porta 3000)│
├─────────────────────────────────┤
│   Backend API (Node - Porta 4000)│
├─────────────────────────────────┤
│   PostgreSQL (Porta 5432)       │
└─────────────────────────────────┘
```

**Instalação Passo a Passo**

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 4. Instalar Nginx
sudo apt install -y nginx

# 5. Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# 6. Clonar projeto
git clone https://github.com/seu-usuario/markethub-crm.git
cd markethub-crm

# 7. Instalar dependências
npm install -g pnpm
pnpm install

# 8. Build de produção
pnpm build

# 9. Configurar PostgreSQL
sudo -u postgres psql
CREATE DATABASE markethub_crm;
CREATE USER markethub WITH PASSWORD 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE markethub_crm TO markethub;
\q

# 10. Executar scripts SQL
psql -U markethub -d markethub_crm -f database/01_create_tables.sql
psql -U markethub -d markethub_crm -f database/02_triggers_functions.sql
psql -U markethub -d markethub_crm -f database/03_views.sql
psql -U markethub -d markethub_crm -f database/04_seed_data.sql

# 11. Configurar Nginx
sudo nano /etc/nginx/sites-available/markethub
```

**Configuração Nginx**:

```nginx
server {
    listen 80;
    server_name markethub.com www.markethub.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name markethub.com www.markethub.com;

    # SSL (usar Certbot para gerar)
    ssl_certificate /etc/letsencrypt/live/markethub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/markethub.com/privkey.pem;

    # Frontend
    root /home/ubuntu/markethub-crm/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend (quando implementar)
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# 12. Ativar site
sudo ln -s /etc/nginx/sites-available/markethub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 13. Configurar SSL com Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d markethub.com -d www.markethub.com

# 14. Configurar firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2.4 Docker (Containerização)

**Dockerfile**:

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backend:4000
    depends_on:
      - backend

  backend:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - ./backend:/app
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://markethub:senha@db:5432/markethub_crm
    depends_on:
      - db
    command: npm start

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=markethub_crm
      - POSTGRES_USER=markethub
      - POSTGRES_PASSWORD=senha_segura_aqui
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 3. Monitoramento e Manutenção

### 3.1 Logs

**Nginx Logs**:
```bash
# Acessar logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**PM2 Logs** (se usar backend Node):
```bash
pm2 logs
pm2 monit
```

### 3.2 Backup

**Banco de Dados**:

```bash
# Backup diário automático
sudo crontab -e

# Adicionar linha:
0 2 * * * pg_dump -U markethub markethub_crm > /backup/markethub_$(date +\%Y\%m\%d).sql
```

**Arquivos**:

```bash
# Backup semanal
0 3 * * 0 tar -czf /backup/markethub_files_$(date +\%Y\%m\%d).tar.gz /home/ubuntu/markethub-crm
```

### 3.3 Atualizações

```bash
# 1. Fazer backup
pg_dump -U markethub markethub_crm > backup_pre_update.sql

# 2. Pull das mudanças
git pull origin main

# 3. Instalar dependências
pnpm install

# 4. Build
pnpm build

# 5. Reiniciar serviços
sudo systemctl restart nginx
pm2 restart all
```

---

## 4. Performance e Otimização

### 4.1 CDN

**Cloudflare (Recomendado)**

- Cache automático de assets
- DDoS protection
- SSL gratuito
- Minificação automática

**Configuração**:
1. Criar conta em [cloudflare.com](https://cloudflare.com)
2. Adicionar domínio
3. Atualizar nameservers
4. Ativar "Auto Minify" e "Brotli"

### 4.2 Caching

**Nginx Cache**:

```nginx
# Adicionar no server block
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4.3 Compressão

**Brotli** (melhor que Gzip):

```bash
# Instalar módulo Brotli
sudo apt install -y nginx-module-brotli

# Adicionar no nginx.conf
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

---

## 5. Migração de localStorage para PostgreSQL

### 5.1 Estrutura Atual

O sistema usa localStorage para:
- Autenticação (tokens, usuário logado)
- Dados de usuários
- Permissões
- Custos variáveis
- Histórico de importações

### 5.2 Plano de Migração

**Fase 1: Backend API**

Criar API REST com Node.js + Express + Prisma:

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id String @id @default(uuid())
  username String @unique
  email String @unique
  passwordHash String
  fullName String
  role String
  isActive Boolean @default(true)
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  permissions UserPermission[]
  auditLogs AuditLog[]
}

// ... outros models
```

**Fase 2: Endpoints**

```typescript
// src/routes/auth.ts
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Validar credenciais
  // Gerar JWT
  // Retornar token
});

router.post('/register', async (req, res) => {
  // Criar usuário
});

router.post('/verify-2fa', async (req, res) => {
  // Validar código TOTP
});

// src/routes/users.ts
router.get('/users', authenticate, authorize('usuarios'), async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// ... outros endpoints
```

**Fase 3: Atualizar Frontend**

Substituir localStorage por chamadas API:

```typescript
// Antes (localStorage)
const users = JSON.parse(localStorage.getItem('markethub_users') || '[]');

// Depois (API)
const users = await fetch('/api/users', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());
```

---

## 6. Checklist Final

### Antes do Deploy

- [ ] Build de produção executado sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e populado
- [ ] SSL configurado (HTTPS)
- [ ] Domínio apontando para servidor
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Logs funcionando
- [ ] Testes de carga realizados
- [ ] Senha do admin alterada

### Pós-Deploy

- [ ] Testar login
- [ ] Testar criação de usuário
- [ ] Testar permissões
- [ ] Testar 2FA
- [ ] Verificar performance (< 2s load time)
- [ ] Testar em mobile
- [ ] Configurar monitoramento (UptimeRobot, etc)
- [ ] Documentar credenciais em local seguro

---

## 7. Suporte e Manutenção

### Contatos

- **Documentação**: `/DOCUMENTACAO_COMPLETA.md`
- **Banco de Dados**: `/DATABASE_STRUCTURE.md`
- **Comercialização**: `/COMERCIALIZACAO.md`

### Recursos Adicionais

- [Documentação React](https://react.dev)
- [Documentação Vite](https://vitejs.dev)
- [Documentação PostgreSQL](https://www.postgresql.org/docs/)
- [Documentação Nginx](https://nginx.org/en/docs/)

---

**Sistema pronto para produção!** 🚀
