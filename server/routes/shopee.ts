import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { extractTenant, TenantRequest } from '../middleware/tenant';
import ShopeeAPIService from '../services/ShopeeAPIService';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = Router();

// Todas as rotas requerem autenticação e tenant
router.use(authenticateToken);
router.use(extractTenant);

/**
 * POST /api/integrations/shopee/connect
 * Conecta integração com Shopee
 */
router.post('/connect', asyncHandler(async (req: TenantRequest, res: Response) => {
  const { tenantId } = req;
  const {
    partnerId,
    partnerKey,
    shopId,
    accessToken,
  } = req.body;

  if (!partnerId || !partnerKey || !shopId) {
    throw errors.badRequest('Partner ID, Partner Key e Shop ID são obrigatórios');
  }

  // TODO: Salvar credenciais no banco (criptografadas)
  // Por enquanto, apenas valida

  const credentials = {
    partnerId,
    partnerKey,
    shopId,
    accessToken,
  };

  // Testa conexão
  const shopeeService = new ShopeeAPIService(credentials);
  // TODO: Fazer teste de conexão real

  res.json({
    success: true,
    message: 'Integração Shopee configurada com sucesso',
  });
}));

/**
 * GET /api/integrations/shopee/orders
 * Lista pedidos da Shopee
 */
router.get('/orders', asyncHandler(async (req: TenantRequest, res: Response) => {
  const { tenantId } = req;
  const { timeFrom, timeTo, orderStatus, pageSize } = req.query;

  // TODO: Buscar credenciais do banco
  throw errors.badRequest('Integração Shopee não configurada. Configure as credenciais primeiro.');

  // const credentials = await getShopeeCredentials(tenantId);
  // const shopeeService = new ShopeeAPIService(credentials);
  // const orders = await shopeeService.listOrders({
  //   timeFrom: timeFrom ? new Date(timeFrom as string) : undefined,
  //   timeTo: timeTo ? new Date(timeTo as string) : undefined,
  //   orderStatus: orderStatus as string,
  //   pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  // });

  // res.json({ orders });
}));

/**
 * GET /api/integrations/shopee/products
 * Lista produtos da Shopee
 */
router.get('/products', asyncHandler(async (req: TenantRequest, res: Response) => {
  const { tenantId } = req;

  // TODO: Implementar listagem de produtos
  throw errors.badRequest('Integração Shopee não configurada');
}));

export default router;
