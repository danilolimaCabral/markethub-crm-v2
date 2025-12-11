import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/info:
 *   get:
 *     summary: Informações sobre a API
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Informações da API
 */
router.get('/', (_req, res) => {
  res.json({
    name: 'Markthub CRM API',
    version: '2.1.0',
    description: 'API completa para gestão de e-commerce integrado ao Mercado Livre',
    documentation: '/api-docs',
    endpoints: {
      auth: {
        base: '/api/auth',
        description: 'Autenticação e autorização',
        routes: [
          'POST /api/auth/register - Registrar novo usuário',
          'POST /api/auth/login - Login',
          'POST /api/auth/logout - Logout',
          'GET /api/auth/me - Dados do usuário autenticado',
          'POST /api/auth/2fa/setup - Configurar 2FA',
          'POST /api/auth/2fa/verify - Verificar código 2FA',
        ],
      },
      clientes: {
        base: '/api/clientes',
        description: 'Gestão de clientes',
        routes: [
          'GET /api/clientes - Listar clientes',
          'POST /api/clientes - Criar cliente',
          'GET /api/clientes/:id - Buscar cliente',
          'PUT /api/clientes/:id - Atualizar cliente',
          'DELETE /api/clientes/:id - Deletar cliente',
        ],
      },
      pedidos: {
        base: '/api/pedidos',
        description: 'Gestão de pedidos',
        routes: [
          'GET /api/pedidos - Listar pedidos',
          'POST /api/pedidos - Criar pedido',
          'GET /api/pedidos/:id - Buscar pedido',
          'PUT /api/pedidos/:id - Atualizar pedido',
          'DELETE /api/pedidos/:id - Deletar pedido',
        ],
      },
      produtos: {
        base: '/api/produtos',
        description: 'Gestão de produtos',
        routes: [
          'GET /api/produtos - Listar produtos',
          'POST /api/produtos - Criar produto',
          'GET /api/produtos/:id - Buscar produto',
          'PUT /api/produtos/:id - Atualizar produto',
          'DELETE /api/produtos/:id - Deletar produto',
        ],
      },
      mercadolivre: {
        base: '/api/integrations/mercadolivre',
        description: 'Integração com Mercado Livre',
        routes: [
          'GET /api/integrations/mercadolivre/auth - Iniciar OAuth',
          'GET /api/integrations/mercadolivre/callback - Callback OAuth',
          'GET /api/integrations/mercadolivre/orders - Listar pedidos ML',
          'GET /api/integrations/mercadolivre/products - Listar produtos ML',
          'POST /api/integrations/mercadolivre/sync - Sincronizar dados',
        ],
      },
      payments: {
        base: '/api/payments',
        description: 'Gestão de pagamentos e assinaturas',
        routes: [
          'POST /api/payments/create-checkout - Criar checkout',
          'POST /api/payments/webhook - Webhook Stripe',
          'GET /api/payments/subscription - Dados da assinatura',
          'POST /api/payments/cancel - Cancelar assinatura',
        ],
      },
      tenants: {
        base: '/api/tenants',
        description: 'Gestão de tenants (multi-tenant)',
        routes: [
          'GET /api/tenants - Listar tenants',
          'POST /api/tenants - Criar tenant',
          'GET /api/tenants/:id - Buscar tenant',
          'PUT /api/tenants/:id - Atualizar tenant',
        ],
      },
      ai: {
        base: '/api/ai',
        description: 'Assistente de IA e análises',
        routes: [
          'POST /api/ai/chat - Conversar com assistente',
          'POST /api/ai/analyze - Analisar dados',
        ],
      },
    },
    features: [
      'Autenticação JWT com 2FA',
      'Multi-tenant',
      'Integração Mercado Livre',
      'Pagamentos Stripe',
      'Assistente IA',
      'Rate limiting',
      'Validação de dados',
      'Logging',
    ],
    support: {
      email: 'suporte@markethubcrm.com.br',
      documentation: 'https://docs.markethubcrm.com.br',
    },
  });
});

export default router;
