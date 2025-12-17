import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import subscriptionService from '../services/subscription.service';
import { pool } from '../db';

const router = express.Router();

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// =====================================================
// ROTAS PÚBLICAS
// =====================================================

/**
 * GET /api/subscriptions/plans
 * Listar todos os planos disponíveis
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await subscriptionService.getAllPlans();
    
    // Formatar para exibição pública
    const publicPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.display_name,
      description: plan.description,
      priceMonthly: plan.price_monthly,
      priceYearly: plan.price_yearly,
      features: plan.features,
      limits: {
        users: plan.max_users,
        products: plan.max_products,
        ordersPerMonth: plan.max_orders_month,
      },
      modules: {
        taxAutomation: plan.module_tax_automation,
        cashflow: plan.module_cashflow,
        teamManagement: plan.module_team_management,
        predictiveAnalytics: plan.module_predictive_analytics,
        integrations: plan.module_integrations,
        apiAccess: plan.module_api_access,
      },
    }));

    res.json(publicPlans);
  } catch (error: any) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
});

/**
 * GET /api/subscriptions/plans/:name
 * Obter detalhes de um plano específico
 */
router.get('/plans/:name', async (req: Request, res: Response) => {
  try {
    const plan = await subscriptionService.getPlanByName(req.params.name);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    res.json(plan);
  } catch (error: any) {
    console.error('Erro ao buscar plano:', error);
    res.status(500).json({ error: 'Erro ao buscar plano' });
  }
});

// =====================================================
// ROTAS AUTENTICADAS
// =====================================================

/**
 * GET /api/subscriptions/current
 * Obter assinatura atual do tenant
 */
router.get('/current', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant não identificado' });
    }

    const subscription = await subscriptionService.getTenantSubscription(tenantId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Verificar limites atuais
    const [usersLimit, productsLimit, ordersLimit] = await Promise.all([
      subscriptionService.checkPlanLimits(tenantId, 'users'),
      subscriptionService.checkPlanLimits(tenantId, 'products'),
      subscriptionService.checkPlanLimits(tenantId, 'orders'),
    ]);

    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.plan_name,
        planDisplayName: subscription.plan_display_name,
        billingCycle: subscription.billing_cycle,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        trialEnd: subscription.trial_end,
      },
      modules: {
        taxAutomation: subscription.module_tax_automation,
        cashflow: subscription.module_cashflow,
        teamManagement: subscription.module_team_management,
        predictiveAnalytics: subscription.module_predictive_analytics,
        integrations: subscription.module_integrations,
        apiAccess: subscription.module_api_access,
      },
      usage: {
        users: usersLimit,
        products: productsLimit,
        orders: ordersLimit,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
});

/**
 * POST /api/subscriptions/checkout
 * Criar sessão de checkout para upgrade/novo plano
 */
router.post('/checkout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { planName, billingCycle = 'monthly' } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant não identificado' });
    }

    if (!planName) {
      return res.status(400).json({ error: 'Nome do plano é obrigatório' });
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/settings/subscription?success=true`;
    const cancelUrl = `${baseUrl}/settings/subscription?canceled=true`;

    const checkoutUrl = await subscriptionService.createCheckoutSession(
      tenantId,
      planName,
      billingCycle,
      successUrl,
      cancelUrl
    );

    res.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error('Erro ao criar checkout:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar sessão de checkout' });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancelar assinatura
 */
router.post('/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { reason, immediate = false } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant não identificado' });
    }

    await subscriptionService.cancelSubscription(tenantId, reason, immediate);

    res.json({ 
      message: immediate 
        ? 'Assinatura cancelada imediatamente' 
        : 'Assinatura será cancelada ao final do período atual'
    });
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: error.message || 'Erro ao cancelar assinatura' });
  }
});

/**
 * GET /api/subscriptions/invoices
 * Listar faturas do tenant
 */
router.get('/invoices', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { limit = 10, offset = 0 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant não identificado' });
    }

    const result = await pool.query(`
      SELECT * FROM invoices 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [tenantId, limit, offset]);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM invoices WHERE tenant_id = $1',
      [tenantId]
    );

    res.json({
      invoices: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error: any) {
    console.error('Erro ao listar faturas:', error);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
});

/**
 * GET /api/subscriptions/portal
 * Obter URL do portal de billing do Stripe
 */
router.get('/portal', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant não identificado' });
    }

    const subscription = await subscriptionService.getTenantSubscription(tenantId);
    
    if (!subscription?.stripe_customer_id) {
      return res.status(400).json({ error: 'Cliente Stripe não configurado' });
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/settings/subscription`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar portal:', error);
    res.status(500).json({ error: 'Erro ao criar portal de billing' });
  }
});

/**
 * POST /api/subscriptions/check-access
 * Verificar se tenant tem acesso a um módulo
 */
router.post('/check-access', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { module } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant não identificado' });
    }

    if (!module) {
      return res.status(400).json({ error: 'Módulo é obrigatório' });
    }

    const hasAccess = await subscriptionService.hasModuleAccess(tenantId, module);

    res.json({ hasAccess });
  } catch (error: any) {
    console.error('Erro ao verificar acesso:', error);
    res.status(500).json({ error: 'Erro ao verificar acesso' });
  }
});

// =====================================================
// WEBHOOK DO STRIPE
// =====================================================

/**
 * POST /api/subscriptions/webhook
 * Webhook para eventos do Stripe
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não configurado');
    return res.status(500).json({ error: 'Webhook não configurado' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Erro na verificação do webhook:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Processar eventos
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await subscriptionService.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription;
        const tenantId = parseInt(deletedSub.metadata.tenant_id || '0');
        if (tenantId) {
          await pool.query(`
            UPDATE subscriptions SET status = 'canceled', canceled_at = NOW()
            WHERE tenant_id = $1
          `, [tenantId]);
        }
        break;

      case 'invoice.payment_succeeded':
        await subscriptionService.handlePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case 'invoice.payment_failed':
        await subscriptionService.handlePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export default router;
