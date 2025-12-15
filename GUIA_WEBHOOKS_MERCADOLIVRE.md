# Guia de Configuração de Webhooks do Mercado Livre

## 📋 Visão Geral

Este guia explica como configurar webhooks do Mercado Livre para receber notificações em tempo real sobre pedidos, perguntas, mensagens e alterações de produtos no seu CRM MarketHub.

Os webhooks permitem que o sistema seja notificado automaticamente quando eventos importantes ocorrem no Mercado Livre, eliminando a necessidade de sincronização manual ou polling constante.

---

## 🎯 Eventos Suportados

O sistema está preparado para processar os seguintes tipos de notificações:

| Tópico | Descrição | Quando é disparado |
|--------|-----------|-------------------|
| `orders_v2` | Pedidos | Novo pedido, mudança de status, pagamento confirmado |
| `items` | Produtos | Produto criado, atualizado, pausado ou finalizado |
| `questions` | Perguntas | Nova pergunta de cliente sobre produto |
| `messages` | Mensagens | Nova mensagem no chat de vendas |
| `payments` | Pagamentos | Confirmação ou cancelamento de pagamento |
| `shipments` | Envios | Atualização de status de envio |

---

## 🔧 Pré-requisitos

Antes de configurar os webhooks, certifique-se de que:

1. ✅ Você possui uma conta de desenvolvedor no Mercado Livre
2. ✅ Sua aplicação está criada no [Mercado Livre Developers](https://developers.mercadolivre.com.br/)
3. ✅ Você tem acesso ao painel de configuração da aplicação
4. ✅ O sistema MarketHub CRM está implantado e acessível publicamente
5. ✅ Você já realizou a autenticação OAuth2 e conectou sua conta ML ao CRM

---

## 📍 URL do Webhook

A URL do webhook do seu sistema é:

```
https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook
```

**Importante:** Esta URL é pública (não requer autenticação) para que o Mercado Livre possa enviar notificações.

---

## 🚀 Passo a Passo: Configuração no DevCenter

### Passo 1: Acessar o Painel de Desenvolvedores

1. Acesse [https://developers.mercadolivre.com.br/](https://developers.mercadolivre.com.br/)
2. Faça login com sua conta do Mercado Livre
3. Clique em **"Suas aplicações"** no menu superior
4. Selecione sua aplicação (ou crie uma nova se necessário)

### Passo 2: Configurar Notificações

1. No menu lateral da aplicação, clique em **"Notificações"** ou **"Webhooks"**
2. Você verá a seção de configuração de notificações IPN (Instant Payment Notification)

### Passo 3: Registrar a URL do Webhook

Existem duas formas de registrar webhooks no Mercado Livre:

#### Opção A: Via Interface Web (Recomendado)

1. Na seção de notificações, localize o campo **"URL de notificações"**
2. Insira a URL: `https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook`
3. Selecione os tópicos que deseja receber:
   - ✅ **orders_v2** (Pedidos)
   - ✅ **items** (Produtos)
   - ✅ **questions** (Perguntas)
   - ✅ **messages** (Mensagens)
4. Clique em **"Salvar"** ou **"Ativar notificações"**

#### Opção B: Via API (Programático)

Se preferir configurar via API, use o seguinte endpoint:

```bash
POST https://api.mercadolibre.com/applications/{APP_ID}/notifications/subscriptions
```

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "url": "https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook",
  "topics": ["orders_v2", "items", "questions", "messages"]
}
```

**Exemplo com cURL:**
```bash
curl -X POST \
  'https://api.mercadolibre.com/applications/YOUR_APP_ID/notifications/subscriptions' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook",
    "topics": ["orders_v2", "items", "questions", "messages"]
  }'
```

### Passo 4: Verificar Configuração

Após salvar, você deve ver a URL registrada na lista de webhooks ativos. O Mercado Livre pode enviar uma notificação de teste para validar que a URL está acessível.

---

## 🔍 Como Funciona

### Fluxo de Notificação

```
┌─────────────────┐
│  Mercado Livre  │
│   (Evento)      │
└────────┬────────┘
         │
         │ POST /webhook
         ▼
┌─────────────────┐
│  MarketHub CRM  │
│  (Recebe)       │
└────────┬────────┘
         │
         │ 1. Valida estrutura
         │ 2. Retorna 200 OK
         │ 3. Processa assincronamente
         ▼
┌─────────────────┐
│   Banco de      │
│   Dados         │
│  (Atualiza)     │
└─────────────────┘
```

### Estrutura da Notificação

O Mercado Livre envia notificações no seguinte formato:

```json
{
  "_id": "123456789",
  "resource": "/orders/1234567890",
  "user_id": 123456789,
  "topic": "orders_v2",
  "application_id": 1234567890,
  "attempts": 1,
  "sent": "2025-12-15T10:30:00.000Z",
  "received": "2025-12-15T10:30:00.500Z"
}
```

**Campos importantes:**
- `topic`: Tipo de evento (orders_v2, items, questions, etc.)
- `resource`: URL do recurso afetado (ex: `/orders/1234567890`)
- `user_id`: ID do usuário vendedor no ML
- `attempts`: Número de tentativas de envio (ML tenta até 12 vezes)

---

## 🔐 Segurança

### Validações Implementadas

O sistema realiza as seguintes validações:

1. **Validação de estrutura**: Verifica se a notificação contém todos os campos obrigatórios
2. **Validação de tenant**: Confirma que existe uma integração ativa para o `user_id` recebido
3. **Log de auditoria**: Todas as notificações são registradas no banco de dados
4. **Processamento assíncrono**: Responde imediatamente (200 OK) e processa em background

### Boas Práticas

- ✅ O webhook é público, mas valida a estrutura da notificação
- ✅ Responde em menos de 3 segundos (requisito do ML)
- ✅ Processa eventos de forma idempotente (pode receber duplicados)
- ✅ Registra logs para auditoria e debugging

---

## 🧪 Testando os Webhooks

### Teste 1: Verificar se a URL está acessível

```bash
curl -X POST https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "test-123",
    "resource": "/orders/test",
    "user_id": 123456,
    "topic": "orders_v2",
    "application_id": 123456,
    "attempts": 1,
    "sent": "2025-12-15T10:00:00.000Z",
    "received": "2025-12-15T10:00:00.000Z"
  }'
```

**Resposta esperada:**
```json
{
  "success": true
}
```

### Teste 2: Simular um pedido real

1. Faça uma compra de teste na sua loja do Mercado Livre
2. Aguarde alguns segundos
3. Verifique nos logs do sistema se a notificação foi recebida
4. Confirme que o pedido foi sincronizado no CRM

### Teste 3: Verificar logs no banco de dados

```sql
-- Ver últimas notificações recebidas
SELECT * FROM marketplace_sync_log 
WHERE sync_type LIKE 'webhook_%' 
ORDER BY started_at DESC 
LIMIT 10;
```

---

## 📊 Monitoramento

### Verificar Webhooks Registrados

Para listar todos os webhooks configurados na sua aplicação:

```bash
curl -X GET \
  'https://api.mercadolibre.com/applications/YOUR_APP_ID/notifications/subscriptions' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### Logs de Notificações

Todas as notificações recebidas são registradas na tabela `marketplace_sync_log`:

```sql
SELECT 
  sync_type,
  status,
  details,
  started_at,
  completed_at
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
ORDER BY started_at DESC;
```

### Métricas Importantes

- **Taxa de sucesso**: Porcentagem de webhooks processados com sucesso
- **Tempo de resposta**: Deve ser < 3 segundos
- **Tentativas**: ML tenta até 12 vezes se falhar

---

## 🐛 Troubleshooting

### Problema: Webhooks não estão sendo recebidos

**Possíveis causas:**

1. **URL não está acessível publicamente**
   - Teste: `curl https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook`
   - Solução: Verifique se o servidor está online e acessível

2. **Webhook não foi registrado corretamente**
   - Verifique no DevCenter do ML se a URL está salva
   - Tente remover e adicionar novamente

3. **Firewall bloqueando requisições do ML**
   - Solução: Adicione os IPs do Mercado Livre à whitelist
   - IPs do ML: Consulte a documentação oficial

4. **Certificado SSL inválido**
   - O ML requer HTTPS válido
   - Verifique: `curl -v https://www.markthubcrm.com.br`

### Problema: Webhooks recebidos mas não processados

**Verificações:**

1. **Checar logs do servidor:**
   ```bash
   # Ver logs do Railway
   railway logs
   ```

2. **Verificar estrutura da notificação:**
   - A notificação pode estar em formato diferente
   - Adicione logs temporários para debug

3. **Validar token de acesso:**
   - O access_token pode ter expirado
   - Faça refresh do token OAuth2

### Problema: Notificações duplicadas

**Comportamento esperado:** O ML pode enviar a mesma notificação múltiplas vezes (até 12 tentativas).

**Solução:** O sistema já trata isso de forma idempotente - processar a mesma notificação várias vezes não causa problemas.

---

## 📚 Referências

### Documentação Oficial

- [Mercado Livre - Notificações IPN](https://developers.mercadolivre.com.br/pt_br/notificacoes-ipn)
- [Mercado Livre - API de Notificações](https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br)
- [Tópicos de Notificação](https://developers.mercadolivre.com.br/pt_br/notificacoes-ipn#topics)

### Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/applications/{app_id}/notifications/subscriptions` | Registrar webhook |
| GET | `/applications/{app_id}/notifications/subscriptions` | Listar webhooks |
| DELETE | `/applications/{app_id}/notifications/subscriptions/{id}` | Remover webhook |

---

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está configurado corretamente:

- [ ] Aplicação criada no DevCenter do Mercado Livre
- [ ] Credenciais (Client ID e Client Secret) configuradas no Railway
- [ ] OAuth2 realizado e access_token obtido
- [ ] URL do webhook registrada no DevCenter
- [ ] Tópicos selecionados (orders_v2, items, questions, messages)
- [ ] Webhook testado com notificação de teste
- [ ] Logs verificados no banco de dados
- [ ] Pedido de teste realizado e sincronizado
- [ ] Monitoramento configurado

---

## 🎉 Próximos Passos

Após configurar os webhooks, você pode:

1. **Automatizar respostas**: Configure respostas automáticas para perguntas frequentes
2. **Notificações push**: Receba alertas em tempo real sobre novos pedidos
3. **Relatórios**: Analise métricas de vendas e desempenho
4. **Integração com outros marketplaces**: Expanda para Shopee, Amazon, etc.

---

## 💡 Dicas Importantes

- ⚡ **Resposta rápida**: O ML espera resposta em até 3 segundos
- 🔄 **Idempotência**: Prepare-se para receber notificações duplicadas
- 📝 **Logs**: Mantenha logs detalhados para debugging
- 🔐 **Segurança**: Valide sempre a estrutura das notificações
- 🧪 **Testes**: Teste com pedidos reais antes de ir para produção

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do sistema: `railway logs`
2. Consulte a documentação oficial do ML
3. Entre em contato com o suporte técnico do MarketHub CRM

---

**Última atualização:** 15 de dezembro de 2025
