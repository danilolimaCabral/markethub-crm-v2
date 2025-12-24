import Stripe from 'stripe';
import { pool } from '../db';
import format from 'pg-format';

// Inicializar Stripe (apenas se configurado)
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey 
  ? new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

const isStripeConfigured = !!stripeKey;

// Tipos
interface Plan {
  id: number;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  features: Record<string, boolean>;
  max_users: number;
  max_products: number;
  max_orders_month: number;
}

interface Subscription {
  id: number;
  tenant_id: number;
  plan_id: number;
  status: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  billing_cycle: string;
  current_period_start?: Date;
  current_period_end?: Date;
}

interface CreateSubscriptionParams {
  tenantId: number;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  email: string;
  cnpj: string;
  companyName: string;
}

// =====================================================
// FUNÇÕES DE PLANOS
// =====================================================

/**
 * Obter todos os planos ativos
 */
export async function getAllPlans(): Promise<Plan[]> {
  const result = await pool.query(`
    SELECT * FROM plans 
    WHERE is_active = true 
    ORDER BY sort_order ASC
  `);
  return result.rows;
}

/**
 * Obter plano por ID
 */
export async function getPlanById(planId: number): Promise<Plan | null> {
  const result = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
  return result.rows[0] || null;
}

/**
 * Obter plano por nome
 */
export async function getPlanByName(name: string): Promise<Plan | null> {
  const result = await pool.query('SELECT * FROM plans WHERE name = $1', [name]);
  return result.rows[0] || null;
}

// =====================================================
// FUNÇÕES DE ASSINATURA
// =====================================================

/**
 * Criar assinatura inicial (trial) para um novo tenant
 */
export async function createTrialSubscription(tenantId: number): Promise<Subscription> {
  // Obter plano gratuito/trial
  const freePlan = await getPlanByName('free');
  if (!freePlan) {
    throw new Error('Plano gratuito não encontrado');
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14); // 14 dias de trial

  const result = await pool.query(`
    INSERT INTO subscriptions (
      tenant_id, plan_id, status, trial_start, trial_end,
      current_period_start, current_period_end, billing_cycle
    ) VALUES ($1, $2, 'trialing', NOW(), $3, NOW(), $3, 'monthly')
    RETURNING *
  `, [tenantId, freePlan.id, trialEnd]);

  // Registrar no histórico
  await pool.query(`
    INSERT INTO subscription_history (subscription_id, tenant_id, action, to_plan_id, reason)
    VALUES ($1, $2, 'created', $3, 'Início do período de trial')
  `, [result.rows[0].id, tenantId, freePlan.id]);

  return result.rows[0];
}

/**
 * Obter assinatura do tenant
 */
export async function getTenantSubscription(tenantId: number): Promise<Subscription | null> {
  const result = await pool.query(`
    SELECT s.*, p.name as plan_name, p.display_name as plan_display_name,
           p.features, p.max_users, p.max_products, p.max_orders_month,
           p.module_tax_automation, p.module_cashflow, p.module_team_management,
           p.module_predictive_analytics, p.module_integrations, p.module_api_access
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.tenant_id = $1
  `, [tenantId]);
  return result.rows[0] || null;
}

/**
 * Criar cliente no Stripe
 */
export async function createStripeCustomer(
  tenantId: number,
  email: string,
  companyName: string,
  cnpj: string
): Promise<string> {
  if (!isStripeConfigured || !stripe) {
    throw new Error('Stripe não configurado');
  }
  
  const customer = await stripe.customers.create({
    email,
    name: companyName,
    metadata: {
      tenant_id: tenantId.toString(),
      cnpj,
    },
  });

  // Atualizar assinatura com o customer ID
  await pool.query(`
    UPDATE subscriptions SET stripe_customer_id = $1 WHERE tenant_id = $2
  `, [customer.id, tenantId]);

  return customer.id;
}

/**
 * Criar sessão de checkout do Stripe
 */
export async function createCheckoutSession(
  tenantId: number,
  planName: string,
  billingCycle: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!isStripeConfigured || !stripe) {
    throw new Error('Stripe não configurado');
  }
  
  const subscription = await getTenantSubscription(tenantId);
  if (!subscription) {
    throw new Error('Assinatura não encontrada');
  }

  const plan = await getPlanByName(planName);
  if (!plan) {
    throw new Error('Plano não encontrado');
  }

  // Obter ou criar customer ID
  let customerId = subscription.stripe_customer_id;
  if (!customerId) {
    // Buscar dados do tenant
    const tenantResult = await pool.query(
      'SELECT email_contato, nome_empresa, cnpj FROM tenants WHERE id = $1',
      [tenantId]
    );
    const tenant = tenantResult.rows[0];
    
    customerId = await createStripeCustomer(
      tenantId,
      tenant.email_contato,
      tenant.nome_empresa,
      tenant.cnpj
    );
  }

  // Selecionar o price ID correto
  const priceId = billingCycle === 'yearly' 
    ? plan.stripe_price_id_yearly 
    : plan.stripe_price_id_monthly;

  if (!priceId) {
    throw new Error('Preço do Stripe não configurado para este plano');
  }

  // Criar sessão de checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card', 'boleto'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      tenant_id: tenantId.toString(),
      plan_name: planName,
      billing_cycle: billingCycle,
    },
    subscription_data: {
      metadata: {
        tenant_id: tenantId.toString(),
      },
    },
    locale: 'pt-BR',
    allow_promotion_codes: true,
  });

  return session.url || '';
}

/**
 * Processar webhook de assinatura criada/atualizada
 */
export async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const tenantId = parseInt(stripeSubscription.metadata.tenant_id || '0');
  if (!tenantId) {
    console.error('Tenant ID não encontrado nos metadados da assinatura');
    return;
  }

  // Mapear status do Stripe para nosso status
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    trialing: 'trialing',
    incomplete: 'pending',
    incomplete_expired: 'canceled',
    paused: 'paused',
  };

  const status = statusMap[stripeSubscription.status] || 'pending';

  // Buscar plano pelo price ID
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const planResult = await pool.query(`
    SELECT id FROM plans 
    WHERE stripe_price_id_monthly = $1 OR stripe_price_id_yearly = $1
  `, [priceId]);

  const planId = planResult.rows[0]?.id;

  // Atualizar assinatura
  await pool.query(`
    UPDATE subscriptions SET
      status = $1,
      stripe_subscription_id = $2,
      plan_id = COALESCE($3, plan_id),
      current_period_start = $4,
      current_period_end = $5,
      updated_at = NOW()
    WHERE tenant_id = $6
  `, [
    status,
    stripeSubscription.id,
    planId,
    new Date(stripeSubscription.current_period_start * 1000),
    new Date(stripeSubscription.current_period_end * 1000),
    tenantId,
  ]);

  // Atualizar status do tenant
  const tenantStatus = status === 'active' ? 'active' : 
                       status === 'trialing' ? 'trial' : 
                       status === 'canceled' ? 'suspended' : 'pending';
  
  await pool.query(`
    UPDATE tenants SET status = $1, atualizado_em = NOW() WHERE id = $2
  `, [tenantStatus, tenantId]);

  // Registrar no histórico
  await pool.query(`
    INSERT INTO subscription_history (subscription_id, tenant_id, action, to_plan_id, metadata)
    SELECT id, tenant_id, 'updated', $1, $2
    FROM subscriptions WHERE tenant_id = $3
  `, [planId, JSON.stringify({ stripe_status: stripeSubscription.status }), tenantId]);
}

/**
 * Processar webhook de pagamento bem-sucedido
 */
export async function handlePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;
  
  // Buscar tenant pelo customer ID
  const subResult = await pool.query(`
    SELECT tenant_id FROM subscriptions WHERE stripe_customer_id = $1
  `, [customerId]);

  if (!subResult.rows[0]) return;

  const tenantId = subResult.rows[0].tenant_id;

  // Registrar fatura
  await pool.query(`
    INSERT INTO invoices (
      tenant_id, stripe_invoice_id, invoice_number, amount, currency,
      status, description, paid_at, pdf_url, hosted_invoice_url
    ) VALUES ($1, $2, $3, $4, $5, 'paid', $6, NOW(), $7, $8)
    ON CONFLICT (stripe_invoice_id) DO UPDATE SET
      status = 'paid',
      paid_at = NOW(),
      updated_at = NOW()
  `, [
    tenantId,
    invoice.id,
    invoice.number,
    (invoice.amount_paid || 0) / 100,
    invoice.currency?.toUpperCase() || 'BRL',
    invoice.description || 'Assinatura Smart Biz360',
    invoice.invoice_pdf,
    invoice.hosted_invoice_url,
  ]);
}

/**
 * Processar webhook de pagamento falhou
 */
export async function handlePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;
  
  const subResult = await pool.query(`
    SELECT tenant_id, id FROM subscriptions WHERE stripe_customer_id = $1
  `, [customerId]);

  if (!subResult.rows[0]) return;

  const { tenant_id: tenantId, id: subscriptionId } = subResult.rows[0];

  // Atualizar status
  await pool.query(`
    UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
    WHERE tenant_id = $1
  `, [tenantId]);

  // Registrar no histórico
  await pool.query(`
    INSERT INTO subscription_history (subscription_id, tenant_id, action, reason)
    VALUES ($1, $2, 'payment_failed', 'Falha no pagamento da fatura')
  `, [subscriptionId, tenantId]);
}

/**
 * Cancelar assinatura
 */
export async function cancelSubscription(
  tenantId: number,
  reason?: string,
  immediate: boolean = false
): Promise<void> {
  if (!isStripeConfigured || !stripe) {
    throw new Error('Stripe não configurado');
  }
  
  const subscription = await getTenantSubscription(tenantId);
  if (!subscription || !subscription.stripe_subscription_id) {
    throw new Error('Assinatura não encontrada');
  }

  // Cancelar no Stripe
  if (immediate) {
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
  } else {
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  }

  // Atualizar local
  await pool.query(`
    UPDATE subscriptions SET
      status = $1,
      canceled_at = NOW(),
      updated_at = NOW()
    WHERE tenant_id = $2
  `, [immediate ? 'canceled' : 'active', tenantId]);

  // Registrar no histórico
  await pool.query(`
    INSERT INTO subscription_history (subscription_id, tenant_id, action, reason)
    SELECT id, tenant_id, 'canceled', $1
    FROM subscriptions WHERE tenant_id = $2
  `, [reason || 'Cancelamento solicitado pelo cliente', tenantId]);
}

/**
 * Verificar se tenant tem acesso a um módulo
 */
export async function hasModuleAccess(
  tenantId: number,
  moduleName: string
): Promise<boolean> {
  const subscription = await getTenantSubscription(tenantId);
  if (!subscription) return false;

  // Verificar status da assinatura
  if (!['active', 'trialing'].includes(subscription.status)) {
    return false;
  }

  // Verificar módulo específico
  const moduleKey = `module_${moduleName}` as keyof typeof subscription;
  return subscription[moduleKey] === true;
}

/**
 * Verificar limites do plano
 */
export async function checkPlanLimits(
  tenantId: number,
  metric: 'users' | 'products' | 'orders'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const subscription = await getTenantSubscription(tenantId);
  if (!subscription) {
    return { allowed: false, current: 0, limit: 0 };
  }

  // Obter contagem atual
  let current = 0;
  const limitKey = `max_${metric}` as keyof typeof subscription;
  const limit = subscription[limitKey] as number;

  switch (metric) {
    case 'users':
      const usersResult = await pool.query(
        'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
        [tenantId]
      );
      current = parseInt(usersResult.rows[0].count);
      break;
    case 'products':
      const productsResult = await pool.query(
        'SELECT COUNT(*) FROM products WHERE tenant_id = $1',
        [tenantId]
      );
      current = parseInt(productsResult.rows[0].count);
      break;
    case 'orders':
      const ordersResult = await pool.query(
        `SELECT COUNT(*) FROM orders 
         WHERE tenant_id = $1 
         AND criado_em >= DATE_TRUNC('month', CURRENT_DATE)`,
        [tenantId]
      );
      current = parseInt(ordersResult.rows[0].count);
      break;
  }

  // -1 significa ilimitado
  const allowed = limit === -1 || current < limit;

  return { allowed, current, limit };
}

/**
 * Registrar uso
 */
export async function recordUsage(
  tenantId: number,
  metric: string,
  quantity: number = 1
): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await pool.query(`
    INSERT INTO usage_records (tenant_id, metric, quantity, period_start, period_end)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (tenant_id, metric, period_start) DO UPDATE SET
      quantity = usage_records.quantity + $3
  `, [tenantId, metric, quantity, periodStart, periodEnd]);
}

export default {
  getAllPlans,
  getPlanById,
  getPlanByName,
  createTrialSubscription,
  getTenantSubscription,
  createStripeCustomer,
  createCheckoutSession,
  handleSubscriptionUpdated,
  handlePaymentSucceeded,
  handlePaymentFailed,
  cancelSubscription,
  hasModuleAccess,
  checkPlanLimits,
  recordUsage,
};
