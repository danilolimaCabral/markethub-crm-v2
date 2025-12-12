/**
 * ENDPOINT TEMPORÁRIO PARA SETUP DE CREDENCIAIS
 * REMOVER APÓS TESTES!
 */

import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// Endpoint público temporário para cadastrar credenciais
router.post('/setup-credentials-temp', async (req: Request, res: Response) => {
  try {
    console.log('🔧 Setup temporário de credenciais iniciado...');
    
    // Buscar cliente teste
    const userResult = await pool.query(`
      SELECT id, username, email, tenant_id 
      FROM users 
      WHERE email = 'teste.ml@markthubcrm.com'
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente teste não encontrado' 
      });
    }
    
    const user = userResult.rows[0];
    console.log('✅ Cliente encontrado:', user.email);
    
    // Inserir credenciais
    const credResult = await pool.query(`
      INSERT INTO marketplace_credentials (
        user_id,
        tenant_id,
        marketplace,
        client_id,
        client_secret,
        config,
        is_active,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (user_id, marketplace) 
      DO UPDATE SET
        client_id = EXCLUDED.client_id,
        client_secret = EXCLUDED.client_secret,
        config = EXCLUDED.config,
        is_active = true,
        updated_at = NOW()
      RETURNING id, marketplace, client_id, is_active
    `, [
      user.id,
      user.tenant_id,
      'mercado_livre',
      '6702284202610735',
      'co8Zb40AZvmMIvnhLk0vfRwuxPCESNac',
      JSON.stringify({
        redirect_uri: 'https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback'
      }),
      true,
      1 // superadmin
    ]);
    
    console.log('✅ Credenciais cadastradas!');
    
    res.json({
      success: true,
      message: 'Credenciais cadastradas com sucesso!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        },
        credentials: credResult.rows[0]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao cadastrar credenciais:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para verificar credenciais
router.get('/check-credentials-temp', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        mc.id,
        mc.user_id,
        u.email as user_email,
        mc.marketplace,
        mc.client_id,
        LEFT(mc.client_secret, 10) || '...' as client_secret_preview,
        mc.is_active,
        mc.created_at
      FROM marketplace_credentials mc
      JOIN users u ON mc.user_id = u.id
      ORDER BY mc.created_at DESC
    `);
    
    res.json({
      success: true,
      total: result.rows.length,
      credentials: result.rows
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
