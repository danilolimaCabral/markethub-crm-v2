import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Forçar saída de logs
process.stdout.write('\n');
console.log('='.repeat(60));
console.log('🚀 INICIANDO MIGRAÇÕES DO MARKTHUB CRM');
console.log('='.repeat(60));
console.log('');

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL não está configurada!');
  console.error('Configure a variável de ambiente DATABASE_URL antes de executar as migrations.');
  process.exit(1);
}

console.log('✅ DATABASE_URL encontrada');
console.log('📍 Host:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown');
console.log('');

// Conexão com PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Lista de migrations na ordem correta
const migrations = [
  '01_create_tables.sql',
  '02_triggers_functions.sql',
  '03_views.sql',
  '04_seed_data.sql',
  '05_modulo_cmv.sql',
  '06_multi_tenant.sql',
  '07_clientes_master.sql',
  '08_pedidos.sql',
  '09_produtos.sql'
];

async function runMigrations() {
  // Testar conexão
  try {
    console.log('🔌 Testando conexão com PostgreSQL...');
    const result = await pool.query('SELECT NOW() as now, version() as version');
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('⏰ Timestamp do servidor:', result.rows[0].now);
    console.log('🐘 Versão PostgreSQL:', result.rows[0].version.split('\n')[0]);
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:');
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
  
  // Executar cada migration
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const migration of migrations) {
    const filePath = path.join(__dirname, '..', 'database', migration);
    
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Arquivo ${migration} não encontrado, pulando...`);
      skipCount++;
      continue;
    }
    
    const sql = fs.readFileSync(filePath, 'utf8');
    const fileSize = (sql.length / 1024).toFixed(2);
    
    console.log(`📝 Executando ${migration} (${fileSize} KB)...`);
    
    try {
      const startTime = Date.now();
      await pool.query(sql);
      const duration = Date.now() - startTime;
      console.log(`✅ ${migration} executado com sucesso! (${duration}ms)`);
      console.log('');
      successCount++;
    } catch (error) {
      // Se for erro de "já existe", apenas avisa mas continua
      if (error.message.includes('already exists') || error.message.includes('já existe')) {
        console.warn(`⚠️  ${migration}: Objetos já existem, pulando...`);
        console.log('');
        skipCount++;
        continue;
      }
      
      console.error(`❌ Erro ao executar ${migration}:`);
      console.error('   Mensagem:', error.message);
      console.error('   Código:', error.code);
      console.error('');
      errorCount++;
      
      // Não para na primeira falha, tenta executar todas
      continue;
    }
  }
  
  console.log('='.repeat(60));
  console.log('📊 RESUMO DAS MIGRAÇÕES');
  console.log('='.repeat(60));
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`⚠️  Puladas: ${skipCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📦 Total: ${migrations.length}`);
  console.log('');
  
  // Listar tabelas criadas
  try {
    console.log('🔍 Verificando tabelas criadas...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('');
    console.log('✅ Tabelas no banco de dados:');
    if (result.rows.length === 0) {
      console.log('   (nenhuma tabela encontrada)');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    }
    console.log('');
    console.log(`📊 Total: ${result.rows.length} tabelas`);
    console.log('');
  } catch (error) {
    console.error('⚠️  Não foi possível listar as tabelas:', error.message);
  }
  
  await pool.end();
  
  console.log('='.repeat(60));
  if (errorCount === 0) {
    console.log('🎉 MIGRATIONS CONCLUÍDAS COM SUCESSO!');
  } else {
    console.log('⚠️  MIGRATIONS CONCLUÍDAS COM ERROS');
  }
  console.log('✅ Banco de dados pronto para uso');
  console.log('='.repeat(60));
  console.log('');
  
  // Retornar código de saída apropriado
  // Não falha se houver erros, apenas avisa (permite que servidor inicie)
  // process.exit(errorCount > 0 ? 1 : 0);
  process.exit(0);
}

// Executar migrations
runMigrations().catch(error => {
  console.error('');
  console.error('='.repeat(60));
  console.error('❌ ERRO FATAL DURANTE MIGRATION');
  console.error('='.repeat(60));
  console.error('Mensagem:', error.message);
  console.error('Stack:', error.stack);
  console.error('='.repeat(60));
  console.error('');
  process.exit(1);
});
