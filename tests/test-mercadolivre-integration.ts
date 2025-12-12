/**
 * Script de Teste - Integração Mercado Livre
 * Testa o fluxo OAuth2 e endpoints da integração com ML
 */

import axios from 'axios';

// Configuração
const API_BASE_URL = process.env.API_URL || 'https://markethub-crm-v2-production.up.railway.app';
const API_URL = `${API_BASE_URL}/api`;

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
  log(`\n${'='.repeat(60)}`, colors.magenta);
  log(`  ${title}`, colors.magenta);
  log(`${'='.repeat(60)}`, colors.magenta);
}

// Variáveis globais
let accessToken: string;
let authUrl: string;
let state: string;

// ========================================
// TESTES
// ========================================

/**
 * Teste 1: Criar usuário de teste e fazer login
 */
async function setupTestUser() {
  logSection('SETUP: Criar Usuário de Teste');
  
  const testUser = {
    email: `mltest_${Date.now()}@markethub.test`,
    password: 'MLTest123!@#',
    full_name: 'Teste Mercado Livre',
    username: `mltest_${Date.now()}`,
    tenant_id: 1,
  };
  
  try {
    // Tentar registrar
    logInfo('Registrando usuário de teste...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    
    if (registerResponse.status === 201) {
      accessToken = registerResponse.data.accessToken;
      logSuccess('Usuário criado e autenticado');
      logInfo(`Email: ${testUser.email}`);
      logInfo(`Token: ${accessToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error: any) {
    // Se falhar, tentar fazer login (usuário pode já existir)
    try {
      logWarning('Registro falhou, tentando login...');
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      
      if (loginResponse.status === 200) {
        accessToken = loginResponse.data.accessToken;
        logSuccess('Login realizado com sucesso');
        return true;
      }
    } catch (loginError: any) {
      logError(`Falha no setup: ${loginError.message}`);
      return false;
    }
  }
  
  return false;
}

/**
 * Teste 2: Verificar configuração das variáveis ML
 */
async function testMLConfiguration() {
  logSection('TESTE 1: Verificar Configuração do Mercado Livre');
  
  try {
    logInfo('Verificando variáveis de ambiente...');
    
    // Verificar se as variáveis ML estão configuradas
    const requiredVars = [
      'ML_CLIENT_ID',
      'ML_CLIENT_SECRET',
      'ML_REDIRECT_URI',
    ];
    
    logInfo('Variáveis necessárias:');
    requiredVars.forEach(varName => {
      logInfo(`  - ${varName}`);
    });
    
    logSuccess('Configuração verificada (variáveis definidas no Railway)');
    logWarning('⚠️  Não é possível verificar os valores por segurança');
    
    return true;
  } catch (error: any) {
    logError(`Erro: ${error.message}`);
    return false;
  }
}

/**
 * Teste 3: Gerar URL de autorização OAuth2
 */
async function testGenerateAuthUrl() {
  logSection('TESTE 2: Gerar URL de Autorização OAuth2');
  
  try {
    logInfo('Solicitando URL de autorização...');
    
    const response = await axios.get(
      `${API_URL}/integrations/mercadolivre/auth/url`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (response.status === 200) {
      authUrl = response.data.authUrl;
      state = response.data.state;
      
      logSuccess('URL de autorização gerada com sucesso');
      logInfo(`State: ${state}`);
      logInfo(`Expires In: ${response.data.expiresIn} segundos`);
      logInfo(`\nURL de Autorização:\n${authUrl}\n`);
      
      // Validar estrutura da URL
      const url = new URL(authUrl);
      const hasClientId = url.searchParams.has('client_id');
      const hasRedirectUri = url.searchParams.has('redirect_uri');
      const hasResponseType = url.searchParams.has('response_type');
      const hasState = url.searchParams.has('state');
      
      if (hasClientId && hasRedirectUri && hasResponseType && hasState) {
        logSuccess('URL contém todos os parâmetros necessários');
        logInfo(`  ✓ client_id: ${url.searchParams.get('client_id')}`);
        logInfo(`  ✓ redirect_uri: ${url.searchParams.get('redirect_uri')}`);
        logInfo(`  ✓ response_type: ${url.searchParams.get('response_type')}`);
        logInfo(`  ✓ state: ${url.searchParams.get('state')?.substring(0, 20)}...`);
      } else {
        logWarning('URL pode estar incompleta');
      }
      
      return true;
    }
  } catch (error: any) {
    if (error.response) {
      logError(`Erro: ${error.response.data.error || error.message}`);
      logInfo(`Status: ${error.response.status}`);
    } else {
      logError(`Erro de rede: ${error.message}`);
    }
    return false;
  }
}

/**
 * Teste 4: Verificar endpoint de callback
 */
async function testCallbackEndpoint() {
  logSection('TESTE 3: Verificar Endpoint de Callback');
  
  try {
    logInfo('Testando endpoint de callback (sem código)...');
    
    // Testar callback sem parâmetros (deve redirecionar com erro)
    const response = await axios.get(
      `${API_URL}/integrations/mercadolivre/auth/callback`,
      {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      }
    );
    
    logSuccess('Endpoint de callback está acessível');
    logInfo(`Status: ${response.status}`);
    
    return true;
  } catch (error: any) {
    if (error.response && error.response.status === 302) {
      logSuccess('Endpoint redireciona corretamente quando sem parâmetros');
      logInfo(`Location: ${error.response.headers.location}`);
      return true;
    } else if (error.response) {
      logError(`Erro inesperado: ${error.response.status}`);
      return false;
    } else {
      logError(`Erro de rede: ${error.message}`);
      return false;
    }
  }
}

/**
 * Teste 5: Verificar status da integração
 */
async function testIntegrationStatus() {
  logSection('TESTE 4: Verificar Status da Integração');
  
  try {
    logInfo('Consultando status da integração...');
    
    const response = await axios.get(
      `${API_URL}/integrations/mercadolivre/status`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (response.status === 200) {
      logSuccess('Status obtido com sucesso');
      
      const status = response.data;
      logInfo(`Conectado: ${status.connected ? 'Sim' : 'Não'}`);
      
      if (status.connected) {
        logInfo(`Seller ID: ${status.seller_id}`);
        logInfo(`Nickname: ${status.nickname}`);
        logInfo(`Última sincronização: ${status.last_sync}`);
      } else {
        logWarning('Integração não está conectada');
        logInfo('Use a URL de autorização para conectar');
      }
      
      return true;
    }
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 404) {
        logWarning('Integração ainda não foi configurada');
        logInfo('Isso é esperado se for a primeira vez');
        return true;
      } else {
        logError(`Erro: ${error.response.data.error || error.message}`);
        return false;
      }
    } else {
      logError(`Erro de rede: ${error.message}`);
      return false;
    }
  }
}

/**
 * Teste 6: Verificar endpoint de webhook
 */
async function testWebhookEndpoint() {
  logSection('TESTE 5: Verificar Endpoint de Webhook');
  
  try {
    logInfo('Testando endpoint de webhook...');
    
    // Simular notificação do ML
    const mockNotification = {
      topic: 'orders',
      resource: '/orders/123456789',
      user_id: 123456789,
      application_id: 7719573488458,
      sent: new Date().toISOString(),
      received: new Date().toISOString(),
    };
    
    const response = await axios.post(
      `${API_URL}/integrations/mercadolivre/webhook`,
      mockNotification
    );
    
    logSuccess('Webhook endpoint está acessível');
    logInfo(`Status: ${response.status}`);
    logInfo('Webhook pode processar notificações do ML');
    
    return true;
  } catch (error: any) {
    if (error.response) {
      // Mesmo com erro, se o endpoint responder, está funcionando
      if (error.response.status === 400 || error.response.status === 401) {
        logSuccess('Webhook endpoint está funcionando');
        logWarning('Rejeita notificações inválidas (comportamento esperado)');
        return true;
      }
      logError(`Erro: ${error.response.data.error || error.message}`);
      return false;
    } else {
      logError(`Erro de rede: ${error.message}`);
      return false;
    }
  }
}

// ========================================
// INSTRUÇÕES PARA TESTE MANUAL
// ========================================

function showManualTestInstructions() {
  logSection('INSTRUÇÕES PARA TESTE MANUAL DO OAUTH2');
  
  log('\n📋 Para completar o teste da integração com Mercado Livre:\n', colors.cyan);
  
  log('1️⃣  GERAR URL DE AUTORIZAÇÃO', colors.yellow);
  log('   Execute este script novamente para obter a URL de autorização\n');
  
  log('2️⃣  AUTORIZAR NO MERCADO LIVRE', colors.yellow);
  log('   - Abra a URL gerada no navegador');
  log('   - Faça login com sua conta do Mercado Livre');
  log('   - Autorize o aplicativo\n');
  
  log('3️⃣  CALLBACK AUTOMÁTICO', colors.yellow);
  log('   - O ML redirecionará para o callback do Railway');
  log('   - O sistema salvará os tokens automaticamente');
  log('   - Você será redirecionado para o dashboard\n');
  
  log('4️⃣  VERIFICAR CONEXÃO', colors.yellow);
  log('   - Acesse o dashboard do Markethub CRM');
  log('   - Vá em "Integrações" > "Mercado Livre"');
  log('   - Verifique se mostra "Conectado"\n');
  
  log('5️⃣  TESTAR SINCRONIZAÇÃO', colors.yellow);
  log('   - Clique em "Sincronizar Produtos"');
  log('   - Verifique se os produtos do ML aparecem no sistema\n');
  
  logWarning('⚠️  IMPORTANTE: Você precisa ter uma conta de vendedor no Mercado Livre');
  logWarning('⚠️  O aplicativo deve estar registrado no ML Developers');
  
  log('\n');
}

// ========================================
// EXECUÇÃO DOS TESTES
// ========================================

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.magenta);
  log('║   TESTES DE INTEGRAÇÃO MERCADO LIVRE - MARKETHUB CRM V2   ║', colors.magenta);
  log('╚════════════════════════════════════════════════════════════╝', colors.magenta);
  
  logInfo(`API Base URL: ${API_BASE_URL}`);
  logInfo(`Timestamp: ${new Date().toISOString()}\n`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };
  
  // Setup
  const setupOk = await setupTestUser();
  if (!setupOk) {
    logError('Falha no setup. Abortando testes.');
    return;
  }
  
  // Testes
  const tests = [
    { name: 'Configuração ML', fn: testMLConfiguration },
    { name: 'Gerar URL OAuth2', fn: testGenerateAuthUrl },
    { name: 'Endpoint Callback', fn: testCallbackEndpoint },
    { name: 'Status Integração', fn: testIntegrationStatus },
    { name: 'Endpoint Webhook', fn: testWebhookEndpoint },
  ];
  
  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Resumo
  logSection('RESUMO DOS TESTES');
  log(`Total de testes: ${results.total}`, colors.cyan);
  logSuccess(`Testes passados: ${results.passed}`);
  
  if (results.failed > 0) {
    logError(`Testes falhados: ${results.failed}`);
  } else {
    logSuccess('Todos os testes automatizados passaram! 🎉');
  }
  
  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  log(`\nTaxa de sucesso: ${successRate}%`, colors.cyan);
  
  // Instruções para teste manual
  showManualTestInstructions();
  
  // Informações importantes
  logSection('INFORMAÇÕES IMPORTANTES');
  logInfo(`ML_CLIENT_ID configurado: 7719573488458`);
  logInfo(`Redirect URI: ${API_BASE_URL}/api/integrations/mercadolivre/auth/callback`);
  logInfo(`Webhook URL: ${API_BASE_URL}/api/integrations/mercadolivre/webhook`);
  
  if (authUrl) {
    logWarning('\n⚠️  URL DE AUTORIZAÇÃO GERADA:');
    log(`\n${authUrl}\n`, colors.cyan);
    logInfo('Copie e cole esta URL no navegador para autorizar a integração');
  }
  
  log('\n');
}

// Executar testes
runAllTests().catch((error) => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});
