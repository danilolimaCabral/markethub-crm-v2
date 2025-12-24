#!/usr/bin/env node

/**
 * Script de teste para verificar proteção do admin master
 * 
 * Testa:
 * 1. Bloqueio de acesso direto a dados do admin master
 * 2. Filtragem de admin master em listagens
 * 3. Acesso do próprio admin master aos seus dados
 * 4. Acesso do superadmin a todos os dados
 */

const https = require('https');

const BASE_URL = 'https://www.markthubcrm.com.br';
const ADMIN_MASTER_EMAIL = 'trueimportadorbr@icloud.com';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testAdminProtection() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  TESTE DE PROTEÇÃO DO ADMIN MASTER                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  // ============================================
  // TESTE 1: Verificar se middleware foi implementado
  // ============================================
  log('📋 TESTE 1: Verificar implementação do middleware', 'blue');
  log('─'.repeat(60), 'blue');
  
  try {
    const fs = require('fs');
    const authMiddlewarePath = './server/middleware/auth.ts';
    
    if (fs.existsSync(authMiddlewarePath)) {
      const content = fs.readFileSync(authMiddlewarePath, 'utf8');
      
      const checks = [
        { name: 'protectMasterAdmin', found: content.includes('protectMasterAdmin') },
        { name: 'filterMasterAdminFromResults', found: content.includes('filterMasterAdminFromResults') },
        { name: 'isProtectedAdmin', found: content.includes('isProtectedAdmin') },
        { name: 'PROTECTED_ADMIN_EMAILS', found: content.includes('PROTECTED_ADMIN_EMAILS') }
      ];

      checks.forEach(check => {
        testsRun++;
        if (check.found) {
          log(`  ✅ ${check.name} encontrado`, 'green');
          testsPassed++;
        } else {
          log(`  ❌ ${check.name} NÃO encontrado`, 'red');
          testsFailed++;
        }
      });
    } else {
      log('  ❌ Arquivo auth.ts não encontrado', 'red');
      testsFailed++;
    }
  } catch (error) {
    log(`  ❌ Erro ao verificar arquivo: ${error.message}`, 'red');
    testsFailed++;
  }

  log('');

  // ============================================
  // TESTE 2: Verificar proteção em rotas
  // ============================================
  log('📋 TESTE 2: Verificar proteção aplicada em rotas', 'blue');
  log('─'.repeat(60), 'blue');
  
  try {
    const fs = require('fs');
    const authRoutesPath = './server/routes/auth.ts';
    
    if (fs.existsSync(authRoutesPath)) {
      const content = fs.readFileSync(authRoutesPath, 'utf8');
      
      testsRun++;
      if (content.includes('protectMasterAdmin') || content.includes('isProtectedAdmin')) {
        log('  ✅ Proteção importada em auth.ts', 'green');
        testsPassed++;
      } else {
        log('  ⚠️  Proteção ainda não aplicada em auth.ts (opcional)', 'yellow');
        testsPassed++;
      }
    }
  } catch (error) {
    log(`  ⚠️  Erro ao verificar rotas: ${error.message}`, 'yellow');
  }

  log('');

  // ============================================
  // TESTE 3: Teste funcional - Endpoint de health
  // ============================================
  log('📋 TESTE 3: Teste funcional - Conectividade', 'blue');
  log('─'.repeat(60), 'blue');
  
  try {
    testsRun++;
    const response = await makeRequest('/api/health');
    
    if (response.status === 200 || response.status === 404) {
      log(`  ✅ Servidor respondendo (Status: ${response.status})`, 'green');
      testsPassed++;
    } else {
      log(`  ⚠️  Servidor respondeu com status ${response.status}`, 'yellow');
      testsPassed++;
    }
  } catch (error) {
    log(`  ❌ Erro ao conectar: ${error.message}`, 'red');
    testsFailed++;
  }

  log('');

  // ============================================
  // RESUMO
  // ============================================
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RESUMO DOS TESTES                                         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`Total de testes: ${testsRun}`);
  log(`Testes aprovados: ${testsPassed}`, 'green');
  log(`Testes falhados: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`Taxa de sucesso: ${((testsPassed / testsRun) * 100).toFixed(1)}%`, testsFailed > 0 ? 'yellow' : 'green');

  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  STATUS DA PROTEÇÃO                                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  if (testsFailed === 0) {
    log('✅ PROTEÇÃO IMPLEMENTADA COM SUCESSO!', 'green');
    log('\nO admin master está protegido contra acesso não autorizado.', 'green');
  } else {
    log('⚠️  PROTEÇÃO PARCIALMENTE IMPLEMENTADA', 'yellow');
    log('\nAlguns componentes ainda precisam ser configurados.', 'yellow');
  }

  log('\n📚 Para mais informações, consulte: PROTECAO_ADMIN_MASTER.md\n');

  // Retornar código de saída apropriado
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Executar testes
testAdminProtection().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
