const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function updatePassword() {
  const client = new Client({
    connectionString: 'postgresql://postgres:zyvEETScsIdamSKUQmbgCiglBPiayqlh@mainline.proxy.rlwy.net:27779/railway',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco');

    // Gerar hash da senha
    const password = 'True@2024!';
    const hash = await bcrypt.hash(password, 10);
    console.log('🔐 Hash gerado:', hash);

    // Desabilitar triggers
    await client.query('ALTER TABLE users DISABLE TRIGGER ALL');
    console.log('⏸️  Triggers desabilitados');

    // Atualizar senha
    const result = await client.query(
      `UPDATE users 
       SET password_hash = $1, updated_at = NOW()
       WHERE email = 'trueimportadosbr@icloud.com'
       RETURNING id, username, email`,
      [hash]
    );

    if (result.rows.length > 0) {
      console.log('✅ Senha atualizada com sucesso!');
      console.log('Usuário:', result.rows[0]);
    } else {
      console.log('❌ Usuário não encontrado');
    }

    // Reabilitar triggers
    await client.query('ALTER TABLE users ENABLE TRIGGER ALL');
    console.log('▶️  Triggers reabilitados');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('👋 Desconectado');
  }
}

updatePassword();
