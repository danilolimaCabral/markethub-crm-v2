# 📋 Guia de Cadastro do Aplicativo no Mercado Livre

**Projeto:** Markthub CRM v2  
**Data:** 12/12/2025  
**Objetivo:** Configurar aplicativo no painel de desenvolvedores do Mercado Livre

---

## 🔗 Links Importantes

### **Painel de Desenvolvedores:**
- **URL:** https://developers.mercadolivre.com.br/
- **Login:** Use sua conta do Mercado Livre (vendedor)

### **Documentação Oficial:**
- **Guia OAuth:** https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
- **API Reference:** https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br

---

## 📝 Passo a Passo para Cadastro

### **1. Acessar o Painel de Desenvolvedores**

1. Acesse: https://developers.mercadolivre.com.br/
2. Faça login com sua conta do Mercado Livre
3. Clique em **"Minhas aplicações"** ou **"Criar aplicação"**

---

### **2. Criar Nova Aplicação**

Clique em **"Criar nova aplicação"** e preencha os dados abaixo:

---

## 🔧 Dados para Preenchimento

### **Informações Básicas**

| Campo | Valor |
|-------|-------|
| **Nome da Aplicação** | Markthub CRM |
| **Descrição Curta** | Sistema de gestão integrado para vendedores do Mercado Livre |
| **Descrição Detalhada** | Plataforma completa de CRM para gerenciar vendas, produtos, pedidos e clientes do Mercado Livre com inteligência artificial e automação |
| **Site** | https://www.markthubcrm.com.br |
| **Tipo de Aplicação** | Web Application |
| **Categoria** | Gestão e Produtividade |

---

### **URLs de Callback (Redirect URIs)**

**IMPORTANTE:** Adicione TODAS as URLs abaixo (o Mercado Livre permite múltiplas):

```
https://www.markthubcrm.com.br/api/mercadolivre/callback
https://markethub-crm-v2-production.up.railway.app/api/mercadolivre/callback
http://localhost:5000/api/mercadolivre/callback
```

**Por quê 3 URLs?**
- ✅ **1ª URL:** Domínio principal (produção)
- ✅ **2ª URL:** URL do Railway (backup)
- ✅ **3ª URL:** Desenvolvimento local (testes)

---

### **Permissões (Scopes) Necessárias**

Marque TODAS as permissões abaixo:

#### **Obrigatórias:**
- ✅ `read` - Ler informações básicas
- ✅ `write` - Criar e modificar recursos
- ✅ `offline_access` - Refresh token (acesso contínuo)

#### **Recomendadas:**
- ✅ `read_items` - Ler produtos/anúncios
- ✅ `write_items` - Criar/editar produtos
- ✅ `read_orders` - Ler pedidos
- ✅ `write_orders` - Atualizar status de pedidos
- ✅ `read_questions` - Ler perguntas
- ✅ `write_questions` - Responder perguntas
- ✅ `read_messages` - Ler mensagens
- ✅ `write_messages` - Enviar mensagens

---

### **Informações de Contato**

| Campo | Valor Sugerido |
|-------|----------------|
| **Email de Contato** | contato@markthubcrm.com.br |
| **Email Técnico** | suporte@markthubcrm.com.br |
| **Telefone** | (Seu telefone comercial) |

---

### **Configurações Avançadas**

| Campo | Valor |
|-------|-------|
| **Ambiente** | Produção |
| **País** | Brasil (MLB) |
| **Notificações** | Ativado |
| **Webhook URL** | https://www.markthubcrm.com.br/api/mercadolivre/webhook |

---

## 🔑 Credenciais Atuais

**ATENÇÃO:** Estas credenciais já estão configuradas no sistema. Você pode:
- **Opção A:** Usar as credenciais existentes (recomendado)
- **Opção B:** Criar novo aplicativo e atualizar as variáveis

### **Credenciais Existentes:**

```
Client ID: 7719573488458
Client Secret: mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD
```

**Se você criou estas credenciais anteriormente:**
1. Acesse o painel de desenvolvedores
2. Encontre o aplicativo com este Client ID
3. Verifique se as URLs de callback estão corretas
4. Adicione as URLs listadas acima se necessário

**Se você NÃO reconhece estas credenciais:**
1. Crie um novo aplicativo seguindo este guia
2. Anote o novo Client ID e Client Secret
3. Atualize as variáveis de ambiente no Railway

---

## 🔄 Como Atualizar Credenciais no Railway

Se você criar um novo aplicativo, siga estes passos:

### **1. Acessar Railway Dashboard**
- URL: https://railway.app/
- Projeto: markethub-crm-v2

### **2. Atualizar Variáveis**
1. Clique no serviço do projeto
2. Vá em **"Variables"**
3. Edite as seguintes variáveis:

```
ML_CLIENT_ID = (Novo Client ID)
ML_CLIENT_SECRET = (Novo Client Secret)
```

### **3. Fazer Redeploy**
1. Vá em **"Deployments"**
2. Clique em **"Redeploy"**
3. Aguarde 2-3 minutos

---

## ✅ Checklist de Verificação

Após criar/atualizar o aplicativo, verifique:

- [ ] Aplicativo criado no painel do Mercado Livre
- [ ] Nome: "Markthub CRM"
- [ ] URLs de callback configuradas (3 URLs)
- [ ] Permissões marcadas (mínimo: read, write, offline_access)
- [ ] Client ID e Client Secret anotados
- [ ] Variáveis atualizadas no Railway (se necessário)
- [ ] Redeploy realizado (se necessário)
- [ ] Teste de conexão no dashboard

---

## 🧪 Como Testar a Integração

### **1. Acessar o Dashboard**
- URL: https://www.markthubcrm.com.br
- Login: superadmin / SuperAdmin@2024!

### **2. Ir para Integração Mercado Livre**
- Menu lateral → **"Mercado Livre"**
- Ou acesse direto: https://www.markthubcrm.com.br/integracoes/mercadolivre

### **3. Conectar com Mercado Livre**
1. Clique no botão **"Conectar com Mercado Livre"**
2. Você será redirecionado para o Mercado Livre
3. Faça login (se necessário)
4. Autorize o aplicativo
5. Você será redirecionado de volta para o dashboard

### **4. Verificar Conexão**
- Status deve mudar para **"Conectado"**
- Aba **"Monitoramento API"** → Clicar em **"Executar Testes"**
- Todos os 15 testes devem passar (100%)

---

## ❌ Problemas Comuns

### **Erro: "Invalid redirect_uri"**
**Causa:** URL de callback não está cadastrada  
**Solução:** Adicione todas as 3 URLs listadas acima

### **Erro: "Invalid client_id"**
**Causa:** Client ID incorreto ou aplicativo não existe  
**Solução:** Verifique o Client ID no painel de desenvolvedores

### **Erro: "Insufficient permissions"**
**Causa:** Permissões (scopes) não configuradas  
**Solução:** Marque todas as permissões listadas acima

### **Erro: "UNAUTHORIZED" nos testes**
**Causa:** Não conectou com Mercado Livre ainda  
**Solução:** Clique em "Conectar com Mercado Livre" primeiro

---

## 📞 Suporte

### **Documentação Mercado Livre:**
- **Portal:** https://developers.mercadolivre.com.br/
- **Fórum:** https://developers.mercadolivre.com.br/pt_br/forum
- **Email:** developers@mercadolivre.com

### **Suporte Técnico Markthub:**
- **Email:** suporte@markthubcrm.com.br
- **Documentação:** Veja os arquivos no repositório GitHub

---

## 📚 Documentos Relacionados

No repositório do projeto, você encontrará:

1. **GUIA_OAUTH_MERCADO_LIVRE.md** - Fluxo OAuth2 detalhado
2. **TESTE_INTEGRACAO_ML.md** - Scripts de teste
3. **RAILWAY_JWT_KEYS.txt** - Chaves JWT (confidencial)
4. **.env.railway** - Variáveis de ambiente (confidencial)

---

## 🎯 Resumo Rápido

### **O que você precisa fazer:**

1. ✅ Acessar https://developers.mercadolivre.com.br/
2. ✅ Criar aplicativo "Markthub CRM"
3. ✅ Adicionar 3 URLs de callback
4. ✅ Marcar permissões (scopes)
5. ✅ Anotar Client ID e Client Secret
6. ✅ Atualizar variáveis no Railway (se necessário)
7. ✅ Testar conexão no dashboard

### **Tempo estimado:** 10-15 minutos

---

## 🎉 Próximos Passos

Após configurar o aplicativo:

1. **Conectar sua conta** no dashboard
2. **Executar testes** na aba "Monitoramento API"
3. **Começar a usar** as funcionalidades:
   - Sincronizar produtos
   - Gerenciar pedidos
   - Responder perguntas
   - Monitorar vendas

---

**Boa sorte! Se tiver dúvidas, consulte a documentação oficial do Mercado Livre ou os arquivos de suporte no projeto.** 🚀
