/**
 * Tipos TypeScript para Webhooks Asaas
 */

export type AsaasWebhookEvent =
  // Eventos de Assinaturas
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_INACTIVATED'
  | 'SUBSCRIPTION_DELETED'
  // Eventos de Pagamentos
  | 'PAYMENT_CREATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED';

export interface AsaasWebhookPayload {
  id: string;
  event: AsaasWebhookEvent;
  dateCreated: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    netValue: number;
    status: string;
    billingType: string;
    confirmedDate?: string;
    paymentDate?: string;
    creditDate?: string;
    externalReference?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    value: number;
    nextDueDate: string;
    cycle: string;
    status: string;
    billingType: string;
    description?: string;
    externalReference?: string;
  };
}

export interface UserSubscription {
  id: string;
  userId: string;
  email: string;
  plan: 'starter' | 'professional' | 'business' | 'enterprise';
  status: 'trial' | 'active' | 'overdue' | 'cancelled' | 'blocked';
  asaasCustomerId: string;
  asaasSubscriptionId: string;
  trialEndsAt: Date;
  lastPaymentAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanConfig {
  id: string;
  name: string;
  value: number;
  features: string[];
  maxProducts?: number;
  maxOrders?: number;
  maxUsers?: number;
}

export const PLANS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    value: 49.00,
    features: [
      'Até 100 produtos',
      'Até 500 pedidos/mês',
      '1 usuário',
      'Calculadora de taxas ML',
      'Relatórios básicos',
      'Suporte por email',
    ],
    maxProducts: 100,
    maxOrders: 500,
    maxUsers: 1,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    value: 99.00,
    features: [
      'Até 500 produtos',
      'Até 2.000 pedidos/mês',
      '3 usuários',
      'Todas as funcionalidades Starter',
      'Inteligência de Mercado',
      'Alertas automáticos',
      'Suporte prioritário',
    ],
    maxProducts: 500,
    maxOrders: 2000,
    maxUsers: 3,
  },
  business: {
    id: 'business',
    name: 'Business',
    value: 199.00,
    features: [
      'Até 2.000 produtos',
      'Até 10.000 pedidos/mês',
      '10 usuários',
      'Todas as funcionalidades Professional',
      'Módulo de Importação',
      'API de integração',
      'Suporte 24/7',
    ],
    maxProducts: 2000,
    maxOrders: 10000,
    maxUsers: 10,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    value: 399.00,
    features: [
      'Produtos ilimitados',
      'Pedidos ilimitados',
      'Usuários ilimitados',
      'Todas as funcionalidades Business',
      'Gerente de conta dedicado',
      'Customizações personalizadas',
      'SLA garantido',
    ],
  },
};
