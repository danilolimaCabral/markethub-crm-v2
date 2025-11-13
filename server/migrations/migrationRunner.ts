import { query } from '../db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  id: number;
  name: string;
  executed_at: Date | null;
}

/**
 * Tabela de controle de migrações
 */
const createMigrationsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

/**
 * Listar migrações executadas
 */
export const getExecutedMigrations = async (): Promise<Migration[]> => {
  await createMigrationsTable();
  const result = await query('SELECT * FROM migrations ORDER BY id ASC');
  return result.rows;
};

/**
 * Registrar migração executada
 */
export const markMigrationAsExecuted = async (name: string) => {
  await query(
    'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
    [name]
  );
};

/**
 * Executar migração SQL
 */
export const runMigration = async (name: string, sql: string) => {
  try {
    console.log(`🔄 Executando migração: ${name}`);
    
    // Executar SQL
    await query(sql);
    
    // Registrar migração
    await markMigrationAsExecuted(name);
    
    console.log(`✅ Migração ${name} executada com sucesso`);
  } catch (error: any) {
    console.error(`❌ Erro ao executar migração ${name}:`, error.message);
    throw error;
  }
};

/**
 * Executar todas as migrações pendentes
 */
export const runAllMigrations = async () => {
  try {
    console.log('\n============================================================');
    console.log('🚀 EXECUTANDO MIGRAÇÕES AUTOMÁTICAS');
    console.log('============================================================\n');

    await createMigrationsTable();
    
    const executed = await getExecutedMigrations();
    const executedNames = new Set(executed.map(m => m.name));

    // Lista de migrações na ordem correta
    const migrations = [
      '01_create_tables',
      '02_triggers_functions',
      '03_views',
      '04_seed_data',
      '05_modulo_cmv',
      '06_multi_tenant',
      '07_clientes_master',
      '08_pedidos',
      '09_produtos'
    ];

    let executedCount = 0;

    for (const migrationName of migrations) {
      if (executedNames.has(migrationName)) {
        console.log(`⏭️  Migração ${migrationName} já executada`);
        continue;
      }

      try {
        // Tentar ler arquivo SQL
        const sqlPath = join(__dirname, '../../database', `${migrationName}.sql`);
        const sql = readFileSync(sqlPath, 'utf-8');
        
        await runMigration(migrationName, sql);
        executedCount++;
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log(`⚠️  Arquivo de migração ${migrationName}.sql não encontrado`);
        } else {
          throw error;
        }
      }
    }

    console.log(`\n✅ ${executedCount} migração(ões) executada(s) com sucesso\n`);
    return executedCount;
  } catch (error: any) {
    console.error('\n❌ Erro ao executar migrações:', error.message);
    throw error;
  }
};
