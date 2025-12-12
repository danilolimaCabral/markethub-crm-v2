# 🔑 Como Criar Chaves de API no Mercado Livre (Passo a Passo)

**Data:** 12 de dezembro de 2025  
**Autor:** Manus AI

---

## 🎯 Objetivo

Este guia mostra o passo a passo completo para criar uma nova aplicação e obter suas credenciais (`Client ID` e `Client Secret`) no portal de desenvolvedores do Mercado Livre.

---

## 🚀 Passo a Passo Visual

### **Passo 1: Acessar o Portal de Desenvolvedores**

1.  Acesse o site: [https://developers.mercadolivre.com.br/](https://developers.mercadolivre.com.br/)
2.  Clique em **"Entrar"** no canto superior direito.

    *Se você já estiver logado na sua conta do Mercado Livre, pule para o Passo 3.*

### **Passo 2: Fazer Login**

1.  Entre com seu **email e senha** da sua conta do Mercado Livre (a mesma que você usa para vender).

### **Passo 3: Acessar o Dashboard de Aplicações**

1.  Após o login, você será redirecionado para o seu dashboard.
2.  No menu superior, clique em **"Suas aplicações"**.

### **Passo 4: Criar Nova Aplicação**

1.  Clique no botão azul **"Criar nova aplicação"**.

### **Passo 5: Preencher os Dados da Aplicação**

1.  **Nome da aplicação:**
    -   Digite um nome fácil de identificar, como `Markethub CRM` ou `Integração ERP`.

2.  **Descrição curta:**
    -   Descreva brevemente para que serve a aplicação. Ex: `Integração com o sistema de gestão Markethub CRM`.

3.  **Logo (opcional):**
    -   Você pode adicionar o logo da sua empresa ou do sistema.

4.  **Redirect URI:** ⭐ **MUITO IMPORTANTE**
    -   Este é o endereço para onde o Mercado Livre irá redirecionar o usuário após a autorização.
    -   Para o Markethub CRM, use **exatamente** esta URL:
        ```
        https://www.markthubcrm.com.br/callback/mercadolivre
        ```

5.  **Tópicos:**
    -   Marque os tópicos aos quais sua aplicação precisará de acesso. Para uma integração completa, marque:
        -   `items` (produtos)
        -   `orders` (pedidos)
        -   `questions` (perguntas)
        -   `payments` (pagamentos)
        -   `shipments` (envios)
        -   `offline_access` (para renovar o token automaticamente)

6.  **Aceitar os Termos e Condições:**
    -   Marque a caixa de seleção `Li e aceito os Termos e condições de uso das APIs do Mercado Livre`.

### **Passo 6: Salvar a Aplicação**

1.  Clique no botão **"Criar"**.

### **Passo 7: Obter as Credenciais**

1.  Após criar a aplicação, você será levado para a página de detalhes dela.
2.  Nesta página, você verá:
    -   **App ID (Client ID):** Um número longo. Este é o seu `Client ID`.
    -   **Secret Key (Client Secret):** Uma sequência longa de letras e números. Este é o seu `Client Secret`.

    ![Exemplo de onde encontrar as credenciais](https://i.imgur.com/ABCDE12.png) *(imagem de exemplo)*

### **Passo 8: Usar as Credenciais no Markethub CRM**

1.  Copie o **App ID (Client ID)** e a **Secret Key (Client Secret)**.
2.  Cole nos campos correspondentes na tela de integração do Mercado Livre no Markethub CRM.
3.  Clique em **"Salvar Credenciais"**.
4.  Clique em **"Autorizar Acesso"** para finalizar a conexão!

---

## ⚠️ Dicas de Segurança

-   **NUNCA** compartilhe seu `Client Secret` com ninguém.
-   Guarde suas credenciais em um local seguro.
-   Se você suspeitar que suas credenciais foram comprometidas, você pode gerar uma nova `Secret Key` no portal de desenvolvedores do Mercado Livre.

---

## ✅ Conclusão

Seguindo estes passos, você terá criado sua aplicação no Mercado Livre e obtido as credenciais necessárias para conectar sua conta ao Markethub CRM e automatizar suas vendas!
