import { Router, Request, Response } from 'express';
import MercadoLivreOAuthService from '../services/MercadoLivreOAuthService';
import MercadoLivreProductService from '../services/MercadoLivreProductService';
import MercadoLivreOrderService from '../services/MercadoLivreOrderService';
import MercadoLivreIntegration from '../models/MercadoLivreIntegration';
import MLProduct from '../models/MLProduct';
import MLOrder from '../models/MLOrder';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * GET /api/integrations/mercadolivre/auth
 * Inicia o fluxo de autenticação OAuth
 */
router.get('/auth', async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = (req as any).user;

    // Gera um state único para segurança
    const state = `${tenantId}-${userId}-${Date.now()}`;

    // Armazena o state na sessão (ou em cache)
    // TODO: Implementar armazenamento do state

    const authUrl = MercadoLivreOAuthService.getAuthorizationUrl(state);

    res.json({ authUrl });
  } catch (error: any) {
    console.error('Erro ao iniciar autenticação:', error);
    res.status(500).json({ error: 'Erro ao iniciar autenticação' });
  }
});

/**
 * GET /api/integrations/mercadolivre/callback
 * Callback do OAuth após autorização
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({ error: 'Autorização negada pelo usuário' });
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    // Valida o state
    // TODO: Implementar validação do state

    // Extrai tenantId e userId do state
    const [tenantId, userId] = (state as string).split('-').map(Number);

    // Troca o código por access token
    const tokenData = await MercadoLivreOAuthService.exchangeCodeForToken(code as string);

    // Salva a integração no banco
    const integration = await MercadoLivreOAuthService.saveIntegration(tenantId, userId, tokenData);

    // Redireciona para o frontend
    res.redirect(`/integrations/mercadolivre?success=true&integration_id=${integration.id}`);
  } catch (error: any) {
    console.error('Erro no callback OAuth:', error);
    res.redirect('/integrations/mercadolivre?success=false&error=' + encodeURIComponent(error.message));
  }
});

/**
 * GET /api/integrations/mercadolivre/status
 * Verifica status da integração
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;

    const integration = await MercadoLivreIntegration.findOne({
      where: { tenantId, isActive: true },
    });

    if (!integration) {
      return res.json({ connected: false });
    }

    // Obtém informações do usuário do ML
    const accessToken = await MercadoLivreOAuthService.ensureValidToken(integration);
    const userInfo = await MercadoLivreOAuthService.getUserInfo(accessToken);

    res.json({
      connected: true,
      integration: {
        id: integration.id,
        mlUserId: integration.mlUserId,
        lastSync: integration.lastSync,
        userInfo: {
          nickname: userInfo.nickname,
          email: userInfo.email,
          permalink: userInfo.permalink,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ error: 'Erro ao verificar status da integração' });
  }
});

/**
 * POST /api/integrations/mercadolivre/disconnect
 * Desconecta a integração
 */
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;

    const integration = await MercadoLivreIntegration.findOne({
      where: { tenantId, isActive: true },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    await integration.update({ isActive: false });

    res.json({ success: true, message: 'Integração desconectada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desconectar:', error);
    res.status(500).json({ error: 'Erro ao desconectar integração' });
  }
});

/**
 * POST /api/integrations/mercadolivre/sync/products
 * Sincroniza produtos do ML para o CRM
 */
router.post('/sync/products', async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;

    const integration = await MercadoLivreIntegration.findOne({
      where: { tenantId, isActive: true },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    const result = await MercadoLivreProductService.syncProducts(integration);

    res.json({
      success: true,
      message: 'Sincronização concluída',
      result,
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar produtos:', error);
    res.status(500).json({ error: 'Erro ao sincronizar produtos' });
  }
});

/**
 * GET /api/integrations/mercadolivre/products
 * Lista produtos sincronizados
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;

    const integration = await MercadoLivreIntegration.findOne({
      where: { tenantId, isActive: true },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    const products = await MercadoLivreProductService.listProducts(tenantId, integration.id);

    res.json({ products });
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

/**
 * POST /api/integrations/mercadolivre/sync/orders
 * Sincroniza pedidos do ML para o CRM
 */
router.post('/sync/orders', async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;
    const { dateFrom, dateTo, status } = req.body;

    const integration = await MercadoLivreIntegration.findOne({
      where: { tenantId, isActive: true },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    const options: any = {};
    if (dateFrom) options.dateFrom = new Date(dateFrom);
    if (dateTo) options.dateTo = new Date(dateTo);
    if (status) options.status = status;

    const result = await MercadoLivreOrderService.syncOrders(integration, options);

    res.json({
      success: true,
      message: 'Sincronização concluída',
      result,
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar pedidos:', error);
    res.status(500).json({ error: 'Erro ao sincronizar pedidos' });
  }
});

/**
 * GET /api/integrations/mercadolivre/orders
 * Lista pedidos sincronizados
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;
    const { status, dateFrom, dateTo } = req.query;

    const integration = await MercadoLivreIntegration.findOne({
      where: { tenantId, isActive: true },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    const filters: any = {};
    if (status) filters.status = status as string;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);

    const orders = await MercadoLivreOrderService.listOrders(tenantId, integration.id, filters);

    res.json({ orders });
  } catch (error: any) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

/**
 * GET /api/integrations/mercadolivre/stats
 * Obtém estatísticas da integração
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;

    const integration = await MercadoLivreIntegration.findOne({
      where: { tenantId, isActive: true },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    const [productCount, orderStats] = await Promise.all([
      MLProduct.count({ where: { tenantId, integrationId: integration.id } }),
      MercadoLivreOrderService.getOrderStats(tenantId, integration.id),
    ]);

    res.json({
      products: productCount,
      orders: orderStats,
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

/**
 * POST /api/integrations/mercadolivre/webhook
 * Recebe notificações do Mercado Livre
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Processa webhook de forma assíncrona (não bloqueia resposta)
    import('../services/MercadoLivreWebhookService').then(({ default: WebhookService }) => {
      WebhookService.processWebhook(payload).catch((error) => {
        console.error('Erro ao processar webhook:', error);
      });
    });

    // Responde imediatamente ao ML
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Error');
  }
});

/**
 * POST /api/integrations/mercadolivre/setup-webhook
 * Configura webhooks no Mercado Livre
 */
router.post('/setup-webhook', async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'URL do webhook é obrigatória' });
    }

    const integration = await MercadoLivreIntegration.findOne({
      where: { tenantId, isActive: true },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    const WebhookService = (await import('../services/MercadoLivreWebhookService')).default;
    await WebhookService.setupWebhook(integration, webhookUrl);

    res.json({ success: true, message: 'Webhooks configurados com sucesso' });
  } catch (error: any) {
    console.error('Erro ao configurar webhook:', error);
    res.status(500).json({ error: 'Erro ao configurar webhook' });
  }
});

export default router;
