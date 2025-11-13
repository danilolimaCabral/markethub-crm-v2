import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { extractTenant, TenantRequest } from '../middleware/tenant';
import AmazonSPAPIService from '../services/AmazonSPAPIService';
import { asyncHandler, errors } from '../middleware/errorHandler';
import { logError } from '../middleware/logger';

const router = Router();

// Todas as rotas requerem autenticação e tenant
router.use(authenticateToken);
router.use(extractTenant);

/**
 * POST /api/integrations/amazon/connect
 * Conecta integração com Amazon SP-API
 */
router.post('/connect', asyncHandler(async (req: TenantRequest, res: Response) => {
  const { tenantId } = req;
  const {
    clientId,
    clientSecret,
    refreshToken,
    accessKeyId,
    secretAccessKey,
    region = 'us-east-1',
  } = req.body;

  if (!clientId || !clientSecret || !refreshToken || !accessKeyId || !secretAccessKey) {
    throw errors.badRequest('Credenciais da Amazon são obrigatórias');
  }

  // TODO: Salvar credenciais no banco (criptografadas)
  // Por enquanto, apenas valida

  const credentials = {
    clientId,
    clientSecret,
    refreshToken,
    accessKeyId,
    secretAccessKey,
    region,
  };

  // Testa conexão
  const amazonService = new AmazonSPAPIService(credentials);
  // TODO: Fazer teste de conexão real

  res.json({
    success: true,
    message: 'Integração Amazon configurada com sucesso',
  });
}));

/**
 * GET /api/integrations/amazon/orders
 * Lista pedidos da Amazon
 */
router.get('/orders', asyncHandler(async (req: TenantRequest, res: Response) => {
  const { tenantId } = req;
  const { createdAfter, createdBefore, orderStatuses } = req.query;

  // TODO: Buscar credenciais do banco
  // Por enquanto, retorna erro
  throw errors.badRequest('Integração Amazon não configurada. Configure as credenciais primeiro.');

  // const credentials = await getAmazonCredentials(tenantId);
  // const amazonService = new AmazonSPAPIService(credentials);
  // const orders = await amazonService.listOrders({
  //   createdAfter: createdAfter ? new Date(createdAfter as string) : undefined,
  //   createdBefore: createdBefore ? new Date(createdBefore as string) : undefined,
  //   orderStatuses: orderStatuses ? (orderStatuses as string).split(',') : undefined,
  // });

  // res.json({ orders });
}));

/**
 * GET /api/integrations/amazon/orders/:orderId
 * Obtém detalhes de um pedido
 */
router.get('/orders/:orderId', asyncHandler(async (req: TenantRequest, res: Response) => {
  const { orderId } = req.params;
  const { tenantId } = req;

  // TODO: Implementar busca de pedido
  throw errors.badRequest('Integração Amazon não configurada');
}));

export default router;
