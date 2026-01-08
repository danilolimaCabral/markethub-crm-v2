-- Migration 008: Correção Completa de Isolamento de Tenant
-- Data: 2026-01-07
-- Descrição: Adiciona tenant_id em todas as tabelas que faltam e corrige isolamento de dados

-- 1. Adicionar tenant_id na tabela clientes_master
ALTER TABLE clientes_master 
ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_clientes_master_tenant_id ON clientes_master(tenant_id);

-- 2. Adicionar tenant_id na tabela pedidos (se não existir)
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant_id ON pedidos(tenant_id);

-- 3. Adicionar tenant_id na tabela tickets (se não existir)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets(tenant_id);

-- 4. Limpar dados de exemplo/teste que não têm tenant_id
-- CUIDADO: Isso vai deletar dados órfãos
DELETE FROM clientes_master WHERE tenant_id IS NULL;
DELETE FROM pedidos WHERE tenant_id IS NULL;
DELETE FROM tickets WHERE tenant_id IS NULL;

-- 5. Tornar tenant_id obrigatório
ALTER TABLE clientes_master ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pedidos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN tenant_id SET NOT NULL;

-- 6. Adicionar constraint UNIQUE composta onde faz sentido
-- Exemplo: Um cliente não pode ter o mesmo email dentro do mesmo tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_master_tenant_email 
ON clientes_master(tenant_id, email);
