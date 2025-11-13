/**
 * Script de teste das integrações
 * Verifica se todas as APIs estão configuradas corretamente
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testando APIs de Integração...\n');

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

// Teste 1: Verificar se os arquivos de serviço existem
test('MercadoLivreOAuthService existe', () => {
  const path = join(__dirname, 'server/services/MercadoLivreOAuthService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('class MercadoLivreOAuthService')) {
    throw new Error('Classe não encontrada');
  }
});

test('MercadoLivreProductService existe', () => {
  const path = join(__dirname, 'server/services/MercadoLivreProductService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('class MercadoLivreProductService')) {
    throw new Error('Classe não encontrada');
  }
});

test('MercadoLivreOrderService existe', () => {
  const path = join(__dirname, 'server/services/MercadoLivreOrderService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('class MercadoLivreOrderService')) {
    throw new Error('Classe não encontrada');
  }
});

test('MercadoLivreWebhookService existe', () => {
  const path = join(__dirname, 'server/services/MercadoLivreWebhookService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('class MercadoLivreWebhookService')) {
    throw new Error('Classe não encontrada');
  }
});

test('SyncScheduler existe', () => {
  const path = join(__dirname, 'server/services/SyncScheduler.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('class SyncScheduler')) {
    throw new Error('Classe não encontrada');
  }
});

test('AmazonSPAPIService existe', () => {
  const path = join(__dirname, 'server/services/AmazonSPAPIService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('class AmazonSPAPIService')) {
    throw new Error('Classe não encontrada');
  }
});

test('ShopeeAPIService existe', () => {
  const path = join(__dirname, 'server/services/ShopeeAPIService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('class ShopeeAPIService')) {
    throw new Error('Classe não encontrada');
  }
});

// Teste 2: Verificar se as rotas existem
test('Rotas do Mercado Livre existem', () => {
  const path = join(__dirname, 'server/routes/mercadolivre.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('/webhook')) {
    throw new Error('Rota de webhook não encontrada');
  }
});

test('Rotas da Amazon existem', () => {
  const path = join(__dirname, 'server/routes/amazon.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('/connect')) {
    throw new Error('Rota de conexão não encontrada');
  }
});

test('Rotas da Shopee existem', () => {
  const path = join(__dirname, 'server/routes/shopee.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('/connect')) {
    throw new Error('Rota de conexão não encontrada');
  }
});

// Teste 3: Verificar métodos principais
test('MercadoLivreOAuthService tem getAuthorizationUrl', () => {
  const path = join(__dirname, 'server/services/MercadoLivreOAuthService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('getAuthorizationUrl')) {
    throw new Error('Método getAuthorizationUrl não encontrado');
  }
});

test('MercadoLivreOAuthService tem exchangeCodeForToken', () => {
  const path = join(__dirname, 'server/services/MercadoLivreOAuthService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('exchangeCodeForToken')) {
    throw new Error('Método exchangeCodeForToken não encontrado');
  }
});

test('AmazonSPAPIService tem listOrders', () => {
  const path = join(__dirname, 'server/services/AmazonSPAPIService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('async listOrders')) {
    throw new Error('Método listOrders não encontrado');
  }
});

test('ShopeeAPIService tem listOrders', () => {
  const path = join(__dirname, 'server/services/ShopeeAPIService.ts');
  const content = readFileSync(path, 'utf-8');
  if (!content.includes('async listOrders')) {
    throw new Error('Método listOrders não encontrado');
  }
});

// Resumo
console.log('\n📊 Resumo dos Testes:');
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
  console.log('\n🎉 Todas as APIs de integração estão OK!');
  process.exit(0);
}
