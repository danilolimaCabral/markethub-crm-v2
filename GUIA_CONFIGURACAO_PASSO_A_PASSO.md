# 🚀 GUIA DE CONFIGURAÇÃO - PASSO A PASSO

**Vou te guiar em cada etapa para ativar o deploy automático!**

---

## 📍 PASSO 1: FAZER PUSH DO BRANCH (2 minutos)

### Opção A: Push direto para testar (Recomendado para teste rápido)

```bash
# 1. Fazer push do branch atual
git push origin cursor/analyze-github-system-6a3f
```

**O que vai acontecer:**
- ✅ GitHub Actions vai iniciar automaticamente
- ✅ Workflows com pnpm corrigido vão executar
- ✅ Você pode ver se os testes passam
- ⚠️ Deploy NÃO vai acontecer ainda (precisa dos secrets)

**Acompanhar execução:**
👉 https://github.com/danilolimaCabral/markethub-crm-v2/actions

---

### Opção B: Merge para main (Recomendado para produção)

```bash
# 1. Ir para branch main
git checkout main

# 2. Fazer merge do branch com correções
git merge cursor/analyze-github-system-6a3f

# 3. Push para main
git push origin main
```

**O que vai acontecer:**
- ✅ Mesma coisa que Opção A
- ✅ Mas o código já fica na main
- ✅ Quando adicionar secrets, deploy vai funcionar no próximo push

---

## 📍 PASSO 2: OBTER INFORMAÇÕES DO HETZNER (3 minutos)

### 2.1 - Pegar o IP do Servidor

**Você mencionou:** https://console.hetzner.com/projects/12430399/servers/113058104/rebuild

1. **Acesse o console Hetzner:**
   👉 https://console.hetzner.com/projects/12430399/servers/113058104

2. **Na página do servidor, você vai ver:**
   ```
   ┌─────────────────────────────────────────┐
   │ Server: markethub-crm (ou nome similar) │
   │ Status: Running                          │
   │ IPv4: XXX.XXX.XXX.XXX ← ESSE AQUI!     │
   │ IPv6: ...                                │
   └─────────────────────────────────────────┘
   ```

3. **Copie o IPv4** (algo como: `88.198.123.456`)
   - ⚠️ Anote esse IP! Você vai usar no Secret #1

---

### 2.2 - Verificar Acesso SSH ao Servidor

**Você precisa ter acesso SSH ao servidor. Vamos verificar:**

#### Teste 1: Verificar se você tem chave SSH

```bash
# No seu computador local, execute:
ls -la ~/.ssh/
```

**Você deve ver algo como:**
```
id_rsa        ← Chave privada
id_rsa.pub    ← Chave pública
# ou
id_ed25519    ← Chave privada
id_ed25519.pub ← Chave pública
```

---

#### Teste 2: Tentar conectar no servidor

```bash
# Substitua XXX.XXX.XXX.XXX pelo IP do Hetzner
ssh root@XXX.XXX.XXX.XXX
```

**Cenário A: Conectou com sucesso ✅**
```
Welcome to Ubuntu...
root@markethub:~#
```

→ **Ótimo! Você já tem acesso configurado!**
→ Pode digitar `exit` para sair
→ **Próximo:** Copiar a chave privada para o GitHub

---

**Cenário B: Pediu senha 🔐**
```
root@XXX.XXX.XXX.XXX's password:
```

→ **Você tem a senha?**
  - ✅ Se SIM: Digite a senha e conecte
  - ❌ Se NÃO: Precisa configurar acesso SSH (vou te ajudar)

---

**Cenário C: Erro "Permission denied" ❌**
```
Permission denied (publickey).
```

→ **Precisa adicionar sua chave SSH no servidor**
→ Vou te ajudar a fazer isso!

---

### 2.3 - CRIAR CHAVE SSH (se não tiver)

**Se você NÃO tem chave SSH (`~/.ssh/id_rsa` ou `id_ed25519`), criar agora:**

```bash
# Criar nova chave SSH
ssh-keygen -t ed25519 -C "deploy@markethub"

# Vai perguntar 3 coisas:
# 1. "Enter file in which to save the key" → Aperte ENTER
# 2. "Enter passphrase" → Aperte ENTER (sem senha para deploy automático)
# 3. "Enter same passphrase again" → Aperte ENTER
```

**Resultado:**
```
Your identification has been saved in /home/seu-usuario/.ssh/id_ed25519
Your public key has been saved in /home/seu-usuario/.ssh/id_ed25519.pub
```

✅ **Chave criada!**

---

### 2.4 - ADICIONAR CHAVE SSH NO SERVIDOR HETZNER

**Você tem 2 opções:**

#### Opção A: Via ssh-copy-id (Mais fácil - se tiver senha SSH)

```bash
# Substitua XXX.XXX.XXX.XXX pelo IP do Hetzner
ssh-copy-id root@XXX.XXX.XXX.XXX

# Vai pedir a senha do servidor
# Digite e confirme
```

**Resultado:**
```
Number of key(s) added: 1
```

✅ **Agora tente conectar sem senha:**
```bash
ssh root@XXX.XXX.XXX.XXX
# Deve conectar diretamente sem pedir senha!
```

---

#### Opção B: Via Console Hetzner (Se não tiver senha SSH)

1. **Acesse o console Hetzner:**
   👉 https://console.hetzner.com/projects/12430399/servers/113058104

2. **Clique em "Console" no menu lateral (ou acesso via Console Web)**

3. **Login como root** (use a senha do servidor)

4. **No servidor, execute:**
   ```bash
   # Criar diretório .ssh se não existir
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   
   # Criar arquivo authorized_keys
   nano ~/.ssh/authorized_keys
   ```

5. **No seu computador LOCAL, copie sua chave PÚBLICA:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # ou
   cat ~/.ssh/id_rsa.pub
   ```

6. **Cole a chave pública no arquivo `authorized_keys` no servidor**
   - Ctrl+Shift+V para colar no terminal
   - Ctrl+X para sair
   - Y para salvar
   - Enter para confirmar

7. **Configure permissões:**
   ```bash
   chmod 600 ~/.ssh/authorized_keys
   ```

8. **Teste a conexão do seu computador:**
   ```bash
   ssh root@XXX.XXX.XXX.XXX
   # Deve conectar sem pedir senha!
   ```

---

## 📍 PASSO 3: ADICIONAR SECRETS NO GITHUB (5 minutos)

### 3.1 - Acessar página de Secrets

1. **Abra este link:**
   👉 https://github.com/danilolimaCabral/markethub-crm-v2/settings/secrets/actions

2. **Você deve estar logado no GitHub**

3. **Você vai ver uma página com:**
   ```
   Actions secrets and variables
   ┌──────────────────────────────────────┐
   │ Secrets                              │
   │                                      │
   │ [New repository secret]  ← Clique aqui
   └──────────────────────────────────────┘
   ```

---

### 3.2 - Adicionar Secret #1: HETZNER_HOST

1. **Clique em "New repository secret"**

2. **Preencha:**
   ```
   Name: HETZNER_HOST
   
   Secret: XXX.XXX.XXX.XXX
          ↑ Cole o IP do servidor Hetzner aqui
   ```

3. **Clique em "Add secret"**

✅ **Secret #1 criado!**

---

### 3.3 - Adicionar Secret #2: HETZNER_USER

1. **Clique em "New repository secret" novamente**

2. **Preencha:**
   ```
   Name: HETZNER_USER
   
   Secret: root
   ```

3. **Clique em "Add secret"**

✅ **Secret #2 criado!**

---

### 3.4 - Adicionar Secret #3: HETZNER_SSH_KEY

**Este é o mais importante!**

1. **No seu computador LOCAL, copie a chave PRIVADA:**

   ```bash
   # Se sua chave é id_ed25519:
   cat ~/.ssh/id_ed25519
   
   # Ou se sua chave é id_rsa:
   cat ~/.ssh/id_rsa
   ```

2. **Você vai ver algo assim:**
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   QyNTUxOQAAACB1234567890abcdefghijklmnopqrstuvwxyz...
   (várias linhas)
   ...xyz123
   -----END OPENSSH PRIVATE KEY-----
   ```

3. **⚠️ IMPORTANTE: Copie TUDO, incluindo as linhas BEGIN e END!**

4. **No GitHub, clique em "New repository secret"**

5. **Preencha:**
   ```
   Name: HETZNER_SSH_KEY
   
   Secret: [Cole TODA a chave privada aqui]
          ↑ Incluindo -----BEGIN e -----END
   ```

6. **Clique em "Add secret"**

✅ **Secret #3 criado!**

---

### 3.5 - Verificar que todos os 3 secrets foram criados

**Você deve ver na página:**
```
Actions secrets
┌─────────────────────────────────────┐
│ HETZNER_HOST         Updated now    │
│ HETZNER_USER         Updated now    │
│ HETZNER_SSH_KEY      Updated now    │
└─────────────────────────────────────┘
```

✅ **Todos os secrets configurados!**

---

## 📍 PASSO 4: TESTAR DEPLOY AUTOMÁTICO (5 minutos)

### 4.1 - Fazer um commit de teste

```bash
# 1. Criar commit vazio (só para testar)
git commit --allow-empty -m "test: Testar deploy automático no Hetzner"

# 2. Push para main (ou branch que você configurou)
git push origin main
```

---

### 4.2 - Acompanhar execução do GitHub Actions

1. **Abra a página de Actions:**
   👉 https://github.com/danilolimaCabral/markethub-crm-v2/actions

2. **Você vai ver um workflow rodando:**
   ```
   test: Testar deploy automático no Hetzner
   ⏳ In progress...
   ```

3. **Clique no workflow para ver detalhes**

4. **Você vai ver os jobs executando:**
   ```
   ✅ test                     (2-3 min)
   ✅ build                    (2-3 min)
   ⏳ deploy                   (2-3 min)
      ├─ Setup SSH
      ├─ Pre-deployment tests
      ├─ Build application
      ├─ Create backup
      ├─ Deploy to Hetzner
      ├─ Restart application
      └─ Health check
   ```

---

### 4.3 - O que esperar

**✅ Se tudo der certo:**
```
✅ All jobs completed successfully

Deploy to Hetzner
✅ SSH connection established
✅ Backup created
✅ Code deployed
✅ Migrations run
✅ Application restarted
✅ Health check passed
🎉 Deploy successful!
```

**Seu site estará atualizado em:**
👉 https://www.markthubcrm.com.br

---

**❌ Se der erro:**

1. **Erro de SSH:**
   ```
   ❌ Permission denied (publickey)
   ```
   → Verifique se copiou a chave privada correta
   → Verifique se a chave pública está no servidor

2. **Erro de conexão:**
   ```
   ❌ Connection timeout
   ```
   → Verifique se o IP está correto
   → Verifique se o servidor está ligado

3. **Erro de health check:**
   ```
   ❌ Health check failed
   ```
   → Servidor pode estar demorando para iniciar
   → Verifique logs no servidor: `pm2 logs`

---

## 🎉 PRONTO! DEPLOY AUTOMÁTICO ATIVO!

Agora, **a cada push na main**, o GitHub Actions vai:

1. ✅ Rodar testes
2. ✅ Fazer build
3. ✅ Criar backup no servidor
4. ✅ Deploy via SSH
5. ✅ Rodar migrations
6. ✅ Reiniciar aplicação
7. ✅ Health check
8. ✅ Rollback automático se falhar

---

## 📋 CHECKLIST FINAL

- [ ] Push do branch feito
- [ ] IP do Hetzner copiado
- [ ] Acesso SSH ao servidor funcionando
- [ ] Secret HETZNER_HOST adicionado
- [ ] Secret HETZNER_USER adicionado
- [ ] Secret HETZNER_SSH_KEY adicionado
- [ ] Commit de teste feito
- [ ] GitHub Actions rodando
- [ ] Deploy funcionou! 🎉

---

## 🆘 PRECISA DE AJUDA?

**Se tiver dúvida em algum passo, me fale qual:**
- "Não consegui fazer SSH no servidor"
- "Não achei o IP no Hetzner"
- "Não sei copiar a chave SSH"
- "GitHub Actions deu erro"
- etc.

**Vou te ajudar em cada detalhe!** 🚀

