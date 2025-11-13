/**
 * Rotas de integração com Mercado Livre
 * OAuth2, Sincronização e Webhooks
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, enforceTenantIsolation } from '../middleware/auth';
import { apiLimiter, marketplaceLimiter } from '../middleware/rateLimiter';
import MercadoLivreOAuthService from '../services/MercadoLivreOAuthService';
import MercadoLivreSyncService from '../services/MercadoLivreSyncService';
import MercadoLivreWebhookService from '../services/MercadoLivreWebhookService';
import { query } from '../db';
import { cache } from '../utils/cache';

const router = Router();

// ========================================
// ROTAS PÚBLICAS (Webhooks)
// ========================================

/**
 * POST /api/integrations/mercadolivre/webhook
 * Recebe notificações do ML (deve ser público)
 */
router.post('/webhook', async (req, res) => {
  await MercadoLivreWebhookService.handleWebhook(req, res);
});

// ========================================
// ROTAS PROTEGIDAS (Requer autenticação)
// ========================================

router.use(authenticateToken);
router.use(enforceTenantIsolation);
router.use(marketplaceLimiter);

/**
 * GET /api/integrations/mercadolivre/auth/url
 * Gera URL de autorização OAuth2
 */
router.get('/auth/url', async (req: AuthRequest, res: Response) => {
  try {
    const { tenant_id, id: user_id } = req.user!;

    // Gerar state único para segurança (CSRF protection)
    const state = Buffer.from(
      JSON.stringify({
        tenant_id,
        user_id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Armazenar state no cache por 10 minutos
    await cache.set(`ml_oauth_state:${state}`, { tenant_id, user_id }, 600);

    const authUrl = MercadoLivreOAuthService.getAuthorizationUrl(state);

    res.json({
      authUrl,
      state,
      expiresIn: 600, // 10 minutos
    });
  } catch (error: any) {
    console.error('Erro ao gerar URL de autenticação:', error);
    res.status(500).json({
      error: 'Erro ao iniciar autenticação',
      code: 'AUTH_URL_ERROR',
    });
  }
});

/**
 * GET /api/integrations/mercadolivre/auth/callback
 * Callback do OAuth2 (pode ser público ou protegido)
 */
router.get('/auth/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(
        `/mercado-livre?error=${encodeURIComponent('Autorização negada pelo usuário')}`
      );
    }

    if (!code || !state) {
      return res.redirect(
        `/mercado-livre?error=${encodeURIComponent('Parâmetros inválidos')}`
      );
    }

    // Recuperar e validar state
    const stateData = await cache.get(`ml_oauth_state:${state}`);
    if (!stateData) {
      return res.redirect(
        `/mercado-livre?error=${encodeURIComponent('State inválido ou expirado')}`
      );
    }

    // Limpar state
    await cache.delete(`ml_oauth_state:${state}`);

    // Trocar código por tokens
    const tokenData = await MercadoLivreOAuthService.exchangeCodeForToken(code as string);

    // Obter informações do usuário ML
    const userInfo = await MercadoLivreOAuthService.getUserInfo(tokenData.access_token);

    // Salvar integração no banco
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const existingResult = await query(
      `SELECT id FROM marketplace_integrations 
       WHERE tenant_id = $1 AND marketplace = 'mercado_livre'`,
      [stateData.tenant_id]
    );

    if (existingResult.rows.length > 0) {
      // Atualizar existente
      await query(
        `UPDATE marketplace_integrations 
         SET access_token = $1, refresh_token = $2, token_expires_at = $3,
             is_active = true, config = $4, updated_at = NOW()
         WHERE id = $5`,
        [
          tokenData.access_token,
          tokenData.refresh_token,
          expiresAt,
          JSON.stringify({ ml_user_id: tokenData.user_id, ml_nickname: userInfo.nickname }),
          existingResult.rows[0].id,
        ]
      );
    } else {
      // Criar nova
      await query(
        `INSERT INTO marketplace_integrations (
          tenant_id, marketplace, access_token, refresh_token,
          token_expires_at, is_active, config
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          stateData.tenant_id,
          'mercado_livre',
          tokenData.access_token,
          tokenData.refresh_token,
          expiresAt,
          true,
          JSON.stringify({ ml_user_id: tokenData.user_id, ml_nickname: userInfo.nickname }),
        ]
      );
    }

    // Redirecionar para frontend com sucesso
    res.redirect(`/mercado-livre?success=true&nickname=${encodeURIComponent(userInfo.nickname)}`);
  } catch (error: any) {
    console.error('Erro no callback OAuth:', error);
    res.redirect(
      `/mercado-livre?error=${encodeURIComponent(error.message || 'Erro na autenticação')}`
    );
  }
});

/**
 * GET /api/integrations/mercadolivre/status
 * Verifica status da integração
 */
router.get('/status', apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenant_id!;

    const result = await query(
      `SELECT id, is_active, last_sync_at, token_expires_at, config
       FROM marketplace_integrations
       WHERE tenant_id = $1 AND marketplace = 'mercado_livre'
       LIMIT 1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.json({
        connected: false,
        message: 'Integração não configurada',
      });
    }

    const integration = result.rows[0];
    const config = JSON.parse(integration.config || '{}');

    res.json({
      connected: integration.is_active,
      integration: {
        id: integration.id,
        ml_user_id: config.ml_user_id,
        ml_nickname: config.ml_nickname,
        last_sync: integration.last_sync_at,
        token_expires_at: integration.token_expires_at,
        is_token_valid: new Date(integration.token_expires_at) > new Date(),
      },
    });
  } catch (error: any) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      error: 'Erro ao verificar status da integração',
      code: 'STATUS_ERROR',
    });
  }
});

/**
 * POST /api/integrations/mercadolivre/disconnect
 * Desconecta a integração
 */
router.post('/disconnect', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenant_id!;

    await query(
      `UPDATE marketplace_integrations 
       SET is_active = false, updated_at = NOW()
       WHERE tenant_id = $1 AND marketplace = 'mercado_livre'`,
      [tenantId]
    );

    // Invalidar cache
    await cache.deletePattern(`ml:${tenantId}*`);

    res.json({
      success: true,
      message: 'Integração desconectada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao desconectar:', error);
    res.status(500).json({
      error: 'Erro ao desconectar integração',
      code: 'DISCONNECT_ERROR',
    });
  }
});

// ========================================
// ROTAS DE SINCRONIZAÇÃO
// ========================================

/**
 * POST /api/integrations/mercadolivre/sync
 * Sincronização completa (pedidos + produtos)
 */
router.post('/sync', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenant_id!;
    const { syncOrders = true, syncProducts = true, syncQuestions = false, limit = 50 } = req.body;

    // Verificar se já está sincronizando
    const syncKey = `ml_sync_in_progress:${tenantId}`;
    const isSyncInProgress = await cache.exists(syncKey);

    if (isSyncInProgress) {
      return res.status(409).json({
        error: 'Já existe uma sincronização em andamento',
        code: 'SYNC_IN_PROGRESS',
      });
    }

    // Marcar como em progresso por 10 minutos
    await cache.set(syncKey, true, 600);

    // Executar sincronização
    const syncService = new MercadoLivreSyncService(tenantId);
    const results = await syncService.syncAll({
      syncOrders,
      syncProducts,
      syncQuestions,
      limit,
    });

    // Limpar flag
    await cache.delete(syncKey);

    res.json({
      success: true,
      message: 'Sincronização concluída',
      results,
    });
  } catch (error: any) {
    console.error('Erro na sincronização:', error);
    
    // Limpar flag em caso de erro
    await cache.delete(`ml_sync_in_progress:${req.tenant_id}`);

    res.status(500).json({
      error: 'Erro ao sincronizar dados',
      code: 'SYNC_ERROR',
      message: error.message,
    });
  }
});

/**
 * POST /api/integrations/mercadolivre/sync/orders
 * Sincroniza apenas pedidos
 */
router.post('/sync/orders', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenant_id!;
    const { limit = 50 } = req.body;

    const syncService = new MercadoLivreSyncService(tenantId);
    await syncService.initialize();
    
    const result = await syncService.syncOrders(limit);

    res.json({
      success: result.success,
      message: `${result.processed} pedidos sincronizados`,
      result,
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar pedidos:', error);
    res.status(500).json({
      error: 'Erro ao sincronizar pedidos',
      code: 'SYNC_ORDERS_ERROR',
      message: error.message,
    });
  }
});

/**
 * POST /api/integrations/mercadolivre/sync/products
 * Sincroniza apenas produtos
 */
router.post('/sync/products', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenant_id!;
    const { limit = 50 } = req.body;

    const syncService = new MercadoLivreSyncService(tenantId);
    await syncService.initialize();
    
    const result = await syncService.syncProducts(limit);

    res.json({
      success: result.success,
      message: `${result.processed} produtos sincronizados`,
      result,
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar produtos:', error);
    res.status(500).json({
      error: 'Erro ao sincronizar produtos',
      code: 'SYNC_PRODUCTS_ERROR',
      message: error.message,
    });
  }
});

/**
 * GET /api/integrations/mercadolivre/sync/history
 * Histórico de sincronizações
 */
router.get('/sync/history', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenant_id!;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT 
        l.id, l.sync_type, l.status, l.records_processed, l.records_failed,
        l.error_message, l.started_at, l.completed_at,
        EXTRACT(EPOCH FROM (l.completed_at - l.started_at)) as duration_seconds
       FROM marketplace_sync_log l
       INNER JOIN marketplace_integrations i ON l.integration_id = i.id
       WHERE i.tenant_id = $1 AND i.marketplace = 'mercado_livre'
       ORDER BY l.started_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      error: 'Erro ao buscar histórico de sincronizações',
      code: 'HISTORY_ERROR',
    });
  }
});

// ========================================
// ROTAS DE PRODUTOS NO ML
// ========================================

/**
 * POST /api/integrations/mercadolivre/products/:productId/update-stock
 * Atualiza estoque de um produto no ML
 */
router.post('/products/:productId/update-stock', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenant_id!;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        error: 'Quantidade inválida',
        code: 'INVALID_QUANTITY',
      });
    }

    // Buscar SKU do produto
    const productResult = await query(
      'SELECT sku FROM products WHERE id = $1 AND tenant_id = $2',
      [productId, tenantId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Produto não encontrado',
        code: 'PRODUCT_NOT_FOUND',
      });
    }

    const sku = productResult.rows[0].sku;

    // Atualizar no ML
    const syncService = new MercadoLivreSyncService(tenantId);
    await syncService.updateStockOnML(sku, quantity);

    res.json({
      success: true,
      message: 'Estoque atualizado no Mercado Livre',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({
      error: 'Erro ao atualizar estoque no Mercado Livre',
      code: 'UPDATE_STOCK_ERROR',
      message: error.message,
    });
  }
});

export default router;
