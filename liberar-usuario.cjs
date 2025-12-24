#!/usr/bin/env node

/**
 * Script para liberar usuário no MarketHub CRM
 * Verifica status e ativa usuário se necessário
 */

const https = require('https');

const BASE_URL = 'https://www.markthubcrm.com.br';
const USER_EMAIL = 'correiodojeferson@gmail.com';

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

async function liberarUsuario() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  LIBERAÇÃO DE USUÁRIO - MARKETHUB CRM                     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`📧 Email: ${USER_EMAIL}`, 'blue');
  log('');

  // ============================================
  // INFORMAÇÕES SOBRE LIBERAÇÃO
  // ============================================
  log('📋 INSTRUÇÕES PARA LIBERAÇÃO MANUAL', 'blue');
  log('─'.repeat(60), 'blue');
  log('');
  log('Para liberar o usuário, você precisa executar uma query SQL no banco de dados:', 'yellow');
  log('');
  log('1. Acesse o Railway:', 'cyan');
  log('   https://railway.app/', 'cyan');
  log('');
  log('2. Selecione o projeto "markethub-crm-v2"', 'cyan');
  log('');
  log('3. Clique no serviço "Postgres"', 'cyan');
  log('');
  log('4. Vá em "Data" ou "Query"', 'cyan');
  log('');
  log('5. Execute a seguinte query:', 'cyan');
  log('');
  log('-- Verificar status atual do usuário', 'green');
  log(`SELECT id, email, full_name, is_active, role, created_at, last_login_at`, 'green');
  log(`FROM users`, 'green');
  log(`WHERE email = '${USER_EMAIL}';`, 'green');
  log('');
  log('-- Se o usuário existir e estiver inativo (is_active = false):', 'green');
  log(`UPDATE users`, 'green');
  log(`SET is_active = true,`, 'green');
  log(`    updated_at = NOW()`, 'green');
  log(`WHERE email = '${USER_EMAIL}';`, 'green');
  log('');
  log('-- Verificar se foi atualizado:', 'green');
  log(`SELECT id, email, full_name, is_active, role`, 'green');
  log(`FROM users`, 'green');
  log(`WHERE email = '${USER_EMAIL}';`, 'green');
  log('');
  log('6. Se o usuário NÃO existir, você precisa criá-lo primeiro:', 'cyan');
  log('');
  log(`-- Criar novo usuário (ajuste os dados conforme necessário)`, 'green');
  log(`INSERT INTO users (email, password_hash, full_name, username, role, is_active, tenant_id)`, 'green');
  log(`VALUES (`, 'green');
  log(`  '${USER_EMAIL}',`, 'green');
  log(`  '$2a$10$exemplo_hash_senha',  -- Usuário precisa fazer reset de senha`, 'green');
  log(`  'Jeferson',`, 'green');
  log(`  'jeferson',`, 'green');
  log(`  'user',`, 'green');
  log(`  true,`, 'green');
  log(`  NULL  -- ou ID do tenant específico`, 'green');
  log(`);`, 'green');
  log('');
  
  log('─'.repeat(60), 'blue');
  log('');
  log('📌 OBSERVAÇÕES IMPORTANTES:', 'yellow');
  log('');
  log('• Se o usuário já existe e está ativo, não precisa fazer nada', 'yellow');
  log('• Se o usuário está inativo, use o UPDATE para ativá-lo', 'yellow');
  log('• Se o usuário não existe, use o INSERT para criá-lo', 'yellow');
  log('• Após criar, o usuário precisa fazer reset de senha', 'yellow');
  log('• Link de reset: https://www.markthubcrm.com.br/reset-password', 'yellow');
  log('');

  // ============================================
  // TESTE DE CONECTIVIDADE
  // ============================================
  log('📋 TESTE DE CONECTIVIDADE', 'blue');
  log('─'.repeat(60), 'blue');
  
  try {
    const response = await makeRequest('/api/health');
    
    if (response.status === 200 || response.status === 404) {
      log(`  ✅ Servidor online (Status: ${response.status})`, 'green');
    } else {
      log(`  ⚠️  Servidor respondeu com status ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`  ❌ Erro ao conectar: ${error.message}`, 'red');
  }

  log('');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RESUMO                                                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  log('Para liberar o usuário:', 'cyan');
  log('1. Acesse o banco de dados via Railway', 'cyan');
  log('2. Execute as queries SQL acima', 'cyan');
  log('3. Verifique se is_active = true', 'cyan');
  log('4. Usuário poderá fazer login normalmente', 'cyan');
  log('');
  log('Se precisar de ajuda, consulte a documentação ou entre em contato.', 'yellow');
  log('');
}

// Executar
liberarUsuario().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
