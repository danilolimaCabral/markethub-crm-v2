# 🌐 Guia de Configuração do Domínio - markethubcrm.manus.space

**Domínio:** markethubcrm.manus.space  
**Data:** 10 de novembro de 2025

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração DNS](#configuração-dns)
3. [Obter Certificado SSL](#obter-certificado-ssl)
4. [Deploy com Domínio](#deploy-com-domínio)
5. [Verificação](#verificação)
6. [Troubleshooting](#troubleshooting)

---

## 💻 Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Servidor Linux com IP público
- ✅ Docker e Docker Compose instalados
- ✅ Acesso ao painel de DNS do domínio manus.space
- ✅ Portas 80 e 443 abertas no firewall

---

## 🔧 Configuração DNS

### Passo 1: Adicionar Registro DNS

Acesse o painel de gerenciamento DNS do domínio `manus.space` e adicione o seguinte registro:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | markethubcrm | IP_DO_SEU_SERVIDOR | 3600 |

**Exemplo:**
```
Tipo: A
Nome: markethubcrm
Valor: 123.45.67.89 (substitua pelo IP real do servidor)
TTL: 3600 (1 hora)
```

### Passo 2: Verificar Propagação DNS

Aguarde alguns minutos e verifique se o DNS está propagado:

```bash
# Verificar resolução DNS
nslookup markethubcrm.manus.space

# Ou usar dig
dig markethubcrm.manus.space

# Ou ping
ping markethubcrm.manus.space
```

**Resultado esperado:** O comando deve retornar o IP do seu servidor.

---

## 🔒 Obter Certificado SSL

Para usar HTTPS, você precisa de um certificado SSL. Vamos usar **Let's Encrypt** (gratuito).

### Opção 1: Certbot (Recomendado)

```bash
# Instalar Certbot
sudo apt update
sudo apt install -y certbot

# Parar Nginx temporariamente (se estiver rodando)
docker compose -f docker-compose.prod.yml stop nginx

# Obter certificado
sudo certbot certonly --standalone \
  -d markethubcrm.manus.space \
  --agree-tos \
  --email seu-email@example.com \
  --non-interactive

# Copiar certificados para o projeto
sudo mkdir -p /home/ubuntu/lexos-hub-web/ssl
sudo cp /etc/letsencrypt/live/markethubcrm.manus.space/fullchain.pem \
   /home/ubuntu/lexos-hub-web/ssl/
sudo cp /etc/letsencrypt/live/markethubcrm.manus.space/privkey.pem \
   /home/ubuntu/lexos-hub-web/ssl/
sudo chown -R $USER:$USER /home/ubuntu/lexos-hub-web/ssl

# Verificar certificados
ls -lh /home/ubuntu/lexos-hub-web/ssl/
```

### Opção 2: Certbot com Docker

```bash
# Criar diretório para certificados
mkdir -p ssl

# Obter certificado usando Docker
docker run -it --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d markethubcrm.manus.space \
  --agree-tos \
  --email seu-email@example.com \
  --non-interactive

# Copiar certificados para local correto
cp ssl/live/markethubcrm.manus.space/fullchain.pem ssl/
cp ssl/live/markethubcrm.manus.space/privkey.pem ssl/
```

### Renovação Automática

Configure um cron job para renovar automaticamente o certificado:

```bash
# Editar crontab
crontab -e

# Adicionar linha para renovar às 3h da manhã todos os dias
0 3 * * * certbot renew --quiet && docker compose -f /home/ubuntu/lexos-hub-web/docker-compose.prod.yml restart nginx
```

---

## 🚀 Deploy com Domínio

### Passo 1: Verificar Estrutura de Arquivos

Certifique-se de que os arquivos estão organizados assim:

```
lexos-hub-web/
├── Dockerfile
├── docker-compose.prod.yml
├── nginx.conf
├── ssl/
│   ├── fullchain.pem
│   └── privkey.pem
└── ... (outros arquivos do projeto)
```

### Passo 2: Configurar Firewall

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Passo 3: Iniciar Serviços

```bash
# Navegar até o diretório do projeto
cd /home/ubuntu/lexos-hub-web

# Build e iniciar com docker-compose de produção
docker compose -f docker-compose.prod.yml up -d --build

# Verificar status
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

### Passo 4: Verificar Containers

```bash
# Listar containers
docker ps

# Deve mostrar 2 containers rodando:
# - markethub-crm (aplicação)
# - markethub-nginx (proxy)
```

---

## ✅ Verificação

### Teste 1: Verificar HTTP → HTTPS Redirect

```bash
# Deve redirecionar para HTTPS
curl -I http://markethubcrm.manus.space
```

**Resultado esperado:** Status 301 (Moved Permanently) redirecionando para HTTPS.

### Teste 2: Verificar HTTPS

```bash
# Deve retornar 200 OK
curl -I https://markethubcrm.manus.space
```

**Resultado esperado:** Status 200 OK.

### Teste 3: Verificar Certificado SSL

```bash
# Verificar validade do certificado
openssl s_client -connect markethubcrm.manus.space:443 -servername markethubcrm.manus.space < /dev/null
```

**Resultado esperado:** Certificado válido emitido por Let's Encrypt.

### Teste 4: Acessar no Navegador

Abra o navegador e acesse:

**https://markethubcrm.manus.space**

Você deve ver:
- ✅ Cadeado verde (SSL válido)
- ✅ Landing page do MarketHub CRM
- ✅ Sem avisos de segurança

### Teste 5: Verificar Health Check

```bash
# Health check do Nginx
curl https://markethubcrm.manus.space/health
```

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

```bash
# Logs de todos os serviços
docker compose -f docker-compose.prod.yml logs -f

# Logs apenas do Nginx
docker compose -f docker-compose.prod.yml logs -f nginx

# Logs apenas da aplicação
docker compose -f docker-compose.prod.yml logs -f markethub-crm
```

### Verificar Status dos Serviços

```bash
# Status dos containers
docker compose -f docker-compose.prod.yml ps

# Status detalhado
docker stats
```

### Acessar Logs do Nginx

Os logs do Nginx são salvos em um volume Docker:

```bash
# Ver logs de acesso
docker exec markethub-nginx tail -f /var/log/nginx/access.log

# Ver logs de erro
docker exec markethub-nginx tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting

### Problema 1: DNS não resolve

**Sintomas:** `nslookup markethubcrm.manus.space` não retorna IP.

**Soluções:**
1. Verificar se o registro DNS foi criado corretamente
2. Aguardar propagação DNS (pode levar até 24h)
3. Limpar cache DNS local: `sudo systemd-resolve --flush-caches`

### Problema 2: Certificado SSL inválido

**Sintomas:** Navegador mostra aviso de certificado inválido.

**Soluções:**
```bash
# Verificar se os certificados existem
ls -lh ssl/

# Verificar permissões
sudo chmod 644 ssl/fullchain.pem
sudo chmod 600 ssl/privkey.pem

# Reiniciar Nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Problema 3: Erro 502 Bad Gateway

**Sintomas:** Nginx retorna erro 502.

**Soluções:**
```bash
# Verificar se a aplicação está rodando
docker ps | grep markethub-crm

# Ver logs da aplicação
docker logs markethub-crm

# Reiniciar serviços
docker compose -f docker-compose.prod.yml restart
```

### Problema 4: Porta 80/443 já em uso

**Sintomas:** Erro "port is already allocated".

**Soluções:**
```bash
# Verificar o que está usando as portas
sudo netstat -tulpn | grep -E ':80|:443'

# Parar Apache (se estiver instalado)
sudo systemctl stop apache2

# Ou parar Nginx instalado no sistema
sudo systemctl stop nginx

# Tentar novamente
docker compose -f docker-compose.prod.yml up -d
```

### Problema 5: Certificado expirado

**Sintomas:** Navegador mostra certificado expirado.

**Soluções:**
```bash
# Renovar certificado manualmente
sudo certbot renew

# Copiar novos certificados
sudo cp /etc/letsencrypt/live/markethubcrm.manus.space/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/markethubcrm.manus.space/privkey.pem ssl/

# Reiniciar Nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 🔄 Comandos Úteis

### Reiniciar Serviços

```bash
# Reiniciar tudo
docker compose -f docker-compose.prod.yml restart

# Reiniciar apenas Nginx
docker compose -f docker-compose.prod.yml restart nginx

# Reiniciar apenas aplicação
docker compose -f docker-compose.prod.yml restart markethub-crm
```

### Atualizar Aplicação

```bash
# Parar serviços
docker compose -f docker-compose.prod.yml down

# Fazer pull das atualizações (se usar Git)
git pull

# Rebuild e reiniciar
docker compose -f docker-compose.prod.yml up -d --build
```

### Limpar e Reiniciar

```bash
# Parar e remover tudo
docker compose -f docker-compose.prod.yml down

# Remover volumes (cuidado!)
docker compose -f docker-compose.prod.yml down -v

# Limpar imagens antigas
docker system prune -a

# Rebuild completo
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📝 Checklist de Deploy

Use este checklist para garantir que tudo está configurado corretamente:

- [ ] DNS configurado e propagado
- [ ] Servidor com IP público
- [ ] Docker e Docker Compose instalados
- [ ] Firewall configurado (portas 80 e 443)
- [ ] Certificado SSL obtido e copiado para pasta `ssl/`
- [ ] Arquivo `nginx.conf` configurado
- [ ] Arquivo `docker-compose.prod.yml` configurado
- [ ] Build da imagem Docker concluído
- [ ] Containers iniciados e rodando
- [ ] HTTP redireciona para HTTPS
- [ ] HTTPS funcionando com certificado válido
- [ ] Health checks passando
- [ ] Sistema acessível pelo domínio
- [ ] Renovação automática de SSL configurada

---

## 🎯 Resultado Final

Após seguir todos os passos, você terá:

✅ **Sistema acessível em:** https://markethubcrm.manus.space  
✅ **SSL válido** com certificado Let's Encrypt  
✅ **Redirecionamento automático** de HTTP para HTTPS  
✅ **Nginx** como reverse proxy  
✅ **Health checks** configurados  
✅ **Logs** centralizados  
✅ **Renovação automática** de certificados

---

## 📞 Suporte

Para mais informações ou problemas, consulte:
- Documentação completa: `GUIA_DEPLOY_DOCKER.md`
- Repositório GitHub: https://github.com/danilolimaCabral/markethub-crm-v2

---

**Desenvolvido com ❤️ usando Manus AI**
