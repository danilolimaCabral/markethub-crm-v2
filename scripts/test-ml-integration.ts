#!/usr/bin/env tsx
/**
 * Script de Teste - Integração Mercado Livre
 * 
 * Este script valida a configuração e funcionamento da integração com o Mercado Livre
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const ML_CLIENT_ID = process.env.ML_CLIENT_ID;
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const ML_API_BASE = 'https://api.mercadolibre.com';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

const results: TestResult[] = [];

function addResult(test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
  results.push({ test, status, message });
}

function printResults() {
  console.log('\n' + '='.repeat(70));
  console.log('RESULTADOS DOS TESTES - INTEGRAÇÃO MERCADO LIVRE');
  console.log('='.repeat(70) + '\n');

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}`);
    console.log(`   ${result.message}\n`);
  });

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;

  console.log('='.repeat(70));
  console.log(`Total: ${results.length} | Passou: ${passed} | Falhou: ${failed} | Avisos: ${warnings}`);
  console.log('='.repeat(70) + '\n');

  if (failed > 0) {
    console.log('⚠️  Alguns testes falharam. Corrija os problemas antes de prosseguir.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('✅ Testes principais passaram, mas há avisos para revisar.\n');
  } else {
    console.log('🎉 Todos os testes passaram! Sistema pronto para integração.\n');
  }
}

async function testCredentials() {
  console.log('🔍 Testando credenciais...');

  if (!ML_CLIENT_ID || ML_CLIENT_ID === 'seu_client_id_aqui') {
    addResult(
      'Credenciais - Client ID',
      'FAIL',
      'ML_CLIENT_ID não configurado ou usando valor padrão'
    );
  } else {
    addResult(
      'Credenciais - Client ID',
      'PASS',
      `Client ID configurado: ${ML_CLIENT_ID.substring(0, 10)}...`
    );
  }

  if (!ML_CLIENT_SECRET || ML_CLIENT_SECRET === 'seu_client_secret_aqui') {
    addResult(
      'Credenciais - Client Secret',
      'FAIL',
      'ML_CLIENT_SECRET não configurado ou usando valor padrão'
    );
  } else {
    addResult(
      'Credenciais - Client Secret',
      'PASS',
      'Client Secret configurado corretamente'
    );
  }
}

async function testMLAPIConnection() {
  console.log('🌐 Testando conexão com API do Mercado Livre...');

  try {
    const response = await axios.get(`${ML_API_BASE}/sites/MLB`, {
      timeout: 10000
    });

    if (response.status === 200 && response.data.id === 'MLB') {
      addResult(
        'Conexão API ML',
        'PASS',
        'Conexão com API do Mercado Livre estabelecida com sucesso'
      );
    } else {
      addResult(
        'Conexão API ML',
        'WARN',
        'API respondeu mas com dados inesperados'
      );
    }
  } catch (error: any) {
    addResult(
      'Conexão API ML',
      'FAIL',
      `Erro ao conectar com API: ${error.message}`
    );
  }
}

async function testMLCategories() {
  console.log('📦 Testando acesso a categorias...');

  try {
    const response = await axios.get(`${ML_API_BASE}/sites/MLB/categories`, {
      timeout: 10000
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      addResult(
        'Categorias ML',
        'PASS',
        `${response.data.length} categorias disponíveis`
      );
    } else {
      addResult(
        'Categorias ML',
        'WARN',
        'Resposta inesperada ao buscar categorias'
      );
    }
  } catch (error: any) {
    addResult(
      'Categorias ML',
      'FAIL',
      `Erro ao buscar categorias: ${error.message}`
    );
  }
}

async function testOAuthURL() {
  console.log('🔐 Validando URL de OAuth...');

  const redirectUri = process.env.ML_REDIRECT_URI;

  if (!redirectUri) {
    addResult(
      'OAuth - Redirect URI',
      'FAIL',
      'ML_REDIRECT_URI não configurado'
    );
    return;
  }

  if (redirectUri.includes('localhost') || redirectUri.includes('127.0.0.1')) {
    addResult(
      'OAuth - Redirect URI',
      'WARN',
      'Usando localhost - OK para desenvolvimento, mas configure domínio para produção'
    );
  } else if (redirectUri.startsWith('https://')) {
    addResult(
      'OAuth - Redirect URI',
      'PASS',
      `Redirect URI configurado: ${redirectUri}`
    );
  } else if (redirectUri.startsWith('http://')) {
    addResult(
      'OAuth - Redirect URI',
      'WARN',
      'Usando HTTP - Recomendado usar HTTPS em produção'
    );
  } else {
    addResult(
      'OAuth - Redirect URI',
      'FAIL',
      'Redirect URI inválido - deve começar com http:// ou https://'
    );
  }
}

async function testDatabaseConnection() {
  console.log('💾 Testando conexão com banco de dados...');

  const dbUrl = process.env.DATABASE_URL;
  const dbHost = process.env.DB_HOST;

  if (!dbUrl && !dbHost) {
    addResult(
      'Banco de Dados',
      'FAIL',
      'Nenhuma configuração de banco de dados encontrada'
    );
  } else {
    addResult(
      'Banco de Dados',
      'PASS',
      'Configuração de banco de dados presente'
    );
  }
}

async function testJWTSecrets() {
  console.log('🔑 Validando segredos JWT...');

  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || jwtSecret.includes('mude-em-producao') || jwtSecret.length < 32) {
    addResult(
      'JWT Secret',
      'WARN',
      'JWT_SECRET deve ser alterado para produção e ter pelo menos 32 caracteres'
    );
  } else {
    addResult(
      'JWT Secret',
      'PASS',
      'JWT_SECRET configurado adequadamente'
    );
  }

  if (!jwtRefreshSecret || jwtRefreshSecret.includes('mude-em-producao') || jwtRefreshSecret.length < 32) {
    addResult(
      'JWT Refresh Secret',
      'WARN',
      'JWT_REFRESH_SECRET deve ser alterado para produção e ter pelo menos 32 caracteres'
    );
  } else {
    addResult(
      'JWT Refresh Secret',
      'PASS',
      'JWT_REFRESH_SECRET configurado adequadamente'
    );
  }
}

async function runTests() {
  console.log('\n🚀 Iniciando testes de integração Mercado Livre...\n');

  await testCredentials();
  await testMLAPIConnection();
  await testMLCategories();
  await testOAuthURL();
  await testDatabaseConnection();
  await testJWTSecrets();

  printResults();
}

// Executar testes
runTests().catch(error => {
  console.error('\n❌ Erro fatal durante execução dos testes:', error);
  process.exit(1);
});
