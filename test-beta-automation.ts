#!/usr/bin/env tsx
/**
 * SCRIPT DE TESTES BETA AUTOMATIZADOS
 * ====================================
 * 
 * Este script executa testes completos em todos os módulos do sistema
 * através da API REST, gerando relatório detalhado.
 */

import axios, { AxiosInstance } from 'axios';

// Configuração
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TIMEOUT = 10000;

// Cliente HTTP
let api: AxiosInstance;
let authToken: string = '';
let createdResources: any = {
  users: [],
  clientes: [],
  produtos: [],
  pedidos: [],
};

// Resultado dos testes
interface TestResult {
  module: string;
  test: string;
  status: 'PASSOU' | 'FALHOU' | 'PULADO' | 'RESSALVA';
  time: number;
  error?: string;
  details?: any;
}

const testResults: TestResult[] = [];

// Utilitários
const log = {
  info: (msg: string) => console.log('ℹ', msg),
  success: (msg: string) => console.log('✓', msg),
  error: (msg: string) => console.log('✗', msg),
  warning: (msg: string) => console.log('⚠', msg),
  section: (msg: string) => console.log('\n' + '═'.repeat(60) + '\n' + msg + '\n' + '═'.repeat(60)),
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest(module: string, test: string, fn: () => Promise<any>): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    log.info(`Testando: ${module} - ${test}`);
    const result = await fn();
    const time = Date.now() - startTime;
    
    log.success(`${test} - ${time}ms`);
    
    return {
      module,
      test,
      status: 'PASSOU',
      time,
      details: result
    };
  } catch (error: any) {
    const time = Date.now() - startTime;
    const errorMsg = error.response?.data?.error || error.message || 'Erro desconhecido';
    
    log.error(`${test} - ${errorMsg}`);
    
    return {
      module,
      test,
      status: 'FALHOU',
      time,
      error: errorMsg,
      details: error.response?.data
    };
  }
}

// ========================================
// TESTES DE AUTENTICAÇÃO
// ========================================
async function testAuth() {
  log.section('1. TESTES DE AUTENTICAÇÃO');

  // Teste 1.1: Health check
  const result1 = await runTest('Autenticação', 'Health Check API', async () => {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/health`, { timeout: TIMEOUT });
    if (response.data.status !== 'ok') throw new Error('API não está saudável');
    return response.data;
  });
  testResults.push(result1);

  // Teste 1.2: Registro de novo usuário
  const testUser = {
    email: `testebeta_${Date.now()}@markethub.com.br`,
    password: 'TesteBeta@2024!',
    full_name: 'Usuário Teste Beta',
    username: `testebeta_${Date.now()}`,
    tenant_id: '00000000-0000-0000-0000-000000000001'
  };

  const result2 = await runTest('Autenticação', 'Registro de novo usuário', async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser, { timeout: TIMEOUT });
    
    if (!response.data.accessToken) throw new Error('Token não retornado no registro');
    if (!response.data.user) throw new Error('Dados do usuário não retornados');
    
    // Salvar token e dados
    authToken = response.data.accessToken;
    createdResources.users.push(response.data.user);
    
    // Configurar token no axios
    api = axios.create({
      baseURL: API_BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  });
  testResults.push(result2);

  // Teste 1.3: Login com usuário criado
  const result3 = await runTest('Autenticação', 'Login com credenciais válidas', async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    }, { timeout: TIMEOUT });
    
    if (!response.data.accessToken) throw new Error('Token não retornado no login');
    
    // Atualizar token
    authToken = response.data.accessToken;
    api.defaults.headers['Authorization'] = `Bearer ${authToken}`;
    
    return response.data;
  });
  testResults.push(result3);

  // Teste 1.4: Obter dados do usuário autenticado
  const result4 = await runTest('Autenticação', 'GET /api/auth/me', async () => {
    const response = await api.get('/auth/me');
    if (!response.data.user) throw new Error('Dados do usuário não retornados');
    return response.data;
  });
  testResults.push(result4);

  // Teste 1.5: Login Super Admin
  const result5 = await runTest('Autenticação', 'Login Super Admin', async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'superadmin',
      password: 'SuperAdmin@2024!'
    }, { timeout: TIMEOUT });
    
    if (!response.data.accessToken) throw new Error('Token Super Admin não retornado');
    return response.data;
  });
  testResults.push(result5);
}

// ========================================
// TESTES DE CLIENTES
// ========================================
async function testClientes() {
  log.section('2. TESTES DE MÓDULO DE CLIENTES');

  // Teste 2.1: Criar cliente
  const novoCliente = {
    nome: 'João Silva Teste Beta',
    empresa: 'Empresa Teste Beta Ltda',
    email: `cliente_${Date.now()}@testebeta.com.br`,
    telefone: '(11) 98765-4321',
    plano: 'starter',
    status: 'trial'
  };

  const result1 = await runTest('Clientes', 'POST /api/clientes - Criar cliente', async () => {
    const response = await api.post('/clientes', novoCliente);
    if (!response.data.id) throw new Error('Cliente não retornou ID');
    createdResources.clientes.push(response.data);
    return response.data;
  });
  testResults.push(result1);

  // Teste 2.2: Listar clientes
  const result2 = await runTest('Clientes', 'GET /api/clientes - Listar todos', async () => {
    const response = await api.get('/clientes');
    if (!Array.isArray(response.data)) throw new Error('Resposta não é um array');
    return { count: response.data.length, data: response.data };
  });
  testResults.push(result2);

  // Teste 2.3: Buscar cliente específico
  if (createdResources.clientes.length > 0) {
    const clienteId = createdResources.clientes[0].id;
    const result3 = await runTest('Clientes', `GET /api/clientes/${clienteId}`, async () => {
      const response = await api.get(`/clientes/${clienteId}`);
      if (response.data.id !== clienteId) throw new Error('ID do cliente não corresponde');
      return response.data;
    });
    testResults.push(result3);

    // Teste 2.4: Atualizar cliente
    const result4 = await runTest('Clientes', `PUT /api/clientes/${clienteId}`, async () => {
      const response = await api.put(`/clientes/${clienteId}`, {
        telefone: '(11) 99999-9999',
        status: 'ativo'
      });
      if (response.data.telefone !== '(11) 99999-9999') throw new Error('Cliente não foi atualizado');
      return response.data;
    });
    testResults.push(result4);
  }

  // Teste 2.5: Estatísticas de clientes
  const result5 = await runTest('Clientes', 'GET /api/clientes/stats/geral', async () => {
    const response = await api.get('/clientes/stats/geral');
    if (typeof response.data.total_clientes === 'undefined') throw new Error('Estatísticas não retornadas');
    return response.data;
  });
  testResults.push(result5);
}

// ========================================
// TESTES DE PRODUTOS
// ========================================
async function testProdutos() {
  log.section('3. TESTES DE MÓDULO DE PRODUTOS');

  // Teste 3.1: Criar produto
  const novoProduto = {
    sku: `SKU-BETA-${Date.now()}`,
    nome: 'Produto Teste Beta',
    descricao: 'Produto criado durante testes beta automatizados',
    preco: 99.90,
    custo: 50.00,
    estoque: 100,
    categoria: 'teste',
    ativo: true
  };

  const result1 = await runTest('Produtos', 'POST /api/produtos - Criar produto', async () => {
    const response = await api.post('/produtos', novoProduto);
    if (!response.data.id) throw new Error('Produto não retornou ID');
    createdResources.produtos.push(response.data);
    return response.data;
  });
  testResults.push(result1);

  // Teste 3.2: Listar produtos
  const result2 = await runTest('Produtos', 'GET /api/produtos - Listar todos', async () => {
    const response = await api.get('/produtos');
    if (!Array.isArray(response.data)) throw new Error('Resposta não é um array');
    return { count: response.data.length };
  });
  testResults.push(result2);

  // Teste 3.3: Buscar produto por ID
  if (createdResources.produtos.length > 0) {
    const produtoId = createdResources.produtos[0].id;
    const result3 = await runTest('Produtos', `GET /api/produtos/${produtoId}`, async () => {
      const response = await api.get(`/produtos/${produtoId}`);
      if (response.data.id !== produtoId) throw new Error('ID do produto não corresponde');
      return response.data;
    });
    testResults.push(result3);

    // Teste 3.4: Atualizar produto
    const result4 = await runTest('Produtos', `PUT /api/produtos/${produtoId}`, async () => {
      const response = await api.put(`/produtos/${produtoId}`, {
        preco: 129.90,
        estoque: 150
      });
      return response.data;
    });
    testResults.push(result4);
  }
}

// ========================================
// TESTES DE PEDIDOS
// ========================================
async function testPedidos() {
  log.section('4. TESTES DE MÓDULO DE PEDIDOS');

  // Precisamos ter um cliente e produto criados
  if (createdResources.clientes.length === 0 || createdResources.produtos.length === 0) {
    log.warning('Pulando testes de pedidos - requer cliente e produto criados');
    testResults.push({
      module: 'Pedidos',
      test: 'Testes de pedidos',
      status: 'PULADO',
      time: 0,
      error: 'Requer cliente e produto criados anteriormente'
    });
    return;
  }

  const novoPedido = {
    cliente_id: createdResources.clientes[0].id,
    itens: [
      {
        produto_id: createdResources.produtos[0].id,
        quantidade: 2,
        preco_unitario: createdResources.produtos[0].preco
      }
    ],
    status: 'pendente',
    forma_pagamento: 'pix'
  };

  const result1 = await runTest('Pedidos', 'POST /api/pedidos - Criar pedido', async () => {
    const response = await api.post('/pedidos', novoPedido);
    if (!response.data.id) throw new Error('Pedido não retornou ID');
    createdResources.pedidos.push(response.data);
    return response.data;
  });
  testResults.push(result1);

  const result2 = await runTest('Pedidos', 'GET /api/pedidos - Listar todos', async () => {
    const response = await api.get('/pedidos');
    if (!Array.isArray(response.data)) throw new Error('Resposta não é um array');
    return { count: response.data.length };
  });
  testResults.push(result2);
}

// ========================================
// TESTES DE INTEGRAÇÕES
// ========================================
async function testIntegracoes() {
  log.section('5. TESTES DE INTEGRAÇÕES');

  // Teste 5.1: Verificar status Mercado Livre
  const result1 = await runTest('Integrações', 'GET /api/integrations/mercadolivre/status', async () => {
    const response = await api.get('/integrations/mercadolivre/status');
    return response.data;
  });
  testResults.push(result1);

  // Teste 5.2: Listar integrações disponíveis
  const result2 = await runTest('Integrações', 'GET /api/v1/integrations', async () => {
    const response = await api.get('/v1/integrations');
    return response.data;
  });
  testResults.push(result2);
}

// ========================================
// TESTES DE IA
// ========================================
async function testIA() {
  log.section('6. TESTES DE ASSISTENTE IA');

  const result1 = await runTest('IA', 'POST /api/ai/chat - Enviar mensagem', async () => {
    const response = await api.post('/ai/chat', {
      message: 'Olá! Este é um teste beta. Como você pode me ajudar?',
      context: { module: 'beta-test' }
    });
    return response.data;
  });
  testResults.push(result1);
}

// ========================================
// RELATÓRIO FINAL
// ========================================
function generateReport() {
  log.section('RELATÓRIO FINAL DE TESTES BETA');

  // Contadores
  const total = testResults.length;
  const passed = testResults.filter(t => t.status === 'PASSOU').length;
  const failed = testResults.filter(t => t.status === 'FALHOU').length;
  const skipped = testResults.filter(t => t.status === 'PULADO').length;
  const warnings = testResults.filter(t => t.status === 'RESSALVA').length;

  // Performance
  const avgTime = testResults.reduce((acc, t) => acc + t.time, 0) / total;
  const slowTests = testResults.filter(t => t.time > 3000);

  console.log('\n📊 RESUMO GERAL:');
  console.log('═'.repeat(60));
  console.log(`Total de testes:     ${total}`);
  console.log(`✓ Passaram:          ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`✗ Falharam:          ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
  console.log(`⚠ Ressalvas:         ${warnings}`);
  console.log(`⏭ Pulados:           ${skipped}`);
  
  console.log('\n⚡ PERFORMANCE:');
  console.log('═'.repeat(60));
  console.log(`Tempo médio:         ${avgTime.toFixed(0)}ms`);
  console.log(`Testes lentos (>3s): ${slowTests.length}`);

  // Detalhamento por módulo
  const byModule: Record<string, { passed: number; failed: number; total: number }> = {};
  testResults.forEach(t => {
    if (!byModule[t.module]) {
      byModule[t.module] = { passed: 0, failed: 0, total: 0 };
    }
    byModule[t.module].total++;
    if (t.status === 'PASSOU') byModule[t.module].passed++;
    if (t.status === 'FALHOU') byModule[t.module].failed++;
  });

  console.log('\n📦 POR MÓDULO:');
  console.log('═'.repeat(60));
  Object.entries(byModule).forEach(([module, stats]) => {
    const percentage = ((stats.passed / stats.total) * 100).toFixed(0);
    console.log(`${module.padEnd(20)} ${stats.passed}/${stats.total} (${percentage}%)`);
  });

  // Lista de erros
  const errors = testResults.filter(t => t.status === 'FALHOU');
  if (errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    console.log('═'.repeat(60));
    errors.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.module} - ${err.test}`);
      console.log(`   Erro: ${err.error}`);
      if (err.details) {
        console.log(`   Detalhes:`, JSON.stringify(err.details, null, 2).substring(0, 200));
      }
    });
  }

  // Testes lentos
  if (slowTests.length > 0) {
    console.log('\n⚠️  TESTES LENTOS (> 3s):');
    console.log('═'.repeat(60));
    slowTests.forEach(t => {
      console.log(`${t.module} - ${t.test}: ${t.time}ms`);
    });
  }

  // Score final
  const score = ((passed / total) * 100).toFixed(1);
  console.log('\n🏆 SCORE FINAL:');
  console.log('═'.repeat(60));
  
  let emoji = '🎉';
  if (parseFloat(score) < 70) {
    emoji = '❌';
  } else if (parseFloat(score) < 90) {
    emoji = '⚠️';
  }
  
  console.log(`${emoji} ${score}% de aprovação\n`);

  // Salvar relatório em arquivo
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      passed,
      failed,
      skipped,
      warnings,
      score: parseFloat(score),
      avgTime,
      slowTests: slowTests.length
    },
    byModule,
    tests: testResults,
    errors: errors.map(e => ({
      module: e.module,
      test: e.test,
      error: e.error,
      details: e.details
    })),
    resources: {
      users_created: createdResources.users.length,
      clientes_created: createdResources.clientes.length,
      produtos_created: createdResources.produtos.length,
      pedidos_created: createdResources.pedidos.length
    }
  };

  return reportData;
}

// ========================================
// MAIN
// ========================================
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║     🧪 TESTES BETA AUTOMATIZADOS - MARKETHUB CRM v2.1      ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  log.info(`API Base URL: ${API_BASE_URL}`);
  log.info(`Timeout: ${TIMEOUT}ms\n`);

  try {
    // Executar todos os testes
    await testAuth();
    await sleep(1000);
    
    await testClientes();
    await sleep(1000);
    
    await testProdutos();
    await sleep(1000);
    
    await testPedidos();
    await sleep(1000);
    
    await testIntegracoes();
    await sleep(1000);
    
    await testIA();
    
    // Gerar relatório
    const report = generateReport();
    
    // Salvar em arquivo JSON
    const fs = await import('fs/promises');
    await fs.writeFile(
      'BETA_TEST_RESULTS.json',
      JSON.stringify(report, null, 2)
    );
    log.success('\n📄 Relatório salvo em: BETA_TEST_RESULTS.json');
    
    // Retornar código de saída baseado no resultado
    process.exit(report.summary.failed > 0 ? 1 : 0);
    
  } catch (error: any) {
    log.error(`\n❌ Erro fatal: ${error.message}`);
    process.exit(1);
  }
}

// Executar
main();
