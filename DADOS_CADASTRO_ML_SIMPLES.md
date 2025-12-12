# 📋 Dados para Cadastro - Mercado Livre API

**Copie e cole os dados abaixo no painel de desenvolvedores do Mercado Livre**

---

## 🔗 Onde Cadastrar

**URL:** https://developers.mercadolivre.com.br/  
**Ação:** Criar Nova Aplicação

---

## 📝 Dados para Preencher

### **Nome da Aplicação**
```
Markthub CRM
```

### **Descrição Curta**
```
Sistema de gestão integrado para vendedores do Mercado Livre
```

### **Descrição Detalhada**
```
Plataforma completa de CRM para gerenciar vendas, produtos, pedidos e clientes do Mercado Livre com inteligência artificial e automação. Inclui sincronização automática de produtos, gestão centralizada de pedidos, atualização automática de estoque, cálculo automático de taxas, e painel de monitoramento da API.
```

### **Site**
```
https://www.markthubcrm.com.br
```

### **Tipo de Aplicação**
```
Web Application
```

### **Categoria**
```
Gestão e Produtividade
```

---

## 🔄 URLs de Callback (Redirect URIs)

**IMPORTANTE:** Adicione TODAS as 3 URLs abaixo:

```
https://www.markthubcrm.com.br/api/mercadolivre/callback
```

```
https://markethub-crm-v2-production.up.railway.app/api/mercadolivre/callback
```

```
http://localhost:5000/api/mercadolivre/callback
```

---

## 🔐 Permissões (Scopes)

Marque TODAS estas opções:

```
☑ read
☑ write
☑ offline_access
☑ read_items
☑ write_items
☑ read_orders
☑ write_orders
☑ read_questions
☑ write_questions
☑ read_messages
☑ write_messages
```

---

## 📧 Contatos

**Email de Contato:**
```
contato@markthubcrm.com.br
```

**Email Técnico:**
```
suporte@markthubcrm.com.br
```

---

## 🔔 Webhook URL (Notificações)

```
https://www.markthubcrm.com.br/api/mercadolivre/webhook
```

---

## 🌍 Configurações

**Ambiente:** Produção  
**País:** Brasil (MLB)  
**Notificações:** Ativado

---

## ✅ Após Criar o Aplicativo

1. **Anote as credenciais:**
   - Client ID
   - Client Secret

2. **Se as credenciais forem diferentes das atuais, atualize no Railway:**
   - Variável: `ML_CLIENT_ID`
   - Variável: `ML_CLIENT_SECRET`

3. **Credenciais atuais (para referência):**
   ```
   Client ID: 7719573488458
   Client Secret: mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD
   ```

---

## 🧪 Testar a Integração

1. Acesse: https://www.markthubcrm.com.br
2. Login: `superadmin` / `SuperAdmin@2024!`
3. Menu → **Mercado Livre**
4. Clique em **"Conectar com Mercado Livre"**
5. Autorize o aplicativo
6. Aba **"Monitoramento API"** → **"Executar Testes"**

---

**Pronto! Seu aplicativo estará configurado e funcionando.** ✅
