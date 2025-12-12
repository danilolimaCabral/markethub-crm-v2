#!/usr/bin/env tsx
/**
 * Script de Teste 100% Autenticado com Dados Reais
 * Testa todas as APIs com autenticação e integração real com Mercado Livre
 */

import axios, { AxiosError } from 'axios';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Admin123!';

interface TestResult {
  category: string;
  endpoint: string;
  method: string;
  status: 'OK' | 'FAIL' | 'SKIP';
  statusCode?: number;
  message: string;
  responseTime?: number;
  data?: any;
}

const results: TestResult[] = [];
let authToken: string = '';
let tenantId: string = '';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(
  category: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  expectedStatus: number = 200,
  data?: any,
  headers?: any,
  description?: string
): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${endpoint}`;
  
  // Adicionar token de autenticação se disponível
  const finalHeaders = {
    ...headers,
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
  
  try {
    const response = await axios({
      method,
      url,
      data,
      headers: finalHeaders,
      validateStatus: () => true,
    });
    
    const responseTime = Date.now() - startTime;
    const success = response.status === expectedStatus;
    
    const result: TestResult = {
      category,
      endpoint,
      method,
      status: success ? 'OK' : 'FAIL',
      statusCode: response.status,
      message: success 
        ? `${description || 'Success'} (${responseTime}ms)`
        : `Expected ${expectedStatus}, got ${response.status}`,
      responseTime,
      data: response.data,
    };
    
    // Log em tempo real
    const statusIcon = success ? '✅' : '❌';
    const statusColor = success ? 'green' : 'red';
    log(statusColor, `  ${statusIcon} ${method} ${endpoint} - ${result.message}`);
    
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const err = error as AxiosError;
    
    const result: TestResult = {
      category,
      endpoint,
      method,
      status: 'FAIL',
      statusCode: err.response?.status,
      message: err.message,
      responseTime,
    };
    
    log('red', `  ❌ ${method} ${endpoint} - ${err.message}`);
    
    return result;
  }
}

async function runTests() {
  log('cyan', '\n' + '='.repeat(70));
  log('cyan', '🧪 TESTE 100% AUTENTICADO - MARKTHUB CRM V2');
  log('cyan', '='.repeat(70) + '\n');
  
  log('blue', `📍 Base URL: ${BASE_URL}`);
  log('blue', `👤 Test User: ${TEST_EMAIL}\n`);

  // ========================================
  // 1. AUTENTICAÇÃO
  // ========================================
  log('magenta', '🔐 1. AUTENTICAÇÃO E SETUP');
  
  // Criar usuário de teste (se não existir)
  const registerResult = await testEndpoint(
    'Auth',
    'POST',
    '/api/auth/register',
    201,
    {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Test Admin',
      tenantName: 'Test Tenant',
    },
    undefined,
    'Criar usuário de teste'
  );
  results.push(registerResult);
  
  // Login
  const loginResult = await testEndpoint(
    'Auth',
    'POST',
    '/api/auth/login',
    200,
    {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
    undefined,
    'Login com usuário de teste'
  );
  results.push(loginResult);
  
  if (loginResult.status === 'OK' && loginResult.data?.token) {
    authToken = loginResult.data.token;
    tenantId = loginResult.data.user?.tenantId || '';
    log('green', `  ✅ Token obtido: ${authToken.substring(0, 20)}...`);
    log('green', `  ✅ Tenant ID: ${tenantId}\n`);
  } else {
    log('red', '  ❌ Falha ao obter token. Testes autenticados serão pulados.\n');
  }
  
  // ========================================
  // 2. CLIENTES
  // ========================================
  log('magenta', '👥 2. CLIENTES (AUTENTICADO)');
  
  if (authToken) {
    results.push(await testEndpoint('Clientes', 'GET', '/api/clientes', 200, undefined, undefined, 'Listar clientes'));
    
    const createClientResult = await testEndpoint(
      'Clientes',
      'POST',
      '/api/clientes',
      201,
      {
        nome: 'Cliente Teste',
        email: 'cliente@test.com',
        telefone: '11999999999',
        cpf_cnpj: '12345678900',
      },
      undefined,
      'Criar cliente'
    );
    results.push(createClientResult);
    
    if (createClientResult.data?.id) {
      results.push(await testEndpoint('Clientes', 'GET', `/api/clientes/${createClientResult.data.id}`, 200, undefined, undefined, 'Buscar cliente criado'));
    }
  } else {
    log('yellow', '  ⏭️  Pulando testes de clientes (sem autenticação)\n');
  }
  
  // ========================================
  // 3. PRODUTOS
  // ========================================
  log('magenta', '📦 3. PRODUTOS (AUTENTICADO)');
  
  if (authToken) {
    results.push(await testEndpoint('Produtos', 'GET', '/api/produtos', 200, undefined, undefined, 'Listar produtos'));
    
    const createProductResult = await testEndpoint(
      'Produtos',
      'POST',
      '/api/produtos',
      201,
      {
        nome: 'Produto Teste',
        descricao: 'Descrição do produto teste',
        preco: 99.90,
        estoque: 100,
        sku: 'PROD-TEST-001',
      },
      undefined,
      'Criar produto'
    );
    results.push(createProductResult);
    
    if (createProductResult.data?.id) {
      results.push(await testEndpoint('Produtos', 'GET', `/api/produtos/${createProductResult.data.id}`, 200, undefined, undefined, 'Buscar produto criado'));
    }
  } else {
    log('yellow', '  ⏭️  Pulando testes de produtos (sem autenticação)\n');
  }
  
  // ========================================
  // 4. PEDIDOS
  // ========================================
  log('magenta', '🛒 4. PEDIDOS (AUTENTICADO)');
  
  if (authToken) {
    results.push(await testEndpoint('Pedidos', 'GET', '/api/pedidos', 200, undefined, undefined, 'Listar pedidos'));
  } else {
    log('yellow', '  ⏭️  Pulando testes de pedidos (sem autenticação)\n');
  }
  
  // ========================================
  // 5. MERCADO LIVRE - INTEGRAÇÃO REAL
  // ========================================
  log('magenta', '🛍️ 5. MERCADO LIVRE - INTEGRAÇÃO REAL');
  
  if (authToken) {
    // Status da integração
    const mlStatusResult = await testEndpoint(
      'Mercado Livre',
      'GET',
      '/api/mercadolivre/status',
      200,
      undefined,
      undefined,
      'Status da integração ML'
    );
    results.push(mlStatusResult);
    
    if (mlStatusResult.data?.connected) {
      log('green', '  ✅ Mercado Livre conectado!');
      log('green', `  📊 Dados: ${JSON.stringify(mlStatusResult.data, null, 2)}\n`);
      
      // Buscar pedidos do ML
      const mlOrdersResult = await testEndpoint(
        'Mercado Livre',
        'GET',
        '/api/mercadolivre/orders',
        200,
        undefined,
        undefined,
        'Buscar pedidos do ML'
      );
      results.push(mlOrdersResult);
      
      if (mlOrdersResult.data?.orders) {
        log('green', `  ✅ ${mlOrdersResult.data.orders.length} pedidos encontrados no ML`);
      }
      
      // Buscar produtos do ML
      const mlProductsResult = await testEndpoint(
        'Mercado Livre',
        'GET',
        '/api/mercadolivre/products',
        200,
        undefined,
        undefined,
        'Buscar produtos do ML'
      );
      results.push(mlProductsResult);
      
      if (mlProductsResult.data?.products) {
        log('green', `  ✅ ${mlProductsResult.data.products.length} produtos encontrados no ML\n`);
      }
    } else {
      log('yellow', '  ⚠️  Mercado Livre não conectado. Configure as credenciais.\n');
    }
  } else {
    log('yellow', '  ⏭️  Pulando testes do ML (sem autenticação)\n');
  }
  
  // ========================================
  // 6. INTELIGÊNCIA ARTIFICIAL
  // ========================================
  log('magenta', '🤖 6. INTELIGÊNCIA ARTIFICIAL');
  
  if (authToken) {
    results.push(await testEndpoint(
      'AI',
      'POST',
      '/api/ai/chat',
      200,
      { message: 'Olá, como você pode me ajudar?' },
      undefined,
      'Chat com IA'
    ));
  } else {
    log('yellow', '  ⏭️  Pulando testes de IA (sem autenticação)\n');
  }
  
  // ========================================
  // 7. TENANTS
  // ========================================
  log('magenta', '🏢 7. TENANTS (MULTI-TENANT)');
  
  if (authToken) {
    results.push(await testEndpoint('Tenants', 'GET', '/api/tenants', 200, undefined, undefined, 'Listar tenants'));
    
    if (tenantId) {
      results.push(await testEndpoint('Tenants', 'GET', `/api/tenants/${tenantId}`, 200, undefined, undefined, 'Buscar tenant atual'));
    }
  } else {
    log('yellow', '  ⏭️  Pulando testes de tenants (sem autenticação)\n');
  }
  
  // ========================================
  // 8. INTEGRAÇÕES
  // ========================================
  log('magenta', '🔌 8. INTEGRAÇÕES');
  
  if (authToken) {
    results.push(await testEndpoint('Integrations', 'GET', '/api/v1/integrations', 200, undefined, undefined, 'Listar integrações disponíveis'));
  } else {
    log('yellow', '  ⏭️  Pulando testes de integrações (sem autenticação)\n');
  }
  
  // ========================================
  // RESULTADOS
  // ========================================
  printResults();
  saveResults();
}

function printResults() {
  log('cyan', '\n' + '='.repeat(70));
  log('cyan', '📊 RESULTADOS DOS TESTES');
  log('cyan', '='.repeat(70) + '\n');
  
  const okCount = results.filter(r => r.status === 'OK').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  
  // Sumário por categoria
  const categories = [...new Set(results.map(r => r.category))];
  
  log('blue', '📈 SUMÁRIO POR CATEGORIA:\n');
  
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const categoryOk = categoryResults.filter(r => r.status === 'OK').length;
    const categoryTotal = categoryResults.length;
    const percentage = Math.round((categoryOk / categoryTotal) * 100);
    
    const color = percentage === 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
    log(color, `  ${category}: ${categoryOk}/${categoryTotal} (${percentage}%)`);
  });
  
  // Sumário geral
  log('cyan', '\n📊 SUMÁRIO GERAL:');
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
  const successRate = Math.round((okCount / total) * 100);
  if (successRate === 100) {
    log('green', '🎉 TODOS OS TESTES PASSARAM! SISTEMA 100% FUNCIONAL!\n');
  } else if (successRate >= 80) {
    log('yellow', `✅ ${successRate}% DOS TESTES PASSARAM! SISTEMA EM BOM ESTADO!\n`);
  } else {
    log('red', `⚠️  APENAS ${successRate}% DOS TESTES PASSARAM. ATENÇÃO NECESSÁRIA!\n`);
  }
}

function saveResults() {
  const reportPath = path.join(process.cwd(), 'test-results-authenticated.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log('blue', `💾 Resultados salvos em: ${reportPath}\n`);
}

// Executar testes
runTests().catch(error => {
  log('red', `\n❌ Erro ao executar testes: ${error.message}\n`);
  process.exit(1);
});
