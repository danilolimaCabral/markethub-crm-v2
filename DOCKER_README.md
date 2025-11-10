# 🐳 Deploy Rápido com Docker

## ⚡ Comandos Rápidos

### Opção 1: Script Automatizado (Recomendado)

```bash
# Deploy completo com menu interativo
./deploy.sh

# Ou deploy direto
./deploy.sh full
```

### Opção 2: Docker Compose

```bash
# Build e iniciar
docker compose up -d

# Ver logs
docker compose logs -f

# Parar
docker compose down
```

### Opção 3: Docker Manual

```bash
# Build
docker build -t markethub-crm:latest .

# Executar
docker run -d --name markethub-crm -p 3000:3000 markethub-crm:latest

# Ver logs
docker logs -f markethub-crm
```

## 🌐 Acesso

Após o deploy, acesse:
- **URL:** http://localhost:3000
- **Usuário:** admin
- **Senha:** admin123

## 📚 Documentação Completa

Para instruções detalhadas, consulte: **GUIA_DEPLOY_DOCKER.md**

## 📦 Arquivos Criados

- `Dockerfile` - Imagem Docker otimizada com multi-stage build
- `.dockerignore` - Arquivos excluídos do build
- `docker-compose.yml` - Orquestração de containers
- `deploy.sh` - Script de deploy automatizado
- `GUIA_DEPLOY_DOCKER.md` - Documentação completa

## 🎯 Características

- ✅ Multi-stage build (imagem otimizada)
- ✅ Health check automático
- ✅ Usuário não-root (segurança)
- ✅ Restart automático
- ✅ Logs estruturados
- ✅ Pronto para produção

## 🚀 Deploy em Cloud

### DigitalOcean

```bash
# Criar droplet Ubuntu 22.04
# SSH no servidor
ssh root@seu-servidor

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Clonar repositório
git clone https://github.com/danilolimaCabral/markethub-crm-v2.git
cd markethub-crm-v2

# Deploy
./deploy.sh full
```

### AWS / GCP / Azure

Mesmo processo acima, apenas ajuste o comando de criação da instância conforme a plataforma.

## 🔧 Troubleshooting

### Porta em uso

```bash
# Usar outra porta
docker run -d -p 8080:3000 markethub-crm:latest
```

### Ver logs de erro

```bash
docker logs markethub-crm
```

### Reiniciar container

```bash
docker restart markethub-crm
```

## 📞 Suporte

Para mais informações, consulte a documentação completa ou abra uma issue no GitHub.
