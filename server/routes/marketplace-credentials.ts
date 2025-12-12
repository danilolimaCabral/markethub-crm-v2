/**
 * Rotas de Gerenciamento de Credenciais de Marketplace
 * Permite admin master cadastrar credenciais OAuth para cada cliente
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { query } from '../db';
import crypto from 'crypto';

const router = Router();

// Middleware: apenas superadmin ou admin
const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Apenas administradores podem gerenciar credenciais',
    });
  }
  next();
};

router.use(authenticateToken);
router.use(requireAdmin);

// Função para criptografar credenciais
function encryptSecret(secret: string): string {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!!!!!', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// Função para descriptografar credenciais
function decryptSecret(encryptedSecret: string): string {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!!!!!', 'utf8').slice(0, 32);
  
  const parts = encryptedSecret.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * GET /api/admin/marketplace-credentials
 * Lista todas as credenciais cadastradas
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        mc.id,
        mc.user_id,
        mc.tenant_id,
        mc.marketplace,
        mc.client_id,
        mc.is_active,
        mc.config,
        mc.created_at,
        mc.updated_at,
        u.username,
        u.email,
        u.nome as user_name,
        t.nome as tenant_name,
        creator.username as created_by_username
      FROM marketplace_credentials mc
      LEFT JOIN users u ON u.id = mc.user_id
      LEFT JOIN tenants t ON t.id = mc.tenant_id
      LEFT JOIN users creator ON creator.id = mc.created_by
      ORDER BY mc.created_at DESC
    `);

    const credentials = result.rows.map(row => ({
      id: row.id,
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        name: row.user_name || row.username,
      },
      tenant: {
        id: row.tenant_id,
        name: row.tenant_name || `Tenant ${row.tenant_id}`,
      },
      marketplace: row.marketplace,
      client_id: row.client_id,
      // NÃO retornar client_secret por segurança
      is_active: row.is_active,
      config: row.config,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by_username,
    }));

    res.json({
      success: true,
      count: credentials.length,
      credentials,
    });
  } catch (error: any) {
    console.error('Erro ao listar credenciais:', error);
    res.status(500).json({
      error: 'Erro ao listar credenciais',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/marketplace-credentials/user/:userId
 * Lista credenciais de um usuário específico
 */
router.get('/user/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(`
      SELECT 
        mc.id,
        mc.marketplace,
        mc.client_id,
        mc.is_active,
        mc.config,
        mc.created_at,
        mc.updated_at
      FROM marketplace_credentials mc
      WHERE mc.user_id = $1
      ORDER BY mc.marketplace
    `, [userId]);

    res.json({
      success: true,
      user_id: parseInt(userId),
      credentials: result.rows,
    });
  } catch (error: any) {
    console.error('Erro ao buscar credenciais do usuário:', error);
    res.status(500).json({
      error: 'Erro ao buscar credenciais',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/marketplace-credentials
 * Cadastra novas credenciais para um cliente
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, marketplace, client_id, client_secret, config } = req.body;

    // Validações
    if (!user_id || !marketplace || !client_id || !client_secret) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'user_id, marketplace, client_id e client_secret são obrigatórios',
      });
    }

    // Buscar tenant_id do usuário
    const userResult = await query('SELECT tenant_id FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
      });
    }

    const tenant_id = userResult.rows[0].tenant_id;

    // Criptografar client_secret
    const encryptedSecret = encryptSecret(client_secret);

    // Verificar se já existe credencial para este usuário/marketplace
    const existingResult = await query(
      'SELECT id FROM marketplace_credentials WHERE user_id = $1 AND marketplace = $2',
      [user_id, marketplace]
    );

    let credentialId;

    if (existingResult.rows.length > 0) {
      // Atualizar existente
      const updateResult = await query(`
        UPDATE marketplace_credentials 
        SET client_id = $1, client_secret = $2, config = $3, 
            is_active = true, updated_at = NOW()
        WHERE user_id = $4 AND marketplace = $5
        RETURNING id
      `, [client_id, encryptedSecret, JSON.stringify(config || {}), user_id, marketplace]);
      
      credentialId = updateResult.rows[0].id;
    } else {
      // Criar nova
      const insertResult = await query(`
        INSERT INTO marketplace_credentials (
          user_id, tenant_id, marketplace, client_id, client_secret,
          config, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        user_id,
        tenant_id,
        marketplace,
        client_id,
        encryptedSecret,
        JSON.stringify(config || {}),
        req.user!.id,
      ]);
      
      credentialId = insertResult.rows[0].id;
    }

    res.json({
      success: true,
      message: 'Credenciais cadastradas com sucesso',
      credential_id: credentialId,
    });
  } catch (error: any) {
    console.error('Erro ao cadastrar credenciais:', error);
    res.status(500).json({
      error: 'Erro ao cadastrar credenciais',
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/marketplace-credentials/:id
 * Atualiza credenciais existentes
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { client_id, client_secret, config, is_active } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (client_id !== undefined) {
      updates.push(`client_id = $${paramIndex++}`);
      values.push(client_id);
    }

    if (client_secret !== undefined) {
      const encryptedSecret = encryptSecret(client_secret);
      updates.push(`client_secret = $${paramIndex++}`);
      values.push(encryptedSecret);
    }

    if (config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(config));
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar',
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    await query(`
      UPDATE marketplace_credentials 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, values);

    res.json({
      success: true,
      message: 'Credenciais atualizadas com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar credenciais:', error);
    res.status(500).json({
      error: 'Erro ao atualizar credenciais',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/admin/marketplace-credentials/:id
 * Remove credenciais
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM marketplace_credentials WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Credenciais removidas com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao remover credenciais:', error);
    res.status(500).json({
      error: 'Erro ao remover credenciais',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/marketplace-credentials/decrypt/:id
 * Retorna credenciais descriptografadas (apenas para admin)
 * CUIDADO: Use apenas quando necessário!
 */
router.get('/decrypt/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT client_id, client_secret FROM marketplace_credentials WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Credencial não encontrada',
      });
    }

    const row = result.rows[0];
    const decryptedSecret = decryptSecret(row.client_secret);

    res.json({
      success: true,
      client_id: row.client_id,
      client_secret: decryptedSecret,
    });
  } catch (error: any) {
    console.error('Erro ao descriptografar credenciais:', error);
    res.status(500).json({
      error: 'Erro ao descriptografar credenciais',
      message: error.message,
    });
  }
});

export default router;
export { encryptSecret, decryptSecret };
