import Stripe from 'stripe';

// Inicializar Stripe com chave secreta (null se não configurado)
const stripeKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeKey 
  ? new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  : null;

export const isStripeConfigured = !!stripeKey;

// Log de aviso se não estiver configurado
if (!isStripeConfigured) {
  console.warn('⚠️  Stripe não configurado. Configure STRIPE_SECRET_KEY no .env para habilitar pagamentos.');
}

// Planos de assinatura
export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    price: 9700, // R$ 97.00 em centavos
    currency: 'brl',
    interval: 'month',
    features: {
      users: 2,
      products: 100,
      orders: 50,
    },
  },
  professional: {
    name: 'Professional',
    price: 29700, // R$ 297.00
    currency: 'brl',
    interval: 'month',
    features: {
      users: 5,
      products: 500,
      orders: 200,
    },
  },
  business: {
    name: 'Business',
    price: 59700, // R$ 597.00
    currency: 'brl',
    interval: 'month',
    features: {
      users: 10,
      products: 2000,
      orders: 1000,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 149700, // R$ 1.497.00
    currency: 'brl',
    interval: 'month',
    features: {
      users: -1, // ilimitado
      products: -1,
      orders: -1,
    },
  },
};

export default stripe;
