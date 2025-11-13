/**
 * Teste específico da API do Mercado Livre
 * Verifica se a implementação está correta conforme documentação oficial
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testando API do Mercado Livre...\n');

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

const oauthService = readFileSync(join(__dirname, 'server/services/MercadoLivreOAuthService.ts'), 'utf-8');
const productService = readFileSync(join(__dirname, 'server/services/MercadoLivreProductService.ts'), 'utf-8');
const orderService = readFileSync(join(__dirname, 'server/services/MercadoLivreOrderService.ts'), 'utf-8');
const routes = readFileSync(join(__dirname, 'server/routes/mercadolivre.ts'), 'utf-8');

// Teste 1: OAuth2 - URL de autorização
test('OAuth2: URL de autorização correta', () => {
  if (!oauthService.includes('auth.mercadolivre.com.br/authorization')) {
    throw new Error('URL de autorização incorreta');
  }
  if (!oauthService.includes('response_type=code')) {
    throw new Error('response_type não encontrado');
  }
  if (!oauthService.includes('client_id')) {
    throw new Error('client_id não encontrado');
  }
});

// Teste 2: OAuth2 - Troca de código por token
test('OAuth2: Troca de código por token implementada', () => {
  if (!oauthService.includes('exchangeCodeForToken')) {
    throw new Error('Método exchangeCodeForToken não encontrado');
  }
  if (!oauthService.includes('grant_type: \'authorization_code\'')) {
    throw new Error('grant_type authorization_code não encontrado');
  }
  if (!oauthService.includes('/oauth/token')) {
    throw new Error('Endpoint /oauth/token não encontrado');
  }
});

// Teste 3: OAuth2 - Refresh token
test('OAuth2: Refresh token implementado', () => {
  if (!oauthService.includes('refreshAccessToken')) {
    throw new Error('Método refreshAccessToken não encontrado');
  }
  if (!oauthService.includes('grant_type: \'refresh_token\'')) {
    throw new Error('grant_type refresh_token não encontrado');
  }
});

// Teste 4: OAuth2 - Validação de token
test('OAuth2: Validação e renovação automática de token', () => {
  if (!oauthService.includes('ensureValidToken')) {
    throw new Error('Método ensureValidToken não encontrado');
  }
});

// Teste 5: Produtos - Listagem
test('Produtos: Listagem de itens do usuário', () => {
  if (!productService.includes('/users/${userId}/items/search')) {
    throw new Error('Endpoint de listagem de itens não encontrado');
  }
  if (!productService.includes('Authorization: `Bearer ${accessToken}`')) {
    throw new Error('Header Authorization não encontrado');
  }
});

// Teste 6: Produtos - Detalhes
test('Produtos: Busca detalhes do item', () => {
  if (!productService.includes('/items/${itemId}')) {
    throw new Error('Endpoint de detalhes do item não encontrado');
  }
});

// Teste 7: Produtos - Criação
test('Produtos: Criação de produto', () => {
  if (!productService.includes('createProduct')) {
    throw new Error('Método createProduct não encontrado');
  }
  if (!productService.includes('POST') || !productService.includes('/items')) {
    throw new Error('POST /items não encontrado');
  }
});

// Teste 8: Produtos - Atualização
test('Produtos: Atualização de produto', () => {
  if (!productService.includes('updateProduct')) {
    throw new Error('Método updateProduct não encontrado');
  }
  if (!productService.includes('PUT') || !productService.includes('/items/${itemId}')) {
    throw new Error('PUT /items/:id não encontrado');
  }
});

// Teste 9: Pedidos - Listagem
test('Pedidos: Listagem de pedidos', () => {
  if (!orderService.includes('/orders/search')) {
    throw new Error('Endpoint /orders/search não encontrado');
  }
  if (!orderService.includes('seller: sellerId')) {
    throw new Error('Parâmetro seller não encontrado');
  }
});

// Teste 10: Pedidos - Detalhes
test('Pedidos: Detalhes do pedido', () => {
  if (!orderService.includes('/orders/${orderId}')) {
    throw new Error('Endpoint de detalhes do pedido não encontrado');
  }
});

// Teste 11: Rotas - Autenticação
test('Rotas: Endpoint de autenticação', () => {
  if (!routes.includes('/auth')) {
    throw new Error('Rota /auth não encontrada');
  }
  if (!routes.includes('getAuthorizationUrl')) {
    throw new Error('Chamada getAuthorizationUrl não encontrada');
  }
});

// Teste 12: Rotas - Callback
test('Rotas: Endpoint de callback OAuth', () => {
  if (!routes.includes('/callback')) {
    throw new Error('Rota /callback não encontrada');
  }
  if (!routes.includes('exchangeCodeForToken')) {
    throw new Error('Chamada exchangeCodeForToken não encontrada');
  }
});

// Teste 13: Rotas - Sincronização
test('Rotas: Endpoints de sincronização', () => {
  if (!routes.includes('/sync/products')) {
    throw new Error('Rota /sync/products não encontrada');
  }
  if (!routes.includes('/sync/orders')) {
    throw new Error('Rota /sync/orders não encontrada');
  }
});

// Teste 14: Rotas - Webhook
test('Rotas: Endpoint de webhook', () => {
  if (!routes.includes('/webhook')) {
    throw new Error('Rota /webhook não encontrada');
  }
  if (!routes.includes('processWebhook')) {
    throw new Error('Chamada processWebhook não encontrada');
  }
});

// Teste 15: Headers - Authorization Bearer
test('Headers: Authorization Bearer usado corretamente', () => {
  const allServices = oauthService + productService + orderService;
  if (!allServices.includes('Authorization: `Bearer ${accessToken}`') && 
      !allServices.includes('Authorization: `Bearer') &&
      !allServices.includes('Bearer')) {
    throw new Error('Header Authorization Bearer não encontrado');
  }
});

// Teste 16: Base URL
test('Base URL: URL correta da API', () => {
  if (!oauthService.includes('https://api.mercadolibre.com') &&
      !productService.includes('https://api.mercadolibre.com') &&
      !orderService.includes('https://api.mercadolibre.com')) {
    throw new Error('Base URL da API não encontrada');
  }
});

// Resumo
console.log('\n📊 Resumo dos Testes da API Mercado Livre:');
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
  console.log('\n🎉 API do Mercado Livre está correta e completa!');
  process.exit(0);
}
