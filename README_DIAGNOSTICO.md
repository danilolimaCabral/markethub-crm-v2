# 🔍 Guia de Diagnóstico e Verificação - MarketHub CRM

## 📋 Arquivos Disponíveis

Este repositório contém ferramentas completas para diagnosticar e resolver problemas com a integração do Mercado Livre.

### 📄 Documentação

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| `diagnose-ml-connection.md` | Diagnóstico completo de problemas de conexão | Quando botão "Conectar" não funciona |
| `RELATORIO_SINCRONIZACAO_WEBHOOKS.md` | Relatório de sincronização via webhooks | Para entender o que foi sincronizado |
| `README_WEBHOOKS.md` | Guia completo de webhooks | Para configurar notificações em tempo real |
| `GUIA_WEBHOOKS_MERCADOLIVRE.md` | Passo a passo de configuração | Para registrar webhook no DevCenter |
| `DOCUMENTACAO_TECNICA_WEBHOOKS.md` | Documentação técnica detalhada | Para desenvolvedores |

### 🛠️ Scripts de Verificação

| Script | Descrição | Como Usar |
|--------|-----------|-----------|
| `check-ml-config.cjs` | Verifica configuração e status da integração ML | `node check-ml-config.cjs` |
| `check-webhooks.cjs` | Verifica webhooks recebidos e sincronização | `node check-webhooks.cjs` |
| `test-webhook.cjs` | Testa endpoint de webhook | `node test-webhook.cjs order` |

### 📊 Queries SQL

| Arquivo | Descrição | Como Usar |
|---------|-----------|-----------|
| `check-webhooks.sql` | Queries para análise de webhooks no banco | `psql $DATABASE_URL -f check-webhooks.sql` |

---

## 🚀 Quick Start

### Problema: Botão "Conectar" Não Funciona

```bash
# 1. Ler diagnóstico
cat diagnose-ml-connection.md

# 2. Aguardar rate limit (10-15 min)
sleep 900

# 3. Verificar configuração
node check-ml-config.cjs

# 4. Verificar logs
railway logs | grep "auth"
```

### Problema: Produtos Não Aparecem

```bash
# 1. Verificar se está conectado
node check-ml-config.cjs

# 2. Se conectado, verificar sincronização
node check-webhooks.cjs

# 3. Ver logs de sincronização
railway logs | grep "sync"
```

### Problema: Webhooks Não Chegam

```bash
# 1. Testar endpoint
node test-webhook.cjs order

# 2. Verificar webhooks recebidos
node check-webhooks.cjs

# 3. Ver logs de webhook
railway logs | grep "webhook"
```

---

## 📖 Guias Detalhados

### 1. Configurar Integração do Mercado Livre

**Passo a passo completo em:** `diagnose-ml-connection.md`

**Resumo:**
1. Obter credenciais no DevCenter do ML
2. Configurar no Railway (ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI)
3. Clicar em "Conectar com Mercado Livre"
4. Autorizar acesso no ML
5. Sincronizar produtos e pedidos

### 2. Configurar Webhooks

**Passo a passo completo em:** `GUIA_WEBHOOKS_MERCADOLIVRE.md`

**Resumo:**
1. Acessar DevCenter do ML
2. Ir em "Notificações"
3. Adicionar URL: `https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook`
4. Selecionar tópicos: orders_v2, items, questions, messages
5. Testar com: `node test-webhook.cjs all`

### 3. Verificar Sincronização

**Passo a passo completo em:** `RELATORIO_SINCRONIZACAO_WEBHOOKS.md`

**Resumo:**
1. Executar: `node check-ml-config.cjs`
2. Verificar status da conexão
3. Verificar produtos sincronizados
4. Verificar pedidos no sistema
5. Executar sincronização manual se necessário

---

## 🔧 Comandos Úteis

### Verificação de Status

```bash
# Status completo da integração
node check-ml-config.cjs

# Webhooks recebidos
node check-webhooks.cjs

# Testar webhook
node test-webhook.cjs order
```

### Logs do Railway

```bash
# Ver todos os logs
railway logs --tail 100

# Filtrar por tipo
railway logs | grep "webhook"
railway logs | grep "auth"
railway logs | grep "sync"
railway logs | grep "erro"
```

### Variáveis de Ambiente

```bash
# Listar variáveis
railway variables

# Verificar se credenciais ML existem
railway variables | grep ML_
```

### Banco de Dados

```bash
# Executar queries de verificação
psql $DATABASE_URL -f check-webhooks.sql

# Verificar integração ativa
psql $DATABASE_URL -c "SELECT * FROM marketplace_integrations WHERE marketplace = 'mercado_livre';"

# Verificar produtos
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products WHERE marketplace = 'mercado_livre';"
```

---

## 🐛 Troubleshooting

### Erro: 429 Too Many Requests

**Causa:** Rate limiting ativo devido a muitas requisições

**Solução:**
```bash
# Aguardar 10-15 minutos
sleep 900

# Testar novamente
node check-ml-config.cjs
```

### Erro: "Erro ao iniciar conexão com Mercado Livre"

**Causas possíveis:**
- Credenciais não configuradas
- Credenciais inválidas
- Rate limit ativo

**Solução:**
```bash
# 1. Verificar credenciais no Railway
railway variables | grep ML_

# 2. Ver logs de erro
railway logs | grep "Erro ao gerar URL"

# 3. Aguardar rate limit
sleep 900

# 4. Tentar novamente
```

### Produtos Não Aparecem

**Causas possíveis:**
- Não conectado ao ML
- Sincronização não executada
- Token expirado

**Solução:**
```bash
# 1. Verificar conexão
node check-ml-config.cjs

# 2. Se conectado, executar sync manual na interface
# Ou via API:
curl -X POST https://www.markthubcrm.com.br/api/integrations/mercadolivre/sync/products \
  -H "Authorization: Bearer SEU_TOKEN"

# 3. Verificar logs
railway logs | grep "sync"
```

### Webhooks Não Chegam

**Causas possíveis:**
- Webhook não registrado no DevCenter
- URL incorreta
- Sistema offline

**Solução:**
```bash
# 1. Testar endpoint
node test-webhook.cjs order

# 2. Verificar se está acessível
curl -I https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook

# 3. Ver logs
railway logs | grep "webhook"

# 4. Verificar registro no DevCenter ML
# Acessar: https://developers.mercadolivre.com.br/
```

---

## 📊 Métricas e Monitoramento

### Verificar Taxa de Sucesso de Webhooks

```sql
-- Via SQL
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
  AND started_at > NOW() - INTERVAL '24 hours';
```

### Verificar Últimas Sincronizações

```bash
# Via script
node check-webhooks.cjs

# Via logs
railway logs | grep "sincronizado" | tail -20
```

### Verificar Produtos e Pedidos

```bash
# Via script
node check-ml-config.cjs

# Via SQL
psql $DATABASE_URL -c "
SELECT 
  'Produtos' as tipo, COUNT(*) as total 
FROM products WHERE marketplace = 'mercado_livre'
UNION ALL
SELECT 
  'Pedidos' as tipo, COUNT(*) as total 
FROM orders WHERE marketplace = 'mercado_livre';
"
```

---

## 📞 Suporte

### Documentação

- [Diagnóstico de Conexão](./diagnose-ml-connection.md)
- [Relatório de Sincronização](./RELATORIO_SINCRONIZACAO_WEBHOOKS.md)
- [Guia de Webhooks](./GUIA_WEBHOOKS_MERCADOLIVRE.md)
- [Documentação Técnica](./DOCUMENTACAO_TECNICA_WEBHOOKS.md)

### Logs e Debug

```bash
# Logs em tempo real
railway logs --tail 100

# Logs de erro
railway logs | grep -i "error\|erro"

# Logs de webhook
railway logs | grep "webhook"

# Logs de autenticação
railway logs | grep "auth"
```

### Links Úteis

- [DevCenter Mercado Livre](https://developers.mercadolivre.com.br/)
- [Railway Dashboard](https://railway.app/)
- [GitHub Repository](https://github.com/danilolimaCabral/markethub-crm-v2)

---

## ✅ Checklist de Verificação

Use este checklist para diagnosticar problemas:

### Conexão OAuth2

- [ ] Credenciais configuradas no Railway (ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI)
- [ ] Rate limit não está ativo (aguardar 10-15min)
- [ ] Botão "Conectar" funciona
- [ ] Redirecionamento para ML funciona
- [ ] Callback retorna com sucesso
- [ ] Token salvo no banco de dados

### Sincronização de Produtos

- [ ] Conectado ao ML (verificar com `node check-ml-config.cjs`)
- [ ] Token não expirado
- [ ] Sincronização manual executada
- [ ] Produtos aparecem na interface
- [ ] Dados corretos (preço, estoque, etc.)

### Webhooks

- [ ] Webhook registrado no DevCenter ML
- [ ] URL correta: `https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook`
- [ ] Tópicos selecionados (orders_v2, items, questions, messages)
- [ ] Endpoint acessível (testar com `node test-webhook.cjs`)
- [ ] Webhooks sendo recebidos (verificar com `node check-webhooks.cjs`)
- [ ] Notificações processadas com sucesso

---

## 🎯 Próximos Passos

1. **Aguardar rate limit** (se necessário)
2. **Verificar credenciais** no Railway
3. **Conectar ao ML** via interface
4. **Sincronizar produtos** manualmente
5. **Registrar webhooks** no DevCenter
6. **Monitorar** sincronização automática

---

**Última atualização:** 15 de dezembro de 2025  
**Versão:** 1.0.0  
**Status:** ✅ Ferramentas Completas
