# 🔧 Guia de Correção Completa - MarketHub CRM v2

**Data:** 06 de Janeiro de 2026  
**Versão:** 2.0  
**Status:** ✅ Correções Implementadas

---

## 📋 Índice

1. [Resumo das Correções](#resumo-das-correções)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo a Passo de Correção](#passo-a-passo-de-correção)
4. [Validação e Testes](#validação-e-testes)
5. [Troubleshooting](#troubleshooting)
6. [Referências](#referências)

---

## 🎯 Resumo das Correções

Este guia documenta todas as correções aplicadas ao sistema MarketHub CRM v2 para resolver os problemas de integração com o Mercado Livre.

### Problemas Corrigidos

| Problema | Solução Aplicada | Arquivo/Migration |
| :--- | :--- | :--- |
| **Tipos de ID inconsistentes** | Alterado `user_id`, `tenant_id` e `created_by` de `INTEGER` para `UUID` | `006_fix_marketplace_credentials_types.sql` |
| **Constraint UNIQUE incorreta** | Alterado de `UNIQUE(marketplace)` para `UNIQUE(tenant_id, marketplace)` | `007_fix_marketplace_integrations_unique.sql` |
| **Validação de credenciais fraca** | Implementado validação obrigatória de variáveis de ambiente | `getClientCredentials.ts` |
| **Chave de criptografia padrão** | Adicionado validação e aviso de segurança | `getClientCredentials.ts` |

---

## ✅ Pré-requisitos

Antes de aplicar as correções, certifique-se de que:

### 1. Assinatura do Railway Ativa

A assinatura do Railway **DEVE** estar ativa e o banco de dados acessível.

```bash
# Testar conexão com o banco
psql "$DATABASE_URL" -c "SELECT 1;"
```

Se o comando acima falhar, **regularize a assinatura do Railway primeiro**.

### 2. Variáveis de Ambiente Configuradas

Certifique-se de que as seguintes variáveis estão configuradas no Railway:

#### Obrigatórias:
- `DATABASE_URL` - URL de conexão com PostgreSQL
- `JWT_SECRET` - Chave secreta para JWT (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET` - Chave para refresh tokens (mínimo 32 caracteres)
- `ENCRYPTION_KEY` - Chave para criptografia de credenciais (mínimo 32 caracteres)

#### Recomendadas:
- `ML_CLIENT_ID` - Client ID do aplicativo Mercado Livre
- `ML_CLIENT_SECRET` - Client Secret do aplicativo Mercado Livre
- `ML_REDIRECT_URI` - URL de callback OAuth2
- `NODE_ENV=production`
- `PORT=3000`

### 3. Backup do Banco de Dados

**SEMPRE** faça backup antes de aplicar correções:

```bash
pg_dump "$DATABASE_URL" > markethub_backup_$(date +%Y%m%d).sql
```

---

## 🚀 Passo a Passo de Correção

### Passo 1: Clonar/Atualizar Repositório

```bash
# Se ainda não clonou
git clone https://github.com/danilolimaCabral/markethub-crm-v2.git
cd markethub-crm-v2

# Se já tem o repositório
cd markethub-crm-v2
git pull origin main
```

### Passo 2: Validar Ambiente

Execute o script de validação para identificar problemas:

```bash
# Configurar DATABASE_URL
export DATABASE_URL="sua_url_do_railway_aqui"

# Executar validação
./scripts/validate-environment.sh
```

**Resultado esperado:**
- ✅ Todas as variáveis obrigatórias configuradas
- ✅ Conexão com banco de dados estabelecida
- ⚠️  Alguns avisos são aceitáveis (credenciais opcionais)

### Passo 3: Aplicar Correções no Banco de Dados

Execute o script de correção completa:

```bash
# Aplicar todas as migrations de correção
./scripts/fix-database-complete.sh
```

**O que este script faz:**
1. Cria backup automático do banco
2. Aplica Migration 006 (corrige tipos de ID)
3. Aplica Migration 007 (corrige constraint UNIQUE)
4. Valida as correções aplicadas

**Resultado esperado:**
```
✅ Migration 006 aplicada com sucesso
✅ Migration 007 aplicada com sucesso
✅ Tipos de colunas corrigidos para UUID
✅ Foreign keys recriadas
```

### Passo 4: Commit e Push das Alterações

```bash
# Adicionar arquivos corrigidos
git add .

# Fazer commit
git commit -m "fix: Corrigir tipos de ID e validações de credenciais

- Corrigir tipos de user_id, tenant_id para UUID
- Corrigir constraint UNIQUE na tabela marketplace_integrations
- Adicionar validações robustas em getClientCredentials
- Criar scripts de correção e validação"

# Push para o repositório
git push origin main
```

### Passo 5: Deploy no Railway

O Railway fará deploy automático após o push. Acompanhe:

1. Acesse: https://railway.app
2. Vá para seu projeto
3. Aba "Deployments"
4. Aguarde o build e deploy completarem (3-5 minutos)

### Passo 6: Validar em Produção

Após o deploy, valide o sistema:

```bash
# Testar health check
curl https://seu-dominio.railway.app/api/health

# Resultado esperado:
# {"status":"ok","database":"connected"}
```

---

## ✅ Validação e Testes

### 1. Validar Estrutura do Banco

Execute no Railway (via Data → Query):

```sql
-- Verificar tipos de colunas
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'marketplace_credentials'
  AND column_name IN ('user_id', 'tenant_id', 'created_by')
ORDER BY column_name;

-- Resultado esperado: todos devem ser 'uuid'
```

### 2. Testar Integração com Mercado Livre

1. Faça login no sistema
2. Vá para "Mercado Livre" → "Conectar"
3. Deve redirecionar para página de autorização do ML
4. Após autorizar, deve retornar conectado

### 3. Validar Logs

Verifique os logs no Railway para confirmar que não há erros:

```
✅ Buscando credenciais para usuário...
✅ Usando credenciais específicas do cliente...
✅ Credenciais globais do sistema validadas com sucesso
```

---

## 🔧 Troubleshooting

### Erro: "relation 'users' does not exist"

**Causa:** Migrations não foram executadas.

**Solução:**
```bash
# No Railway, execute via terminal:
railway run node scripts/migrate.js
```

### Erro: "column 'user_id' cannot be cast to type uuid"

**Causa:** Dados existentes com IDs inválidos.

**Solução:**
```sql
-- Limpar dados inválidos antes de aplicar migration
DELETE FROM marketplace_credentials WHERE user_id NOT IN (SELECT id FROM users);
```

### Erro: "ENCRYPTION_KEY não está configurada"

**Causa:** Variável de ambiente faltando.

**Solução:**
```bash
# Gerar chave segura
openssl rand -base64 32

# Configurar no Railway:
# Variables → Add Variable → ENCRYPTION_KEY → (colar chave gerada)
```

### Erro: "Token inválido ou expirado" (403)

**Causa:** Token JWT expirado ou usuário inativo.

**Solução:**
```sql
-- Verificar status do usuário
SELECT id, email, is_active, tenant_id FROM users WHERE email = 'seu_email@exemplo.com';

-- Ativar usuário se necessário
UPDATE users SET is_active = true WHERE email = 'seu_email@exemplo.com';
```

### Erro: "Assinatura do Railway vencida"

**Causa:** Pagamento pendente no Railway.

**Solução:**
1. Acesse: https://railway.app/account/billing
2. Pague o saldo pendente
3. Aguarde reativação (geralmente instantâneo)
4. Execute as migrations novamente

---

## 📚 Referências

### Arquivos Criados/Modificados

| Arquivo | Descrição |
| :--- | :--- |
| `db/migrations/006_fix_marketplace_credentials_types.sql` | Migration para corrigir tipos de ID |
| `db/migrations/007_fix_marketplace_integrations_unique.sql` | Migration para corrigir constraint UNIQUE |
| `server/utils/getClientCredentials.ts` | Versão corrigida com validações robustas |
| `scripts/fix-database-complete.sh` | Script de correção completa do banco |
| `scripts/validate-environment.sh` | Script de validação de ambiente |
| `GUIA_CORRECAO_COMPLETA.md` | Este guia |

### Documentação Relacionada

- [Relatório de Análise Inicial](relatorio_final_markethub.md)
- [Relatório Complementar](relatorio_complementar_markethub.md)
- [Documentação da API do Mercado Livre](https://developers.mercadolivre.com.br/)

---

## 🎉 Conclusão

Após seguir este guia, o sistema MarketHub CRM v2 estará com:

✅ Banco de dados corrigido e otimizado  
✅ Validações robustas implementadas  
✅ Arquitetura multi-tenant funcionando corretamente  
✅ Integração com Mercado Livre operacional  
✅ Scripts de manutenção e validação disponíveis  

**Próximos passos:**
1. Testar com usuários reais
2. Monitorar logs por 24-48h
3. Remover backups após 7 dias de estabilidade
4. Documentar quaisquer novos problemas encontrados

---

**Dúvidas ou problemas?** Consulte os relatórios de análise ou entre em contato com o suporte técnico.
