#!/usr/bin/env tsx
/**
 * Script de Teste Completo de APIs
 * Testa todas as rotas da API e gera relatório de status
 */

import axios, { AxiosError } from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'OK' | 'FAIL' | 'SKIP';
  statusCode?: number;
  message: string;
  responseTime?: number;
}

const results: TestResult[] = [];

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  expectedStatus: number = 200,
  data?: any,
  headers?: any,
  description?: string
): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
      validateStatus: () => true, // Aceita qualquer status
    });
    
    const responseTime = Date.now() - startTime;
    const success = response.status === expectedStatus;
    
    return {
      endpoint,
      method,
      status: success ? 'OK' : 'FAIL',
      statusCode: response.status,
      message: success 
        ? `${description || 'Success'} (${responseTime}ms)`
        : `Expected ${expectedStatus}, got ${response.status}`,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const err = error as AxiosError;
    
    return {
      endpoint,
      method,
      status: 'FAIL',
      statusCode: err.response?.status,
      message: err.message,
      responseTime,
    };
  }
}

async function runTests() {
  log('cyan', '\n' + '='.repeat(60));
  log('cyan', '🧪 TESTE COMPLETO DE APIS - MARKTHUB CRM V2');
  log('cyan', '='.repeat(60) + '\n');
  
  log('blue', `📍 Base URL: ${BASE_URL}\n`);

  // ========================================
  // 1. HEALTH CHECK
  // ========================================
  log('yellow', '📊 1. HEALTH CHECK');
  results.push(await testEndpoint('GET', '/api/health', 200, undefined, undefined, 'Health check'));
  
  // ========================================
  // 2. AUTENTICAÇÃO
  // ========================================
  log('yellow', '\n🔐 2. AUTENTICAÇÃO');
  results.push(await testEndpoint('POST', '/api/auth/login', 400, {}, undefined, 'Login (sem credenciais)'));
  results.push(await testEndpoint('POST', '/api/auth/register', 400, {}, undefined, 'Register (sem dados)'));
  results.push(await testEndpoint('POST', '/api/auth/logout', 401, undefined, undefined, 'Logout (sem token)'));
  results.push(await testEndpoint('POST', '/api/auth/refresh', 401, undefined, undefined, 'Refresh token (sem token)'));
  results.push(await testEndpoint('POST', '/api/auth/verify-2fa', 400, {}, undefined, 'Verify 2FA (sem código)'));
  
  // ========================================
  // 3. CLIENTES
  // ========================================
  log('yellow', '\n👥 3. CLIENTES');
  results.push(await testEndpoint('GET', '/api/clientes', 401, undefined, undefined, 'Listar clientes (sem auth)'));
  results.push(await testEndpoint('POST', '/api/clientes', 401, {}, undefined, 'Criar cliente (sem auth)'));
  results.push(await testEndpoint('GET', '/api/clientes/1', 401, undefined, undefined, 'Buscar cliente (sem auth)'));
  
  // ========================================
  // 4. PRODUTOS
  // ========================================
  log('yellow', '\n📦 4. PRODUTOS');
  results.push(await testEndpoint('GET', '/api/produtos', 401, undefined, undefined, 'Listar produtos (sem auth)'));
  results.push(await testEndpoint('POST', '/api/produtos', 401, {}, undefined, 'Criar produto (sem auth)'));
  results.push(await testEndpoint('GET', '/api/produtos/1', 401, undefined, undefined, 'Buscar produto (sem auth)'));
  
  // ========================================
  // 5. PEDIDOS
  // ========================================
  log('yellow', '\n🛒 5. PEDIDOS');
  results.push(await testEndpoint('GET', '/api/pedidos', 401, undefined, undefined, 'Listar pedidos (sem auth)'));
  results.push(await testEndpoint('POST', '/api/pedidos', 401, {}, undefined, 'Criar pedido (sem auth)'));
  results.push(await testEndpoint('GET', '/api/pedidos/1', 401, undefined, undefined, 'Buscar pedido (sem auth)'));
  
  // ========================================
  // 6. MERCADO LIVRE
  // ========================================
  log('yellow', '\n🛍️ 6. MERCADO LIVRE');
  results.push(await testEndpoint('GET', '/api/mercadolivre/auth', 302, undefined, undefined, 'Auth redirect'));
  results.push(await testEndpoint('GET', '/api/mercadolivre/callback', 400, undefined, undefined, 'Callback (sem code)'));
  results.push(await testEndpoint('GET', '/api/mercadolivre/status', 401, undefined, undefined, 'Status (sem auth)'));
  results.push(await testEndpoint('GET', '/api/mercadolivre/orders', 401, undefined, undefined, 'Orders (sem auth)'));
  results.push(await testEndpoint('GET', '/api/mercadolivre/products', 401, undefined, undefined, 'Products (sem auth)'));
  
  // ========================================
  // 7. INTELIGÊNCIA ARTIFICIAL
  // ========================================
  log('yellow', '\n🤖 7. INTELIGÊNCIA ARTIFICIAL');
  results.push(await testEndpoint('POST', '/api/ai/chat', 401, {}, undefined, 'Chat (sem auth)'));
  results.push(await testEndpoint('POST', '/api/ai/analyze-product', 401, {}, undefined, 'Analyze product (sem auth)'));
  results.push(await testEndpoint('POST', '/api/ai/generate-description', 401, {}, undefined, 'Generate description (sem auth)'));
  
  // ========================================
  // 8. TENANTS (MULTI-TENANT)
  // ========================================
  log('yellow', '\n🏢 8. TENANTS');
  results.push(await testEndpoint('GET', '/api/tenants', 401, undefined, undefined, 'Listar tenants (sem auth)'));
  results.push(await testEndpoint('POST', '/api/tenants', 401, {}, undefined, 'Criar tenant (sem auth)'));
  results.push(await testEndpoint('GET', '/api/tenants/1', 401, undefined, undefined, 'Buscar tenant (sem auth)'));
  
  // ========================================
  // 9. PAGAMENTOS (STRIPE)
  // ========================================
  log('yellow', '\n💳 9. PAGAMENTOS');
  results.push(await testEndpoint('POST', '/api/payments/create-checkout', 401, {}, undefined, 'Create checkout (sem auth)'));
  results.push(await testEndpoint('POST', '/api/payments/webhook', 400, {}, undefined, 'Webhook (sem signature)'));
  results.push(await testEndpoint('GET', '/api/payments/subscriptions', 401, undefined, undefined, 'Subscriptions (sem auth)'));
  
  // ========================================
  // 10. INTEGRAÇÕES
  // ========================================
  log('yellow', '\n🔌 10. INTEGRAÇÕES');
  results.push(await testEndpoint('GET', '/api/v1/integrations', 401, undefined, undefined, 'Listar integrações (sem auth)'));
  results.push(await testEndpoint('POST', '/api/v1/integrations/connect', 401, {}, undefined, 'Connect (sem auth)'));
  
  // ========================================
  // 11. SUPER ADMIN
  // ========================================
  log('yellow', '\n👑 11. SUPER ADMIN');
  results.push(await testEndpoint('GET', '/api/superadmin/stats', 401, undefined, undefined, 'Stats (sem auth)'));
  results.push(await testEndpoint('GET', '/api/superadmin/tenants', 401, undefined, undefined, 'Tenants (sem auth)'));
  
  // ========================================
  // 12. API INFO
  // ========================================
  log('yellow', '\n📚 12. API INFO');
  results.push(await testEndpoint('GET', '/api/info', 200, undefined, undefined, 'API info'));
  
  // ========================================
  // RESULTADOS
  // ========================================
  printResults();
}

function printResults() {
  log('cyan', '\n' + '='.repeat(60));
  log('cyan', '📊 RESULTADOS DOS TESTES');
  log('cyan', '='.repeat(60) + '\n');
  
  const okCount = results.filter(r => r.status === 'OK').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  
  // Tabela de resultados
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Endpoint                          │ Status │ Message    │');
  console.log('├─────────────────────────────────────────────────────────┤');
  
  results.forEach(result => {
    const statusColor = result.status === 'OK' ? 'green' : result.status === 'FAIL' ? 'red' : 'yellow';
    const statusIcon = result.status === 'OK' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    
    const endpoint = `${result.method} ${result.endpoint}`.padEnd(35);
    const status = `${statusIcon} ${result.status}`.padEnd(10);
    const message = result.message.substring(0, 30);
    
    console.log(`│ ${endpoint} │ ${status} │ ${message} │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────┘\n');
  
  // Sumário
  log('cyan', '📈 SUMÁRIO:');
  log('green', `   ✅ Sucesso: ${okCount}/${total} (${Math.round(okCount/total*100)}%)`);
  log('red', `   ❌ Falhas: ${failCount}/${total} (${Math.round(failCount/total*100)}%)`);
  if (skipCount > 0) {
    log('yellow', `   ⏭️  Pulados: ${skipCount}/${total}`);
  }
  
  // Tempo médio de resposta
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length
  );
  log('blue', `   ⚡ Tempo médio: ${avgResponseTime}ms\n`);
  
  // Status geral
  if (failCount === 0) {
    log('green', '🎉 TODOS OS TESTES PASSARAM!\n');
  } else {
    log('red', `⚠️  ${failCount} TESTE(S) FALHARAM\n`);
  }
}

// Executar testes
runTests().catch(error => {
  log('red', `\n❌ Erro ao executar testes: ${error.message}\n`);
  process.exit(1);
});
