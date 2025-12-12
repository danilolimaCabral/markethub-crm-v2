/**
 * Script de Teste - Autenticação JWT
 * Testa todo o fluxo de autenticação do Markethub CRM V2
 */

import axios, { AxiosError } from 'axios';

// Configuração
const API_BASE_URL = process.env.API_URL || 'https://markethub-crm-v2-production.up.railway.app';
const API_URL = `${API_BASE_URL}/api`;

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Utilitários
function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logSection(title: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

// Variáveis globais para armazenar tokens e dados
let testUser = {
  email: `test_${Date.now()}@markethub.test`,
  password: 'TestPassword123!@#',
  full_name: 'Usuário de Teste JWT',
  username: `testuser_${Date.now()}`,
};

let authTokens: {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
} = {};

let userId: string;

// ========================================
// TESTES
// ========================================

/**
 * Teste 1: Health Check
 */
async function testHealthCheck() {
  logSection('TESTE 1: Health Check da API');
  
  try {
    const response = await axios.get(`${API_URL}/health`);
    
    if (response.status === 200) {
      logSuccess('Health check passou');
      logInfo(`Status: ${response.data.status}`);
      logInfo(`Database: ${response.data.database}`);
      logInfo(`Timestamp: ${response.data.timestamp}`);
      return true;
    }
  } catch (error: any) {
    logError(`Health check falhou: ${error.message}`);
    return false;
  }
}

/**
 * Teste 2: Registro de Novo Usuário
 */
async function testUserRegistration() {
  logSection('TESTE 2: Registro de Novo Usuário');
  
  try {
    logInfo(`Registrando usuário: ${testUser.email}`);
    
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: testUser.email,
      password: testUser.password,
      full_name: testUser.full_name,
      username: testUser.username,
      tenant_id: 1, // Tenant padrão para testes
    });
    
    if (response.status === 201) {
      logSuccess('Usuário registrado com sucesso');
      
      // Armazenar tokens e ID do usuário
      authTokens.accessToken = response.data.accessToken;
      authTokens.refreshToken = response.data.refreshToken;
      authTokens.expiresIn = response.data.expiresIn;
      userId = response.data.user.id;
      
      logInfo(`User ID: ${userId}`);
      logInfo(`Access Token: ${authTokens.accessToken?.substring(0, 20)}...`);
      logInfo(`Refresh Token: ${authTokens.refreshToken?.substring(0, 20)}...`);
      logInfo(`Expires In: ${authTokens.expiresIn}`);
      
      return true;
    }
  } catch (error: any) {
    if (error.response) {
      logError(`Registro falhou: ${error.response.data.error || error.message}`);
      logInfo(`Status: ${error.response.status}`);
      logInfo(`Code: ${error.response.data.code}`);
    } else {
      logError(`Erro de rede: ${error.message}`);
    }
    return false;
  }
}

/**
 * Teste 3: Login com Credenciais Válidas
 */
async function testLoginValid() {
  logSection('TESTE 3: Login com Credenciais Válidas');
  
  try {
    logInfo(`Fazendo login com: ${testUser.email}`);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    
    if (response.status === 200) {
      logSuccess('Login realizado com sucesso');
      
      // Atualizar tokens
      authTokens.accessToken = response.data.accessToken;
      authTokens.refreshToken = response.data.refreshToken;
      
      logInfo(`User: ${response.data.user.full_name}`);
      logInfo(`Role: ${response.data.user.role}`);
      logInfo(`Tenant ID: ${response.data.user.tenant_id}`);
      
      return true;
    }
  } catch (error: any) {
    if (error.response) {
      logError(`Login falhou: ${error.response.data.error || error.message}`);
    } else {
      logError(`Erro de rede: ${error.message}`);
    }
    return false;
  }
}

/**
 * Teste 4: Login com Credenciais Inválidas
 */
async function testLoginInvalid() {
  logSection('TESTE 4: Login com Credenciais Inválidas');
  
  try {
    logInfo('Tentando login com senha incorreta...');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: 'SenhaErrada123',
    });
    
    // Se chegou aqui, o teste falhou (deveria ter dado erro)
    logError('Login deveria ter falhado mas passou!');
    return false;
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      logSuccess('Login corretamente rejeitado (401)');
      logInfo(`Mensagem: ${error.response.data.error}`);
      return true;
    } else {
      logError(`Erro inesperado: ${error.message}`);
      return false;
    }
  }
}

/**
 * Teste 5: Acessar Rota Protegida com Token Válido
 */
async function testProtectedRouteValid() {
  logSection('TESTE 5: Acessar Rota Protegida com Token Válido');
  
  try {
    logInfo('Acessando /api/auth/me com token válido...');
    
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authTokens.accessToken}`,
      },
    });
    
    if (response.status === 200) {
      logSuccess('Acesso autorizado com sucesso');
      logInfo(`Email: ${response.data.user.email}`);
      logInfo(`Full Name: ${response.data.user.full_name}`);
      logInfo(`Role: ${response.data.user.role}`);
      return true;
    }
  } catch (error: any) {
    if (error.response) {
      logError(`Acesso negado: ${error.response.data.error || error.message}`);
    } else {
      logError(`Erro de rede: ${error.message}`);
    }
    return false;
  }
}

/**
 * Teste 6: Acessar Rota Protegida sem Token
 */
async function testProtectedRouteNoToken() {
  logSection('TESTE 6: Acessar Rota Protegida sem Token');
  
  try {
    logInfo('Tentando acessar /api/auth/me sem token...');
    
    const response = await axios.get(`${API_URL}/auth/me`);
    
    // Se chegou aqui, o teste falhou
    logError('Acesso deveria ter sido negado mas passou!');
    return false;
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      logSuccess('Acesso corretamente negado (401)');
      logInfo(`Mensagem: ${error.response.data.error}`);
      return true;
    } else {
      logError(`Erro inesperado: ${error.message}`);
      return false;
    }
  }
}

/**
 * Teste 7: Acessar Rota Protegida com Token Inválido
 */
async function testProtectedRouteInvalidToken() {
  logSection('TESTE 7: Acessar Rota Protegida com Token Inválido');
  
  try {
    logInfo('Tentando acessar /api/auth/me com token inválido...');
    
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: 'Bearer token_invalido_12345',
      },
    });
    
    // Se chegou aqui, o teste falhou
    logError('Acesso deveria ter sido negado mas passou!');
    return false;
  } catch (error: any) {
    if (error.response && error.response.status === 403) {
      logSuccess('Acesso corretamente negado (403)');
      logInfo(`Mensagem: ${error.response.data.error}`);
      return true;
    } else {
      logError(`Erro inesperado: ${error.message}`);
      return false;
    }
  }
}

/**
 * Teste 8: Refresh Token
 */
async function testRefreshToken() {
  logSection('TESTE 8: Renovar Access Token com Refresh Token');
  
  try {
    logInfo('Renovando access token...');
    
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: authTokens.refreshToken,
    });
    
    if (response.status === 200) {
      logSuccess('Token renovado com sucesso');
      
      // Atualizar access token
      const oldToken = authTokens.accessToken?.substring(0, 20);
      authTokens.accessToken = response.data.accessToken;
      const newToken = authTokens.accessToken?.substring(0, 20);
      
      logInfo(`Token antigo: ${oldToken}...`);
      logInfo(`Token novo: ${newToken}...`);
      logInfo(`Expires In: ${response.data.expiresIn}`);
      
      return true;
    }
  } catch (error: any) {
    if (error.response) {
      logError(`Renovação falhou: ${error.response.data.error || error.message}`);
    } else {
      logError(`Erro de rede: ${error.message}`);
    }
    return false;
  }
}

/**
 * Teste 9: Refresh Token Inválido
 */
async function testRefreshTokenInvalid() {
  logSection('TESTE 9: Tentar Renovar com Refresh Token Inválido');
  
  try {
    logInfo('Tentando renovar com refresh token inválido...');
    
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: 'refresh_token_invalido_12345',
    });
    
    // Se chegou aqui, o teste falhou
    logError('Renovação deveria ter falhado mas passou!');
    return false;
  } catch (error: any) {
    if (error.response && error.response.status === 403) {
      logSuccess('Renovação corretamente rejeitada (403)');
      logInfo(`Mensagem: ${error.response.data.error}`);
      return true;
    } else {
      logError(`Erro inesperado: ${error.message}`);
      return false;
    }
  }
}

/**
 * Teste 10: Logout
 */
async function testLogout() {
  logSection('TESTE 10: Logout');
  
  try {
    logInfo('Fazendo logout...');
    
    const response = await axios.post(
      `${API_URL}/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authTokens.accessToken}`,
        },
      }
    );
    
    if (response.status === 200) {
      logSuccess('Logout realizado com sucesso');
      logInfo(`Mensagem: ${response.data.message}`);
      return true;
    }
  } catch (error: any) {
    if (error.response) {
      logError(`Logout falhou: ${error.response.data.error || error.message}`);
    } else {
      logError(`Erro de rede: ${error.message}`);
    }
    return false;
  }
}

// ========================================
// EXECUÇÃO DOS TESTES
// ========================================

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║     TESTES DE AUTENTICAÇÃO JWT - MARKETHUB CRM V2          ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);
  
  logInfo(`API Base URL: ${API_BASE_URL}`);
  logInfo(`Timestamp: ${new Date().toISOString()}\n`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Registro de Usuário', fn: testUserRegistration },
    { name: 'Login Válido', fn: testLoginValid },
    { name: 'Login Inválido', fn: testLoginInvalid },
    { name: 'Rota Protegida com Token', fn: testProtectedRouteValid },
    { name: 'Rota Protegida sem Token', fn: testProtectedRouteNoToken },
    { name: 'Rota Protegida Token Inválido', fn: testProtectedRouteInvalidToken },
    { name: 'Refresh Token', fn: testRefreshToken },
    { name: 'Refresh Token Inválido', fn: testRefreshTokenInvalid },
    { name: 'Logout', fn: testLogout },
  ];
  
  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Resumo final
  logSection('RESUMO DOS TESTES');
  log(`Total de testes: ${results.total}`, colors.cyan);
  logSuccess(`Testes passados: ${results.passed}`);
  
  if (results.failed > 0) {
    logError(`Testes falhados: ${results.failed}`);
  } else {
    logSuccess('Todos os testes passaram! 🎉');
  }
  
  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  log(`\nTaxa de sucesso: ${successRate}%`, colors.cyan);
  
  // Informações do usuário de teste
  logSection('INFORMAÇÕES DO USUÁRIO DE TESTE');
  logInfo(`Email: ${testUser.email}`);
  logInfo(`Password: ${testUser.password}`);
  logInfo(`User ID: ${userId}`);
  logWarning('⚠️  Estes dados podem ser usados para testes manuais adicionais');
  
  log('\n');
}

// Executar testes
runAllTests().catch((error) => {
  logError(`Erro fatal ao executar testes: ${error.message}`);
  process.exit(1);
});
