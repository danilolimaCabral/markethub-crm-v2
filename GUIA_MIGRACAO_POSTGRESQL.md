# 🐘 Guia de Migração para PostgreSQL

Este guia explica como migrar o MarketHub CRM de localStorage para PostgreSQL.

## 📋 Pré-requisitos

- PostgreSQL 12+ instalado
- Node.js 18+ instalado
- pnpm instalado

## 🚀 Passo a Passo

### 1. Instalar PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Windows
Baixe o instalador em: https://www.postgresql.org/download/windows/

### 2. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE markethub;

# Criar usuário (opcional)
CREATE USER markethub_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE markethub TO markethub_user;

# Sair
\q
```

### 3. Executar Scripts SQL

Execute os scripts na ordem correta:

```bash
# Navegar para o diretório do projeto
cd /caminho/para/markethub-crm-v2

# Executar scripts SQL
psql -U postgres -d markethub < database/01_create_tables.sql
psql -U postgres -d markethub < database/02_triggers_functions.sql
psql -U postgres -d markethub < database/03_views.sql
psql -U postgres -d markethub < database/04_seed_data.sql
psql -U postgres -d markethub < database/05_modulo_cmv.sql
psql -U postgres -d markethub < database/06_multi_tenant.sql
psql -U postgres -d markethub < database/07_clientes_master.sql
psql -U postgres -d markethub < database/08_pedidos.sql
psql -U postgres -d markethub < database/09_produtos.sql
```

### 4. Configurar Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
# Configuração do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=markethub
DB_USER=postgres
DB_PASSWORD=sua_senha

# Configuração da Aplicação
NODE_ENV=development
PORT=3000

# URL da API para o frontend
VITE_API_URL=http://localhost:3000/api
```

### 5. Instalar Dependências

```bash
pnpm install
```

### 6. Testar Conexão

```bash
# Testar health check da API
curl http://localhost:3000/api/health

# Resposta esperada:
# {"status":"ok","timestamp":"2025-11-10T...","database":"markethub"}
```

### 7. Iniciar Servidor

```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start
```

## 📊 Estrutura da API

### Clientes Master (`/api/clientes`)

- `GET /api/clientes` - Listar todos
- `GET /api/clientes/:id` - Buscar por ID
- `POST /api/clientes` - Criar novo
- `PUT /api/clientes/:id` - Atualizar
- `DELETE /api/clientes/:id` - Deletar
- `GET /api/clientes/stats/geral` - Estatísticas

### Pedidos (`/api/pedidos`)

- `GET /api/pedidos` - Listar com filtros
- `GET /api/pedidos/:id` - Buscar por ID
- `POST /api/pedidos` - Criar novo
- `PUT /api/pedidos/:id` - Atualizar
- `DELETE /api/pedidos/:id` - Deletar
- `GET /api/pedidos/stats/geral` - Estatísticas
- `GET /api/pedidos/stats/marketplace` - Por marketplace

### Produtos (`/api/produtos`)

- `GET /api/produtos` - Listar com filtros
- `GET /api/produtos/:id` - Buscar por ID
- `GET /api/produtos/sku/:sku` - Buscar por SKU
- `POST /api/produtos` - Criar novo
- `PUT /api/produtos/:id` - Atualizar
- `PATCH /api/produtos/:id/estoque` - Atualizar estoque
- `DELETE /api/produtos/:id` - Deletar
- `GET /api/produtos/stats/geral` - Estatísticas
- `GET /api/produtos/stats/categoria` - Por categoria
- `GET /api/produtos/alerta/estoque` - Alertas de estoque

## 🔄 Migração de Dados do localStorage

Se você já tem dados no localStorage e quer migrar para PostgreSQL:

### Opção 1: Exportar e Importar Manualmente

1. Abra o console do navegador (F12)
2. Execute o script de exportação:

```javascript
// Exportar dados do localStorage
const dados = {
  clientes: JSON.parse(localStorage.getItem('markethub_clientes') || '[]'),
  pedidos: JSON.parse(localStorage.getItem('markethub_pedidos') || '[]'),
  produtos: JSON.parse(localStorage.getItem('markethub_produtos') || '[]')
};

console.log(JSON.stringify(dados, null, 2));
// Copie o resultado
```

3. Use a API para importar:

```bash
# Importar clientes
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","empresa":"Silva Store","email":"joao@silva.com"}'

# Importar pedidos
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"numero_pedido":"ML-001","cliente_nome":"João Silva","marketplace":"Mercado Livre","valor_total":100.00}'

# Importar produtos
curl -X POST http://localhost:3000/api/produtos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Produto Teste","sku":"PROD-001","preco_venda":50.00}'
```

### Opção 2: Script de Migração Automática

Crie um script `migrate-localstorage.js`:

```javascript
const fs = require('fs');
const axios = require('axios');

// Ler dados exportados
const dados = JSON.parse(fs.readFileSync('dados-localstorage.json', 'utf8'));

async function migrar() {
  const API_URL = 'http://localhost:3000/api';
  
  // Migrar clientes
  for (const cliente of dados.clientes) {
    try {
      await axios.post(`${API_URL}/clientes`, cliente);
      console.log(`✅ Cliente migrado: ${cliente.nome}`);
    } catch (error) {
      console.error(`❌ Erro ao migrar cliente: ${cliente.nome}`, error.message);
    }
  }
  
  // Migrar pedidos
  for (const pedido of dados.pedidos) {
    try {
      await axios.post(`${API_URL}/pedidos`, pedido);
      console.log(`✅ Pedido migrado: ${pedido.numero_pedido}`);
    } catch (error) {
      console.error(`❌ Erro ao migrar pedido: ${pedido.numero_pedido}`, error.message);
    }
  }
  
  // Migrar produtos
  for (const produto of dados.produtos) {
    try {
      await axios.post(`${API_URL}/produtos`, produto);
      console.log(`✅ Produto migrado: ${produto.nome}`);
    } catch (error) {
      console.error(`❌ Erro ao migrar produto: ${produto.nome}`, error.message);
    }
  }
}

migrar().then(() => console.log('✅ Migração concluída!'));
```

Execute:

```bash
node migrate-localstorage.js
```

## 🧪 Testes

### Testar Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Listar clientes
curl http://localhost:3000/api/clientes

# Criar cliente
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","empresa":"Teste LTDA","email":"teste@teste.com","plano":"starter","status":"trial"}'

# Listar pedidos
curl http://localhost:3000/api/pedidos

# Listar produtos
curl http://localhost:3000/api/produtos

# Estatísticas
curl http://localhost:3000/api/clientes/stats/geral
curl http://localhost:3000/api/pedidos/stats/geral
curl http://localhost:3000/api/produtos/stats/geral
```

## 🔧 Troubleshooting

### Erro: "Connection refused"

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql
```

### Erro: "database does not exist"

```bash
# Criar banco de dados
sudo -u postgres createdb markethub
```

### Erro: "password authentication failed"

Edite o arquivo `.env` com as credenciais corretas:

```env
DB_USER=postgres
DB_PASSWORD=sua_senha_correta
```

### Erro: "relation does not exist"

Execute os scripts SQL novamente:

```bash
psql -U postgres -d markethub < database/07_clientes_master.sql
psql -U postgres -d markethub < database/08_pedidos.sql
psql -U postgres -d markethub < database/09_produtos.sql
```

## 📚 Próximos Passos

1. ✅ Migrar frontend para usar API (substituir localStorage)
2. ✅ Adicionar autenticação JWT
3. ✅ Implementar WebSockets para atualizações em tempo real
4. ✅ Adicionar cache com Redis
5. ✅ Implementar backup automático
6. ✅ Configurar monitoramento com Prometheus

## 🎯 Benefícios da Migração

- ✅ **Dados persistentes** - Não perde mais dados ao limpar cache
- ✅ **Multi-usuário** - Vários usuários acessando simultaneamente
- ✅ **Performance** - Queries otimizadas e índices
- ✅ **Segurança** - Controle de acesso e auditoria
- ✅ **Escalabilidade** - Suporta milhões de registros
- ✅ **Backup** - Backup automático e recuperação
- ✅ **Integridade** - Constraints e validações no banco
- ✅ **Relatórios** - Queries complexas e agregações

## 📞 Suporte

Se tiver problemas, consulte:
- Documentação PostgreSQL: https://www.postgresql.org/docs/
- Issues do projeto: https://github.com/danilolimaCabral/markethub-crm-v2/issues
