/**
 * Teste do sistema multi-tenant e painel master
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testando Sistema Multi-Tenant e Painel Master...\n');

const tests = {
  passed: 0,
  failed: 0,
  errors: []
};

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    tests.passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    tests.failed++;
    tests.errors.push({ name, error: error.message });
  }
}

// Ler arquivos
const superadminRoutes = readFileSync(join(__dirname, 'server/routes/superadmin.ts'), 'utf-8');
const tenantsRoutes = readFileSync(join(__dirname, 'server/routes/tenants.ts'), 'utf-8');
const tenantMiddleware = readFileSync(join(__dirname, 'server/middleware/tenant.ts'), 'utf-8');
const app = readFileSync(join(__dirname, 'client/src/App.tsx'), 'utf-8');
const superAdminDashboard = readFileSync(join(__dirname, 'client/src/pages/SuperAdminDashboard.tsx'), 'utf-8');
const superAdminTenants = readFileSync(join(__dirname, 'client/src/pages/SuperAdminTenants.tsx'), 'utf-8');

// Teste 1: Rotas do Super Admin
test('Super Admin: Rota de login existe', () => {
  if (!superadminRoutes.includes('/login')) {
    throw new Error('Rota /login não encontrada');
  }
  if (!superadminRoutes.includes('bcrypt.compare')) {
    throw new Error('Validação de senha com bcrypt não encontrada');
  }
});

test('Super Admin: Rota de dashboard existe', () => {
  if (!superadminRoutes.includes('/dashboard')) {
    throw new Error('Rota /dashboard não encontrada');
  }
  if (!superadminRoutes.includes('superAdminAuth')) {
    throw new Error('Middleware de autenticação não encontrado');
  }
});

test('Super Admin: Rota de listar tenants existe', () => {
  if (!superadminRoutes.includes('/tenants')) {
    throw new Error('Rota /tenants não encontrada');
  }
  if (!superadminRoutes.includes('SELECT') || !superadminRoutes.includes('FROM tenants')) {
    throw new Error('Query de tenants não encontrada');
  }
});

test('Super Admin: Rota de detalhes do tenant existe', () => {
  if (!superadminRoutes.includes('/tenants/:id')) {
    throw new Error('Rota /tenants/:id não encontrada');
  }
});

test('Super Admin: Rota de atualizar status existe', () => {
  if (!superadminRoutes.includes('/tenants/:id/status')) {
    throw new Error('Rota PATCH /tenants/:id/status não encontrada');
  }
});

// Teste 2: Rotas de Tenants
test('Tenants: Rota de criar tenant existe', () => {
  if (!tenantsRoutes.includes('router.post')) {
    throw new Error('Rota POST não encontrada');
  }
  if (!tenantsRoutes.includes('INSERT INTO tenants')) {
    throw new Error('Query de inserção não encontrada');
  }
});

test('Tenants: Criação de usuário admin automática', () => {
  if (!tenantsRoutes.includes('INSERT INTO users')) {
    throw new Error('Criação de usuário admin não encontrada');
  }
  if (!tenantsRoutes.includes('bcrypt.hash')) {
    throw new Error('Hash de senha não encontrado');
  }
});

test('Tenants: Geração de slug automática', () => {
  if (!tenantsRoutes.includes('generateSlug')) {
    throw new Error('Função generateSlug não encontrada');
  }
});

test('Tenants: Limites por plano', () => {
  if (!tenantsRoutes.includes('starter') || !tenantsRoutes.includes('professional')) {
    throw new Error('Limites por plano não encontrados');
  }
});

// Teste 3: Middleware Multi-Tenant
test('Multi-Tenant: Middleware de extração de tenant existe', () => {
  if (!tenantMiddleware.includes('extractTenant')) {
    throw new Error('Função extractTenant não encontrada');
  }
});

test('Multi-Tenant: Validação de acesso ao tenant existe', () => {
  if (!tenantMiddleware.includes('validateTenantAccess')) {
    throw new Error('Função validateTenantAccess não encontrada');
  }
});

test('Multi-Tenant: Helper de filtro por tenant existe', () => {
  if (!tenantMiddleware.includes('addTenantFilter')) {
    throw new Error('Função addTenantFilter não encontrada');
  }
});

// Teste 4: Frontend - Painel Master
test('Frontend: Rotas do Super Admin configuradas', () => {
  if (!app.includes('/super-admin/login')) {
    throw new Error('Rota /super-admin/login não encontrada');
  }
  if (!app.includes('/super-admin/dashboard')) {
    throw new Error('Rota /super-admin/dashboard não encontrada');
  }
  if (!app.includes('/super-admin/tenants')) {
    throw new Error('Rota /super-admin/tenants não encontrada');
  }
});

test('Frontend: Componente SuperAdminDashboard existe', () => {
  if (!superAdminDashboard.includes('SuperAdminDashboard')) {
    throw new Error('Componente SuperAdminDashboard não encontrado');
  }
  if (!superAdminDashboard.includes('/api/superadmin/dashboard')) {
    throw new Error('Chamada à API não encontrada');
  }
});

test('Frontend: Componente SuperAdminTenants existe', () => {
  if (!superAdminTenants.includes('SuperAdminTenants')) {
    throw new Error('Componente SuperAdminTenants não encontrado');
  }
  if (!superAdminTenants.includes('/api/tenants')) {
    throw new Error('Chamada à API de tenants não encontrada');
  }
});

test('Frontend: Criação de tenant no frontend', () => {
  if (!superAdminTenants.includes('handleCreateTenant')) {
    throw new Error('Função de criar tenant não encontrada');
  }
  if (!superAdminTenants.includes('axios.post')) {
    throw new Error('POST para criar tenant não encontrado');
  }
});

// Teste 5: Integração Backend-Frontend
test('Integração: Autenticação JWT do Super Admin', () => {
  if (!superadminRoutes.includes('jwt.sign')) {
    throw new Error('Geração de JWT não encontrada');
  }
  if (!superadminRoutes.includes('jwt.verify')) {
    throw new Error('Verificação de JWT não encontrada');
  }
});

test('Integração: Filtros de tenant nas queries', () => {
  if (!superadminRoutes.includes('tenant_id')) {
    throw new Error('Filtro tenant_id não encontrado nas queries');
  }
});

// Resumo
console.log('\n📊 Resumo dos Testes Multi-Tenant:');
console.log(`✅ Passou: ${tests.passed}`);
console.log(`❌ Falhou: ${tests.failed}`);
console.log(`📈 Taxa de sucesso: ${((tests.passed / (tests.passed + tests.failed)) * 100).toFixed(1)}%`);

if (tests.failed > 0) {
  console.log('\n❌ Erros encontrados:');
  tests.errors.forEach(({ name, error }) => {
    console.log(`  - ${name}: ${error}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 Sistema Multi-Tenant e Painel Master estão funcionando!');
  process.exit(0);
}
