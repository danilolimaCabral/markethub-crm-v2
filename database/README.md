# 📊 Database - Markthub CRM

## Estrutura de Migrations

As migrations do banco de dados devem ser executadas na ordem numérica para garantir a integridade do schema.

### Ordem de Execução

```bash
# 1. Criar todas as tabelas
psql -U postgres -d markethub < 01_create_tables.sql

# 2. Criar triggers e functions
psql -U postgres -d markethub < 02_triggers_functions.sql

# 3. Criar views otimizadas
psql -U postgres -d markethub < 03_views.sql

# 4. Inserir dados iniciais (seed)
psql -U postgres -d markethub < 04_seed_data.sql

# 5. Módulo CMV (Custo de Mercadoria Vendida)
psql -U postgres -d markethub < 05_modulo_cmv.sql

# 6. Sistema Multi-Tenant
psql -U postgres -d markethub < 06_multi_tenant.sql

# 7. Tabelas de clientes master
psql -U postgres -d markethub < 07_clientes_master.sql

# 8. Sistema de pedidos
psql -U postgres -d markethub < 08_pedidos.sql

# 9. Sistema de produtos
psql -U postgres -d markethub < 09_produtos.sql
```

## Script Automatizado

Use o script fornecido para executar todas as migrations:

```bash
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh
```

## Conexão

### Variáveis de Ambiente

```bash
DATABASE_URL=postgresql://usuario:senha@localhost:5432/markethub
```

ou

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=markethub
DB_USER=postgres
DB_PASSWORD=postgres
```

## Backup e Restore

### Backup

```bash
# Backup completo
pg_dump -U postgres -d markethub -F c -f backup_$(date +%Y%m%d).dump

# Backup apenas schema
pg_dump -U postgres -d markethub --schema-only -f schema.sql

# Backup apenas dados
pg_dump -U postgres -d markethub --data-only -f data.sql
```

### Restore

```bash
# Restore de arquivo dump
pg_restore -U postgres -d markethub backup_20250115.dump

# Restore de arquivo SQL
psql -U postgres -d markethub < backup.sql
```

## Estrutura de Tabelas

### Autenticação e Usuários
- `users` - Usuários do sistema
- `user_permissions` - Permissões granulares por módulo
- `backup_codes` - Códigos de backup para 2FA

### Multi-Tenant
- `tenants` - Empresas/clientes (multi-tenant)
- `planos_assinatura` - Planos disponíveis (Starter, Professional, etc)

### Produtos
- `products` - Catálogo de produtos
- `product_variations` - Variações (tamanho, cor, etc)

### Clientes
- `customers` - Base de clientes

### Pedidos
- `orders` - Pedidos de venda
- `order_items` - Itens de cada pedido
- `order_status_history` - Histórico de mudanças de status

### Financeiro
- `financial_transactions` - Transações financeiras
- `variable_costs` - Custos variáveis (PAX)

### Integrações
- `marketplace_integrations` - Configurações de marketplaces
- `marketplace_sync_log` - Log de sincronizações

### Auditoria
- `audit_log` - Log de auditoria de todas as ações
- `system_logs` - Logs do sistema
- `system_metrics` - Métricas de performance

## Índices Importantes

Todos criados automaticamente pelas migrations:

```sql
-- Usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- Produtos
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category);

-- Pedidos
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Clientes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
```

## Manutenção

### Análise de Performance

```sql
-- Ver queries lentas
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Ver tamanho das tabelas
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver índices não utilizados
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE 'pg_toast%';
```

### Otimização

```sql
-- Analisar tabelas
ANALYZE;

-- Vacuum
VACUUM ANALYZE;

-- Reindexar (se necessário)
REINDEX DATABASE markethub;
```

## Troubleshooting

### Erro de Conexão

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql
```

### Erro de Permissão

```sql
-- Dar permissões ao usuário
GRANT ALL PRIVILEGES ON DATABASE markethub TO seu_usuario;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seu_usuario;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seu_usuario;
```

### Resetar Banco (CUIDADO!)

```bash
# Dropar e recriar
dropdb -U postgres markethub
createdb -U postgres markethub

# Executar migrations novamente
./scripts/run-migrations.sh
```

## Documentação Adicional

- `DATABASE_STRUCTURE.md` - Estrutura detalhada do banco
- `ARQUITETURA_MULTI_TENANT.md` - Arquitetura SaaS
- `diagrams/database-er.png` - Diagrama ER

---

**Desenvolvido com ❤️ para Markthub CRM**
