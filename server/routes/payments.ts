import express from 'express';
import stripe, { STRIPE_PLANS } from '../config/stripe';
import { pool } from '../db';

const router = express.Router();

// Middleware para verificar se Stripe está configurado
const checkStripe = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!stripe) {
    return res.status(503).json({ 
      error: 'Serviço de pagamento não configurado',
      code: 'STRIPE_NOT_CONFIGURED'
    });
  }
  next();
};

// Criar sessão de checkout
router.post('/create-checkout-session', checkStripe, async (req, res) => {
  try {
    const { plan, tenantId, email, successUrl, cancelUrl } = req.body;

    if (!plan || !STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]) {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];

    // Criar ou recuperar cliente Stripe
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          tenantId: tenantId || '',
          plan: plan,
        },
      });
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: planConfig.currency,
            product_data: {
              name: `MarkethubCRM - Plano ${planConfig.name}`,
              description: `Assinatura mensal do plano ${planConfig.name}`,
            },
            unit_amount: planConfig.price,
            recurring: {
              interval: planConfig.interval as 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        tenantId: tenantId || '',
        plan: plan,
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({
      error: 'Erro ao criar sessão de checkout',
      details: error.message,
    });
  }
});

// Webhook do Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Erro ao verificar webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Processar evento
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
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

// Obter status da assinatura
router.get('/subscription-status/:tenantId', checkStripe, async (req, res) => {
  try {
    const { tenantId } = req.params;

    const result = await pool.query(
      'SELECT stripe_customer_id, stripe_subscription_id FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const { stripe_subscription_id } = result.rows[0];

    if (!stripe_subscription_id) {
      return res.json({
        status: 'no_subscription',
        message: 'Nenhuma assinatura ativa',
      });
    }

    const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);

    res.json({
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan: subscription.items.data[0]?.price.id,
    });
  } catch (error: any) {
    console.error('Erro ao obter status da assinatura:', error);
    res.status(500).json({
      error: 'Erro ao obter status da assinatura',
      details: error.message,
    });
  }
});

// Cancelar assinatura
router.post('/cancel-subscription/:tenantId', checkStripe, async (req, res) => {
  try {
    const { tenantId } = req.params;

    const result = await pool.query(
      'SELECT stripe_subscription_id FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const { stripe_subscription_id } = result.rows[0];

    if (!stripe_subscription_id) {
      return res.status(400).json({ error: 'Nenhuma assinatura ativa' });
    }

    // Cancelar no final do período
    const subscription = await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    res.json({
      success: true,
      message: 'Assinatura será cancelada no final do período',
      cancelAt: subscription.cancel_at,
    });
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({
      error: 'Erro ao cancelar assinatura',
      details: error.message,
    });
  }
});

// Handlers de eventos do webhook
async function handleCheckoutCompleted(session: any) {
  const tenantId = session.metadata?.tenantId;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (tenantId) {
    await pool.query(
      `UPDATE tenants 
       SET stripe_customer_id = $1, 
           stripe_subscription_id = $2,
           status = 'active',
           atualizado_em = NOW()
       WHERE id = $3`,
      [customerId, subscriptionId, tenantId]
    );

    console.log(`Checkout completado para tenant ${tenantId}`);
  }
}

async function handleSubscriptionCreated(subscription: any) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  await pool.query(
    `UPDATE tenants 
     SET stripe_subscription_id = $1,
         status = 'active',
         atualizado_em = NOW()
     WHERE stripe_customer_id = $2`,
    [subscriptionId, customerId]
  );

  console.log(`Assinatura criada: ${subscriptionId}`);
}

async function handleSubscriptionUpdated(subscription: any) {
  const subscriptionId = subscription.id;
  const status = subscription.status;

  let tenantStatus = 'active';
  if (status === 'canceled' || status === 'unpaid') {
    tenantStatus = 'suspended';
  }

  await pool.query(
    `UPDATE tenants 
     SET status = $1,
         atualizado_em = NOW()
     WHERE stripe_subscription_id = $2`,
    [tenantStatus, subscriptionId]
  );

  console.log(`Assinatura atualizada: ${subscriptionId} - Status: ${status}`);
}

async function handleSubscriptionDeleted(subscription: any) {
  const subscriptionId = subscription.id;

  await pool.query(
    `UPDATE tenants 
     SET status = 'suspended',
         stripe_subscription_id = NULL,
         atualizado_em = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  console.log(`Assinatura deletada: ${subscriptionId}`);
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;
  const amountPaid = invoice.amount_paid;

  // Registrar pagamento no banco
  await pool.query(
    `INSERT INTO payments (tenant_id, amount, status, stripe_invoice_id, created_at)
     SELECT id, $1, 'succeeded', $2, NOW()
     FROM tenants
     WHERE stripe_subscription_id = $3`,
    [amountPaid, invoice.id, subscriptionId]
  );

  console.log(`Pagamento bem-sucedido: ${invoice.id} - R$ ${amountPaid / 100}`);
}

async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;

  await pool.query(
    `UPDATE tenants 
     SET status = 'payment_failed',
         atualizado_em = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  console.log(`Pagamento falhou: ${invoice.id}`);
}

export default router;
