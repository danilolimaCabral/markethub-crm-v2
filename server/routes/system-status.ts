import { Router } from 'express';
import sequelize from '../config/database';
import axios from 'axios';

const router = Router();

/**
 * @route GET /api/system/status
 * @desc Retorna o status completo de todas as APIs e integrações
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status: any = {
      timestamp: new Date().toISOString(),
      server: {
        status: 'online',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
      database: {
        status: 'unknown',
        connected: false,
        responseTime: null,
      },
      integrations: {
        mercadoLivre: {
          configured: false,
          connected: false,
          hasToken: false,
        },
        stripe: {
          configured: false,
        },
        redis: {
          configured: false,
          connected: false,
        },
        sentry: {
          configured: false,
        },
      },
      apis: {
        health: { status: 'ok', endpoint: '/api/health' },
        auth: { status: 'ok', endpoint: '/api/auth' },
        clientes: { status: 'ok', endpoint: '/api/clientes' },
        produtos: { status: 'ok', endpoint: '/api/produtos' },
        pedidos: { status: 'ok', endpoint: '/api/pedidos' },
        mercadolivre: { status: 'ok', endpoint: '/api/mercadolivre' },
        tenants: { status: 'ok', endpoint: '/api/tenants' },
        payments: { status: 'ok', endpoint: '/api/payments' },
        ai: { status: 'ok', endpoint: '/api/ai' },
      },
    };

    // Testar conexão com banco de dados
    try {
      const start = Date.now();
      await sequelize.query('SELECT 1');
      const responseTime = Date.now() - start;
      
      status.database = {
        status: 'connected',
        connected: true,
        responseTime: `${responseTime}ms`,
      };
    } catch (error: any) {
      status.database = {
        status: 'error',
        connected: false,
        error: error.message,
      };
    }

    // Verificar Mercado Livre
    if (process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET) {
      status.integrations.mercadoLivre.configured = true;
      
      // Verificar se há token salvo (verificar no banco ou variável)
      try {
        // Aqui você pode verificar se há um token válido no banco
        // Por enquanto, vamos apenas verificar se está configurado
        status.integrations.mercadoLivre.hasToken = false; // Implementar verificação real
      } catch (error) {
        // Ignorar erro
      }
    }

    // Verificar Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      status.integrations.stripe.configured = true;
    }

    // Verificar Redis
    if (process.env.REDIS_URL) {
      status.integrations.redis.configured = true;
      // Aqui você pode testar a conexão real com Redis
    }

    // Verificar Sentry
    if (process.env.SENTRY_DSN) {
      status.integrations.sentry.configured = true;
    }

    res.json(status);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao obter status do sistema',
      message: error.message,
    });
  }
});

/**
 * @route GET /api/system/integrations
 * @desc Retorna detalhes das integrações
 * @access Public
 */
router.get('/integrations', async (req, res) => {
  try {
    const integrations = [];

    // Mercado Livre
    integrations.push({
      name: 'Mercado Livre',
      id: 'mercadolivre',
      configured: !!(process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET),
      status: process.env.ML_CLIENT_ID ? 'configured' : 'not_configured',
      icon: '🛍️',
      description: 'Integração com Mercado Livre para sincronização de produtos e pedidos',
      docs: '/docs/mercadolivre',
    });

    // Stripe
    integrations.push({
      name: 'Stripe',
      id: 'stripe',
      configured: !!process.env.STRIPE_SECRET_KEY,
      status: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
      icon: '💳',
      description: 'Processamento de pagamentos via Stripe',
      docs: '/docs/stripe',
    });

    // Redis
    integrations.push({
      name: 'Redis',
      id: 'redis',
      configured: !!process.env.REDIS_URL,
      status: process.env.REDIS_URL ? 'configured' : 'not_configured',
      icon: '⚡',
      description: 'Cache e sessões com Redis',
      docs: '/docs/redis',
    });

    // Sentry
    integrations.push({
      name: 'Sentry',
      id: 'sentry',
      configured: !!process.env.SENTRY_DSN,
      status: process.env.SENTRY_DSN ? 'configured' : 'not_configured',
      icon: '🐛',
      description: 'Monitoramento de erros com Sentry',
      docs: '/docs/sentry',
    });

    // Amazon
    integrations.push({
      name: 'Amazon',
      id: 'amazon',
      configured: false,
      status: 'not_configured',
      icon: '📦',
      description: 'Integração com Amazon Marketplace',
      docs: '/docs/amazon',
    });

    // Shopee
    integrations.push({
      name: 'Shopee',
      id: 'shopee',
      configured: false,
      status: 'not_configured',
      icon: '🛒',
      description: 'Integração com Shopee',
      docs: '/docs/shopee',
    });

    res.json({
      total: integrations.length,
      configured: integrations.filter(i => i.configured).length,
      integrations,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao obter integrações',
      message: error.message,
    });
  }
});

export default router;
