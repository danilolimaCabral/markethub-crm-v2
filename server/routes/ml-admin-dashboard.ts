/**
 * Rotas do Dashboard Admin Master - Mercado Livre
 * Permite ao superadmin visualizar status de todas as integrações
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { query } from '../db';

const router = Router();

// Middleware: apenas superadmin
const requireSuperAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Apenas administradores podem acessar este recurso',
    });
  }
  next();
};

router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/mercadolivre/all-status
 * Retorna status de TODAS as integrações ML de todos os usuários/tenants
 */
router.get('/all-status', async (req: AuthRequest, res: Response) => {
  try {
    // Buscar todas as integrações com informações do usuário
    const result = await query(`
      SELECT 
        mi.id,
        mi.tenant_id,
        mi.is_active,
        mi.last_sync_at,
        mi.token_expires_at,
        mi.config,
        mi.created_at,
        mi.updated_at,
        u.id as user_id,
        u.username,
        u.email,
        u.nome as user_name,
        t.nome as tenant_name
      FROM marketplace_integrations mi
      LEFT JOIN users u ON u.tenant_id = mi.tenant_id
      LEFT JOIN tenants t ON t.id = mi.tenant_id
      WHERE mi.marketplace = 'mercado_livre'
      ORDER BY mi.updated_at DESC
    `);

    const integrations = result.rows.map(row => {
      const config = JSON.parse(row.config || '{}');
      const tokenExpiresAt = new Date(row.token_expires_at);
      const isTokenValid = tokenExpiresAt > new Date();

      return {
        id: row.id,
        tenant: {
          id: row.tenant_id,
          name: row.tenant_name || `Tenant ${row.tenant_id}`,
        },
        user: {
          id: row.user_id,
          username: row.username,
          email: row.email,
          name: row.user_name || row.username,
        },
        mercadolivre: {
          user_id: config.ml_user_id,
          nickname: config.ml_nickname,
        },
        status: {
          connected: row.is_active,
          token_valid: isTokenValid,
          token_expires_at: row.token_expires_at,
          last_sync: row.last_sync_at,
        },
        timestamps: {
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      };
    });

    // Estatísticas gerais
    const stats = {
      total: integrations.length,
      connected: integrations.filter(i => i.status.connected).length,
      disconnected: integrations.filter(i => !i.status.connected).length,
      token_expired: integrations.filter(i => !i.status.token_valid).length,
    };

    res.json({
      success: true,
      stats,
      integrations,
    });
  } catch (error: any) {
    console.error('Erro ao buscar status das integrações:', error);
    res.status(500).json({
      error: 'Erro ao buscar status',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/mercadolivre/stats
 * Retorna apenas estatísticas agregadas
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as connected,
        COUNT(CASE WHEN is_active = false THEN 1 END) as disconnected,
        COUNT(CASE WHEN token_expires_at < NOW() THEN 1 END) as token_expired,
        MAX(last_sync_at) as last_sync_global
      FROM marketplace_integrations
      WHERE marketplace = 'mercado_livre'
    `);

    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        total: parseInt(stats.total),
        connected: parseInt(stats.connected),
        disconnected: parseInt(stats.disconnected),
        token_expired: parseInt(stats.token_expired),
        last_sync_global: stats.last_sync_global,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/mercadolivre/user/:userId/status
 * Retorna status de integração de um usuário específico
 */
router.get('/user/:userId/status', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(`
      SELECT 
        mi.id,
        mi.tenant_id,
        mi.is_active,
        mi.last_sync_at,
        mi.token_expires_at,
        mi.config,
        u.username,
        u.email
      FROM marketplace_integrations mi
      LEFT JOIN users u ON u.tenant_id = mi.tenant_id
      WHERE mi.marketplace = 'mercado_livre'
        AND u.id = $1
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({
        connected: false,
        message: 'Usuário não possui integração com Mercado Livre',
      });
    }

    const row = result.rows[0];
    const config = JSON.parse(row.config || '{}');
    const isTokenValid = new Date(row.token_expires_at) > new Date();

    res.json({
      connected: row.is_active,
      user: {
        username: row.username,
        email: row.email,
      },
      mercadolivre: {
        user_id: config.ml_user_id,
        nickname: config.ml_nickname,
      },
      status: {
        token_valid: isTokenValid,
        token_expires_at: row.token_expires_at,
        last_sync: row.last_sync_at,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar status do usuário:', error);
    res.status(500).json({
      error: 'Erro ao buscar status',
      message: error.message,
    });
  }
});

export default router;
