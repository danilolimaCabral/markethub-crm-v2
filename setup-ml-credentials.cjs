/**
 * Script para configurar credenciais do Mercado Livre
 * Execute: node setup-ml-credentials.js
 */

const crypto = require('crypto');
const { Pool } = require('pg');

// Credenciais do Mercado Livre
const ML_CLIENT_ID = '6702284202610735';
const ML_CLIENT_SECRET = 'co8Zb40AZwmViVhhLk0viRWuxPCESNac';
const ML_REDIRECT_URI = 'https://www.markthubcrm.com.br/api/integrations/mercadolivre/callback';

// Função para criptografar o secret
function encryptSecret(secret) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!!!!!', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

async function setupCredentials() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Configurando credenciais do Mercado Livre...\n');

    // 1. Criar tabela se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_credentials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        marketplace VARCHAR(50) NOT NULL,
        client_id TEXT NOT NULL,
        client_secret TEXT NOT NULL,
        config JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, marketplace)
      )
    `);
    console.log('✅ Tabela marketplace_credentials verificada');

    // 2. Criptografar o secret
    const encryptedSecret = encryptSecret(ML_CLIENT_SECRET);
    console.log('✅ Client Secret criptografado');

    // 3. Inserir ou atualizar credenciais
    const result = await pool.query(`
      INSERT INTO marketplace_credentials (
        user_id, 
        marketplace, 
        client_id, 
        client_secret, 
        config
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, marketplace) 
      DO UPDATE SET
        client_id = EXCLUDED.client_id,
        client_secret = EXCLUDED.client_secret,
        config = EXCLUDED.config,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, [
      1, // user_id
      'mercado_livre',
      ML_CLIENT_ID,
      encryptedSecret,
      JSON.stringify({ redirect_uri: ML_REDIRECT_URI })
    ]);

    console.log(`✅ Credenciais configuradas (ID: ${result.rows[0].id})`);

    // 4. Verificar configuração
    const check = await pool.query(`
      SELECT 
        id,
        user_id,
        marketplace,
        client_id,
        LEFT(client_secret, 20) || '...' as client_secret_preview,
        config,
        is_active
      FROM marketplace_credentials
      WHERE marketplace = 'mercado_livre'
    `);

    console.log('\n📋 Configuração atual:');
    console.table(check.rows);

    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Acesse: https://www.markthubcrm.com.br/integracoes/mercadolivre');
    console.log('2. Clique em "Conectar com Mercado Livre"');
    console.log('3. Autorize a aplicação no Mercado Livre');
    console.log('4. Pronto! ✅\n');

  } catch (error) {
    console.error('❌ Erro ao configurar credenciais:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
setupCredentials();
