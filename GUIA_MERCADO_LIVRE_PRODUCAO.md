# Guia de Configuração - Integração Mercado Livre para Produção

## 📋 Visão Geral

Este guia detalha o processo completo para configurar a integração com o Mercado Livre no Markthub CRM V2, preparando o sistema para comercialização.

## 🔑 Passo 1: Criar Aplicação no Mercado Livre

### 1.1 Acessar o Portal de Desenvolvedores

1. Acesse: https://developers.mercadolivre.com.br/
2. Faça login com sua conta do Mercado Livre
3. Vá em "Minhas aplicações" > "Criar nova aplicação"

### 1.2 Configurar a Aplicação

Preencha os dados da aplicação:

- **Nome da aplicação**: Markthub CRM
- **Descrição curta**: Sistema de gestão para e-commerce integrado ao Mercado Livre
- **Descrição longa**: Plataforma completa de CRM que sincroniza automaticamente pedidos, produtos e estoque com o Mercado Livre
- **URL de retorno (Redirect URI)**: 
  - Desenvolvimento: `http://localhost:3000/api/integrations/mercadolivre/callback`
  - Produção: `https://seudominio.com/api/integrations/mercadolivre/callback`
- **Tópicos de notificação**: 
  - `orders_v2` (pedidos)
  - `items` (produtos)
  - `questions` (perguntas)

### 1.3 Obter Credenciais

Após criar a aplicação, você receberá:
- **Client ID** (App ID)
- **Client Secret**

⚠️ **IMPORTANTE**: Guarde essas credenciais em local seguro!

## 🔧 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Editar arquivo .env

```bash
# Mercado Livre API
ML_CLIENT_ID=seu_client_id_aqui
ML_CLIENT_SECRET=seu_client_secret_aqui
ML_REDIRECT_URI=https://seudominio.com/api/integrations/mercadolivre/callback
ML_APP_URL=https://auth.mercadolivre.com.br/authorization
```

### 2.2 Configurar Webhook do Mercado Livre

O Mercado Livre enviará notificações para:
```
https://seudominio.com/api/integrations/mercadolivre/webhook
```

Configure esta URL no painel de desenvolvedores do ML.

## 📊 Passo 3: Fluxo de Autenticação OAuth

### 3.1 Processo de Autorização

1. O cliente clica em "Conectar Mercado Livre" no CRM
2. É redirecionado para a página de autorização do ML
3. Após autorizar, o ML redireciona de volta com um código
4. O sistema troca o código por tokens de acesso

### 3.2 Tokens Gerenciados Automaticamente

O sistema gerencia automaticamente:
- **Access Token**: Válido por 6 horas
- **Refresh Token**: Usado para renovar o access token
- **Renovação automática**: O sistema renova tokens antes de expirarem

## 🔄 Passo 4: Funcionalidades da Integração

### 4.1 Sincronização de Pedidos

- **Automática**: A cada 15 minutos (configurável)
- **Manual**: Botão "Sincronizar agora"
- **Webhook**: Notificações em tempo real de novos pedidos

### 4.2 Sincronização de Produtos

- **Importar do ML**: Traz produtos do ML para o CRM
- **Exportar para ML**: Publica produtos do CRM no ML
- **Atualização de estoque**: Sincronização bidirecional

### 4.3 Gestão de Perguntas

- **Notificações**: Alertas de novas perguntas
- **Resposta rápida**: Interface para responder diretamente do CRM

## 🚀 Passo 5: Deploy em Produção

### 5.1 Checklist Pré-Deploy

- [ ] Credenciais do ML configuradas no .env
- [ ] Redirect URI atualizada para domínio de produção
- [ ] Webhook URL configurada no painel do ML
- [ ] Certificado SSL instalado (HTTPS obrigatório)
- [ ] Banco de dados PostgreSQL configurado
- [ ] Variáveis JWT_SECRET configuradas

### 5.2 Testar Integração

```bash
# Testar conexão com API do ML
curl -X GET "https://api.mercadolibre.com/sites/MLB"

# Verificar health check do sistema
curl https://seudominio.com/api/health
```

## 📈 Passo 6: Monitoramento

### 6.1 Logs de Integração

O sistema registra todas as operações:
- Sincronizações realizadas
- Erros de API
- Renovações de token
- Webhooks recebidos

Acesse em: **Configurações > Logs > Integrações**

### 6.2 Métricas Importantes

Monitore:
- Taxa de sucesso de sincronização
- Tempo médio de resposta da API ML
- Quantidade de pedidos sincronizados
- Erros de autenticação

## 🔒 Passo 7: Segurança

### 7.1 Proteção de Credenciais

- Nunca commite o arquivo `.env` no Git
- Use variáveis de ambiente no servidor de produção
- Rotacione o Client Secret periodicamente

### 7.2 Rate Limiting

O sistema implementa rate limiting para respeitar os limites da API do ML:
- 60 requisições por minuto por padrão
- Ajustável conforme plano do cliente

## 🆘 Troubleshooting

### Erro: "Token expirado"

**Solução**: O sistema renova automaticamente. Se persistir:
1. Verifique se o Refresh Token está válido
2. Solicite nova autorização ao cliente

### Erro: "Redirect URI mismatch"

**Solução**: 
1. Verifique se a URL no .env está exatamente igual à configurada no ML
2. Inclua protocolo (https://) e não adicione barra final

### Pedidos não sincronizam

**Solução**:
1. Verifique se o webhook está recebendo notificações
2. Confira logs em `/api/integrations/mercadolivre/logs`
3. Teste sincronização manual

## 📞 Suporte

Para dúvidas sobre a API do Mercado Livre:
- Documentação: https://developers.mercadolivre.com.br/pt_br/api-docs
- Fórum: https://developers.mercadolivre.com.br/pt_br/forum

## ✅ Checklist Final

Antes de comercializar, certifique-se:

- [ ] Aplicação aprovada no Mercado Livre
- [ ] Todas as credenciais configuradas
- [ ] Testes de sincronização realizados com sucesso
- [ ] Webhooks funcionando
- [ ] Documentação entregue ao cliente
- [ ] Treinamento da equipe realizado
- [ ] Monitoramento configurado
- [ ] Plano de suporte definido

---

**Versão**: 1.0  
**Última atualização**: Dezembro 2025  
**Autor**: Manus AI
