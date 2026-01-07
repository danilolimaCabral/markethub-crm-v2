import { beforeAll, afterAll } from 'vitest';
import { pool } from '../db';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente de teste
dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  console.log('🔧 Configurando ambiente de testes...');
  
  // Verificar conexão com o banco de dados
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com banco de dados estabelecida');
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('🧹 Limpando ambiente de testes...');
  
  // Fechar pool de conexões
  await pool.end();
  console.log('✅ Testes finalizados');
});
