import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log('🚀 Iniciando migrações do Markthub CRM...\n');
  
  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL não está configurada!');
    console.error('Configure a variável de ambiente DATABASE_URL antes de executar as migrations.');
    process.exit(1);
  }
  
  // Testar conexão
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida!\n');
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
    process.exit(1);
  }
  
  // Executar cada migration
  for (const migration of migrations) {
    const filePath = path.join(__dirname, '..', 'database', migration);
    
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Arquivo ${migration} não encontrado, pulando...`);
      continue;
    }
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📝 Executando ${migration}...`);
    
    try {
      await pool.query(sql);
      console.log(`✅ ${migration} executado com sucesso!\n`);
    } catch (error) {
      // Se for erro de "já existe", apenas avisa mas continua
      if (error.message.includes('already exists') || error.message.includes('já existe')) {
        console.warn(`⚠️  ${migration}: Objetos já existem, pulando...\n`);
        continue;
      }
      
      console.error(`❌ Erro ao executar ${migration}:`);
      console.error(error.message);
      console.error('\nStack trace:', error.stack);
      process.exit(1);
    }
  }
  
  console.log('🎉 Todas as migrações foram executadas com sucesso!');
  console.log('📊 Verificando tabelas criadas...\n');
  
  // Listar tabelas criadas
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('✅ Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log(`\n📊 Total: ${result.rows.length} tabelas\n`);
  } catch (error) {
    console.error('⚠️  Não foi possível listar as tabelas:', error.message);
  }
  
  await pool.end();
  console.log('✅ Migration concluída! Banco de dados pronto para uso.\n');
}

// Executar migrations
runMigrations().catch(error => {
  console.error('❌ Erro fatal durante migration:', error);
  process.exit(1);
});
