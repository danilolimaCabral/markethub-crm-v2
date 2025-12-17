import express, { Request, Response } from 'express';
import { pool } from '../db';
import subscriptionService from '../services/subscription.service';

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 * Webhook para processar eventos do Stripe
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Webhook Stripe: Assinatura ou secret não configurados');
    return res.status(400).json({ error: 'Webhook não configurado' });
  }

  let event;

  try {
    // Em produção, verificar assinatura do Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    // Para desenvolvimento, parsear diretamente
    event = JSON.parse(req.body.toString());
  } catch (err: any) {
    console.error('Webhook Stripe: Erro ao verificar assinatura:', err.message);
    return res.status(400).json({ error: 'Assinatura inválida' });
  }

  console.log(`Webhook Stripe recebido: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

/**
 * Processar checkout concluído
 */
async function handleCheckoutCompleted(session: any) {
  const { subscription: stripeSubscriptionId, customer, metadata } = session;
  const tenantId = metadata?.tenant_id;

  if (!tenantId) {
    console.error('Checkout sem tenant_id nos metadata');
    return;
  }

  // Buscar detalhes da assinatura no Stripe
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  // Atualizar assinatura no banco
  await pool.query(`
    UPDATE subscriptions SET
      stripe_subscription_id = $1,
      stripe_customer_id = $2,
      status = 'active',
      updated_at = NOW()
    WHERE tenant_id = $3
  `, [stripeSubscriptionId, customer, tenantId]);

  // Atualizar status do tenant
  await pool.query(`
    UPDATE tenants SET status = 'active', updated_at = NOW()
    WHERE id = $1
  `, [tenantId]);

  console.log(`Checkout concluído para tenant ${tenantId}`);
}

/**
 * Processar fatura paga
 */
async function handleInvoicePaid(invoice: any) {
  const { subscription: stripeSubscriptionId, amount_paid, invoice_pdf, hosted_invoice_url } = invoice;

  // Buscar assinatura pelo stripe_subscription_id
  const subResult = await pool.query(
    'SELECT id, tenant_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [stripeSubscriptionId]
  );

  if (subResult.rows.length === 0) {
    console.error('Assinatura não encontrada:', stripeSubscriptionId);
    return;
  }

  const subscription = subResult.rows[0];

  // Registrar fatura
  await pool.query(`
    INSERT INTO invoices (
      tenant_id, subscription_id, stripe_invoice_id, invoice_number,
      amount, status, pdf_url, hosted_url, created_at
    ) VALUES ($1, $2, $3, $4, $5, 'paid', $6, $7, NOW())
    ON CONFLICT (stripe_invoice_id) DO UPDATE SET
      status = 'paid',
      pdf_url = $6,
      hosted_url = $7,
      updated_at = NOW()
  `, [
    subscription.tenant_id,
    subscription.id,
    invoice.id,
    invoice.number,
    amount_paid / 100, // Converter de centavos
    invoice_pdf,
    hosted_invoice_url
  ]);

  // Atualizar status da assinatura
  await pool.query(`
    UPDATE subscriptions SET status = 'active', updated_at = NOW()
    WHERE id = $1
  `, [subscription.id]);

  console.log(`Fatura paga para tenant ${subscription.tenant_id}`);
}

/**
 * Processar falha no pagamento
 */
async function handleInvoicePaymentFailed(invoice: any) {
  const { subscription: stripeSubscriptionId, attempt_count } = invoice;

  // Buscar assinatura
  const subResult = await pool.query(
    'SELECT id, tenant_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [stripeSubscriptionId]
  );

  if (subResult.rows.length === 0) {
    return;
  }

  const subscription = subResult.rows[0];

  // Atualizar status da assinatura
  await pool.query(`
    UPDATE subscriptions SET 
      status = 'past_due',
      updated_at = NOW()
    WHERE id = $1
  `, [subscription.id]);

  // Atualizar status do tenant se muitas tentativas
  if (attempt_count >= 3) {
    await pool.query(`
      UPDATE tenants SET status = 'suspended', updated_at = NOW()
      WHERE id = $1
    `, [subscription.tenant_id]);
  }

  // TODO: Enviar email de notificação

  console.log(`Falha no pagamento para tenant ${subscription.tenant_id} (tentativa ${attempt_count})`);
}

/**
 * Processar atualização de assinatura
 */
async function handleSubscriptionUpdated(stripeSubscription: any) {
  const { id: stripeSubscriptionId, status, current_period_end, cancel_at_period_end } = stripeSubscription;

  // Buscar assinatura
  const subResult = await pool.query(
    'SELECT id, tenant_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [stripeSubscriptionId]
  );

  if (subResult.rows.length === 0) {
    return;
  }

  const subscription = subResult.rows[0];

  // Mapear status do Stripe para nosso sistema
  let localStatus = status;
  if (status === 'active' && cancel_at_period_end) {
    localStatus = 'canceling';
  }

  // Atualizar assinatura
  await pool.query(`
    UPDATE subscriptions SET
      status = $1,
      current_period_end = to_timestamp($2),
      cancel_at_period_end = $3,
      updated_at = NOW()
    WHERE id = $4
  `, [localStatus, current_period_end, cancel_at_period_end, subscription.id]);

  console.log(`Assinatura atualizada para tenant ${subscription.tenant_id}: ${localStatus}`);
}

/**
 * Processar cancelamento de assinatura
 */
async function handleSubscriptionDeleted(stripeSubscription: any) {
  const { id: stripeSubscriptionId } = stripeSubscription;

  // Buscar assinatura
  const subResult = await pool.query(
    'SELECT id, tenant_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [stripeSubscriptionId]
  );

  if (subResult.rows.length === 0) {
    return;
  }

  const subscription = subResult.rows[0];

  // Atualizar assinatura
  await pool.query(`
    UPDATE subscriptions SET
      status = 'canceled',
      canceled_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
  `, [subscription.id]);

  // Fazer downgrade do tenant para plano free
  await subscriptionService.downgradeToFree(subscription.tenant_id);

  console.log(`Assinatura cancelada para tenant ${subscription.tenant_id}`);
}

export default router;
