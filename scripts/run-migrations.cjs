/**
 * Script para executar migrations do PostgreSQL
 * Usa a variável DATABASE_URL do ambiente
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Lista de arquivos SQL em ordem
const SQL_FILES = [
  '01_create_tables.sql',
  '02_triggers_functions.sql',
  '03_views.sql',
  '04_seed_data.sql',
  '05_modulo_cmv.sql',
  '06_multi_tenant.sql',
  '07_clientes_master.sql',
  '08_pedidos.sql',
  '09_produtos.sql',
];

async function runMigrations() {
  log('\n🚀 Iniciando execução das migrations...', colors.cyan);
  log(`📊 Banco de dados: ${process.env.DATABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO'}`, colors.blue);
  
  if (!process.env.DATABASE_URL) {
    log('\n❌ ERRO: DATABASE_URL não está configurada!', colors.red);
    process.exit(1);
  }
  
  // Criar cliente PostgreSQL
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Railway usa SSL
    },
  });
  
  try {
    // Conectar ao banco
    log('\n🔌 Conectando ao banco de dados...', colors.blue);
    await client.connect();
    log('✅ Conectado com sucesso!', colors.green);
    
    const databaseDir = path.join(__dirname, '..', 'database');
    let successCount = 0;
    let failCount = 0;
    
    // Executar cada arquivo SQL
    for (const sqlFile of SQL_FILES) {
      const filePath = path.join(databaseDir, sqlFile);
      
      log(`\n📝 Executando: ${sqlFile}`, colors.yellow);
      
      try {
        // Verificar se arquivo existe
        if (!fs.existsSync(filePath)) {
          log(`⚠️  Arquivo não encontrado: ${filePath}`, colors.yellow);
          failCount++;
          continue;
        }
        
        // Ler conteúdo do arquivo
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Executar SQL
        await client.query(sqlContent);
        
        log(`✅ ${sqlFile} executado com sucesso!`, colors.green);
        successCount++;
      } catch (error) {
        log(`❌ Erro ao executar ${sqlFile}:`, colors.red);
        log(`   ${error.message}`, colors.red);
        failCount++;
        
        // Continuar com próximo arquivo mesmo se houver erro
        log('⚠️  Continuando com próximo arquivo...', colors.yellow);
      }
    }
    
    // Resumo final
    log('\n' + '='.repeat(60), colors.cyan);
    log('📊 Resumo da Execução:', colors.cyan);
    log(`   Total de arquivos: ${SQL_FILES.length}`, colors.blue);
    log(`   Executados com sucesso: ${successCount}`, colors.green);
    log(`   Falhas: ${failCount}`, colors.red);
    log('='.repeat(60), colors.cyan);
    
    if (successCount === SQL_FILES.length) {
      log('\n🎉 Todas as migrations foram executadas com sucesso!', colors.green);
      process.exit(0);
    } else if (successCount > 0) {
      log('\n⚠️  Algumas migrations falharam, mas outras foram executadas.', colors.yellow);
      process.exit(0); // Não falhar completamente se algumas passaram
    } else {
      log('\n❌ Todas as migrations falharam!', colors.red);
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Erro fatal: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    // Desconectar
    await client.end();
    log('\n🔌 Desconectado do banco de dados.', colors.blue);
  }
}

// Executar
runMigrations();
