# Correções de Isolamento de Tenant - MarketHub CRM v2

## Problemas Identificados

1. **Rota de Pedidos (pedidos.ts linha 50-80):** Query não filtra por tenant_id
2. **Possíveis dados de exemplo no banco:** Novos tenants podem estar vendo dados de outros usuários
3. **Botões de CRUD não funcionam:** Funcionalidades de criar, editar e deletar não estão operacionais

## Correções a Implementar

### 1. Corrigir Rota de Pedidos

**Arquivo:** `/server/routes/pedidos.ts`
**Linha:** 50-80

**Problema:** A query usa `WHERE 1=1` sem filtrar por tenant_id

**Solução:** Adicionar filtro de tenant_id na query

### 2. Verificar e Limpar Dados de Exemplo

**Ação:** Verificar se há dados de exemplo no banco que não estão associados a nenhum tenant específico

### 3. Implementar Funcionalidades de CRUD

**Ação:** Garantir que todos os botões de criar, editar e deletar estejam funcionais e filtrem corretamente por tenant_id

