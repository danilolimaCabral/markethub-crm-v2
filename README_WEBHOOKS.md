# 🔔 Webhooks do Mercado Livre - MarketHub CRM

## 📋 Resumo Executivo

Os webhooks do Mercado Livre permitem que o MarketHub CRM receba notificações em tempo real sobre eventos importantes, como:

- ✅ **Novos pedidos** - Sincronização instantânea
- ✅ **Atualizações de pagamento** - Status em tempo real
- ✅ **Mudanças de status** - Acompanhamento automático
- ✅ **Perguntas de clientes** - Resposta rápida
- ✅ **Mensagens** - Chat integrado
- ✅ **Alterações de produtos** - Catálogo atualizado

---

## 🚀 Quick Start

### 1. Configurar Webhook no Mercado Livre

Acesse o [DevCenter do Mercado Livre](https://developers.mercadolivre.com.br/) e configure:

**URL do Webhook:**
```
https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook
```

**Tópicos a selecionar:**
- ✅ orders_v2 (Pedidos)
- ✅ items (Produtos)
- ✅ questions (Perguntas)
- ✅ messages (Mensagens)

### 2. Testar Webhook

Execute o script de teste:

```bash
# Testar pedido
node test-webhook.cjs order

# Testar todos os tipos
node test-webhook.cjs all
```

### 3. Verificar Logs

```bash
# Ver logs do Railway
railway logs --tail 100

# Ou consultar banco de dados
# Ver últimas notificações recebidas
SELECT * FROM marketplace_sync_log 
WHERE sync_type LIKE 'webhook_%' 
ORDER BY started_at DESC 
LIMIT 10;
```

---

## 📚 Documentação

### Guias Disponíveis

1. **[GUIA_WEBHOOKS_MERCADOLIVRE.md](./GUIA_WEBHOOKS_MERCADOLIVRE.md)**
   - Guia completo de configuração
   - Passo a passo no DevCenter
   - Troubleshooting
   - Exemplos práticos

2. **[DOCUMENTACAO_TECNICA_WEBHOOKS.md](./DOCUMENTACAO_TECNICA_WEBHOOKS.md)**
   - Arquitetura do sistema
   - Implementação técnica
   - API Reference
   - Monitoramento e métricas

3. **[test-webhook.cjs](./test-webhook.cjs)**
   - Script de teste automatizado
   - Simula notificações do ML
   - Valida funcionamento

---

## 🎯 Como Funciona

```
┌──────────────┐
│ Mercado Livre│
│  (Evento)    │
└──────┬───────┘
       │
       │ POST /webhook
       ▼
┌──────────────┐
│ MarketHub    │
│  (Recebe)    │
└──────┬───────┘
       │
       │ 1. Valida
       │ 2. Retorna 200 OK (< 3s)
       │ 3. Processa async
       ▼
┌──────────────┐
│  Banco de    │
│  Dados       │
│ (Atualiza)   │
└──────────────┘
```

### Fluxo Detalhado

1. **Evento ocorre no ML** (ex: novo pedido)
2. **ML envia notificação** para o webhook
3. **Sistema valida** estrutura da notificação
4. **Responde 200 OK** em < 3 segundos
5. **Processa assincronamente**:
   - Salva log no banco
   - Busca dados via API do ML
   - Atualiza banco de dados
   - (Futuro) Notifica usuário

---

## 🧪 Testando

### Teste Automático

```bash
# Testar pedido
node test-webhook.cjs order

# Testar produto
node test-webhook.cjs item

# Testar pergunta
node test-webhook.cjs question

# Testar todos
node test-webhook.cjs all
```

### Teste Manual (cURL)

```bash
curl -X POST https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "test-123",
    "resource": "/orders/2000003692581726",
    "user_id": 123456789,
    "topic": "orders_v2",
    "application_id": 1234567890,
    "attempts": 1,
    "sent": "2025-12-15T10:00:00.000Z",
    "received": "2025-12-15T10:00:00.000Z"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "received": true,
  "response_time_ms": 45
}
```

### Teste Real

1. Faça uma compra de teste na sua loja do ML
2. Aguarde 5-10 segundos
3. Verifique os logs: `railway logs`
4. Confirme no banco de dados

---

## 📊 Monitoramento

### Verificar Notificações Recebidas

```sql
-- Últimas 10 notificações
SELECT 
  sync_type,
  status,
  details->>'topic' as topic,
  details->>'resource' as resource,
  started_at
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
ORDER BY started_at DESC
LIMIT 10;
```

### Taxa de Sucesso

```sql
-- Taxa de sucesso nas últimas 24h
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
  AND started_at > NOW() - INTERVAL '24 hours';
```

### Webhooks por Tipo

```sql
-- Distribuição por tipo
SELECT 
  sync_type,
  COUNT(*) as count
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
  AND started_at > NOW() - INTERVAL '24 hours'
GROUP BY sync_type
ORDER BY count DESC;
```

---

## 🐛 Troubleshooting

### Problema: Webhooks não estão chegando

**Verificações:**

1. ✅ Webhook registrado no DevCenter?
2. ✅ URL está acessível publicamente?
3. ✅ Certificado SSL válido?
4. ✅ Servidor está online?

**Teste:**
```bash
curl -I https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook
```

### Problema: Webhooks chegam mas não processam

**Verificações:**

1. ✅ Token de acesso válido?
2. ✅ Integração ativa no banco?
3. ✅ Logs mostram erros?

**Verificar logs:**
```bash
railway logs --tail 100 | grep webhook
```

**Verificar token:**
```sql
SELECT 
  marketplace,
  expires_at,
  expires_at < NOW() as expired
FROM marketplace_integrations
WHERE marketplace = 'mercado_livre';
```

### Problema: Notificações duplicadas

**Comportamento normal:** O ML pode enviar até 12 vezes se não receber 200 OK.

**Solução:** O sistema já é idempotente - não causa problemas.

---

## 🔐 Segurança

### Validações Implementadas

✅ **Estrutura**: Verifica campos obrigatórios  
✅ **Tipos**: Valida tipos de dados  
✅ **Formato**: Verifica formato dos campos  
✅ **Tópicos**: Valida tópicos conhecidos  
✅ **Tenant**: Verifica integração ativa  

### Limitações

❌ ML não envia assinatura digital (HMAC)  
❌ Não é possível validar autenticidade criptográfica  
✅ Validação baseada em estrutura e contexto  
✅ Isolamento por tenant garante segurança  

---

## 📈 Métricas

### KPIs Importantes

| Métrica | Meta | Alerta |
|---------|------|--------|
| Taxa de sucesso | > 95% | < 90% |
| Tempo de resposta | < 2s | > 2.5s |
| Uptime | > 99% | < 98% |
| Notificações/dia | - | - |

---

## 🎓 Próximos Passos

Após configurar os webhooks:

1. ✅ **Testar com pedido real**
2. ✅ **Monitorar logs por 24h**
3. ✅ **Configurar alertas**
4. 🔄 **Implementar notificações push**
5. 🔄 **Adicionar dashboard de métricas**
6. 🔄 **Automatizar respostas a perguntas**

---

## 📞 Suporte

### Documentação

- [Guia de Configuração](./GUIA_WEBHOOKS_MERCADOLIVRE.md)
- [Documentação Técnica](./DOCUMENTACAO_TECNICA_WEBHOOKS.md)
- [API do Mercado Livre](https://developers.mercadolivre.com.br/)

### Logs e Debug

```bash
# Ver logs em tempo real
railway logs --tail 100

# Ver logs de webhook
railway logs | grep webhook

# Ver erros
railway logs | grep ERROR
```

### Contato

- 🌐 [MarketHub CRM](https://www.markthubcrm.com.br)
- 📧 Suporte técnico via plataforma
- 📚 [Documentação oficial do ML](https://developers.mercadolivre.com.br/)

---

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Aplicação criada no DevCenter do ML
- [ ] Credenciais configuradas no Railway
- [ ] OAuth2 realizado e token obtido
- [ ] URL do webhook registrada no DevCenter
- [ ] Tópicos selecionados (orders_v2, items, questions, messages)
- [ ] Webhook testado com script de teste
- [ ] Logs verificados no banco de dados
- [ ] Pedido de teste realizado e sincronizado
- [ ] Monitoramento configurado
- [ ] Alertas configurados (opcional)

---

## 📝 Arquivos Importantes

```
markethub-crm-v2/
├── server/
│   ├── routes/
│   │   └── mercadolivre.ts              # Rota do webhook
│   └── services/
│       └── MercadoLivreWebhookService.ts # Lógica de processamento
├── test-webhook.cjs                      # Script de teste
├── README_WEBHOOKS.md                    # Este arquivo
├── GUIA_WEBHOOKS_MERCADOLIVRE.md        # Guia de configuração
└── DOCUMENTACAO_TECNICA_WEBHOOKS.md     # Documentação técnica
```

---

## 🎉 Conclusão

Com os webhooks configurados, seu sistema agora:

✅ Recebe notificações em tempo real  
✅ Sincroniza pedidos automaticamente  
✅ Atualiza produtos instantaneamente  
✅ Registra perguntas e mensagens  
✅ Mantém dados sempre atualizados  

**Próximo passo:** Teste com um pedido real e monitore os logs!

---

**Última atualização:** 15 de dezembro de 2025  
**Versão:** 1.0.0
