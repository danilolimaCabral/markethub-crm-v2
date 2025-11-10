/**
 * Serviço de Gerenciamento de Assinaturas (Local Storage)
 * Gerencia status de assinaturas dos usuários
 */

import { UserSubscription, PLANS } from '@/types/asaas';

const SUBSCRIPTIONS_KEY = 'markethub_subscriptions';
const WEBHOOK_EVENTS_KEY = 'markethub_webhook_events';

class SubscriptionService {
  /**
   * Salvar assinatura no localStorage
   */
  saveSubscription(subscription: UserSubscription): void {
    const subscriptions = this.getAllSubscriptions();
    const index = subscriptions.findIndex(s => s.userId === subscription.userId);
    
    if (index >= 0) {
      subscriptions[index] = subscription;
    } else {
      subscriptions.push(subscription);
    }
    
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  }

  /**
   * Buscar assinatura por userId
   */
  getSubscriptionByUserId(userId: string): UserSubscription | null {
    const subscriptions = this.getAllSubscriptions();
    return subscriptions.find(s => s.userId === userId) || null;
  }

  /**
   * Buscar assinatura por email
   */
  getSubscriptionByEmail(email: string): UserSubscription | null {
    const subscriptions = this.getAllSubscriptions();
    return subscriptions.find(s => s.email === email) || null;
  }

  /**
   * Buscar assinatura por asaasSubscriptionId
   */
  getSubscriptionByAsaasId(asaasSubscriptionId: string): UserSubscription | null {
    const subscriptions = this.getAllSubscriptions();
    return subscriptions.find(s => s.asaasSubscriptionId === asaasSubscriptionId) || null;
  }

  /**
   * Listar todas as assinaturas
   */
  getAllSubscriptions(): UserSubscription[] {
    const data = localStorage.getItem(SUBSCRIPTIONS_KEY);
    if (!data) return [];
    
    try {
      const subscriptions = JSON.parse(data);
      // Converter datas de string para Date
      return subscriptions.map((s: any) => ({
        ...s,
        trialEndsAt: new Date(s.trialEndsAt),
        lastPaymentAt: s.lastPaymentAt ? new Date(s.lastPaymentAt) : undefined,
        cancelledAt: s.cancelledAt ? new Date(s.cancelledAt) : undefined,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Atualizar status da assinatura
   */
  updateSubscriptionStatus(
    userId: string,
    status: UserSubscription['status'],
    additionalData?: Partial<UserSubscription>
  ): void {
    const subscription = this.getSubscriptionByUserId(userId);
    if (!subscription) return;

    subscription.status = status;
    subscription.updatedAt = new Date();
    
    if (additionalData) {
      Object.assign(subscription, additionalData);
    }

    this.saveSubscription(subscription);
  }

  /**
   * Ativar assinatura (após pagamento confirmado)
   */
  activateSubscription(userId: string): void {
    this.updateSubscriptionStatus(userId, 'active', {
      lastPaymentAt: new Date(),
    });
  }

  /**
   * Marcar assinatura como vencida
   */
  markAsOverdue(userId: string): void {
    this.updateSubscriptionStatus(userId, 'overdue');
  }

  /**
   * Bloquear assinatura (após 7 dias de atraso)
   */
  blockSubscription(userId: string): void {
    this.updateSubscriptionStatus(userId, 'blocked');
  }

  /**
   * Cancelar assinatura
   */
  cancelSubscription(userId: string): void {
    this.updateSubscriptionStatus(userId, 'cancelled', {
      cancelledAt: new Date(),
    });
  }

  /**
   * Verificar se trial expirou
   */
  isTrialExpired(subscription: UserSubscription): boolean {
    if (subscription.status !== 'trial') return false;
    return new Date() > subscription.trialEndsAt;
  }

  /**
   * Verificar se assinatura está ativa
   */
  isActive(subscription: UserSubscription): boolean {
    return subscription.status === 'active' || subscription.status === 'trial';
  }

  /**
   * Obter dias restantes de trial
   */
  getTrialDaysRemaining(subscription: UserSubscription): number {
    if (subscription.status !== 'trial') return 0;
    
    const now = new Date();
    const diff = subscription.trialEndsAt.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return Math.max(0, days);
  }

  /**
   * Obter configuração do plano
   */
  getPlanConfig(planId: string) {
    return PLANS[planId] || PLANS.starter;
  }

  /**
   * Verificar se usuário pode acessar funcionalidade
   */
  canAccessFeature(userId: string, feature: string): boolean {
    const subscription = this.getSubscriptionByUserId(userId);
    if (!subscription) return false;
    
    // Bloquear acesso se não estiver ativo
    if (!this.isActive(subscription)) return false;
    
    const plan = this.getPlanConfig(subscription.plan);
    return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
  }

  /**
   * Verificar limites do plano
   */
  checkPlanLimits(userId: string): {
    products: { current: number; max: number | undefined; exceeded: boolean };
    orders: { current: number; max: number | undefined; exceeded: boolean };
    users: { current: number; max: number | undefined; exceeded: boolean };
  } {
    const subscription = this.getSubscriptionByUserId(userId);
    if (!subscription) {
      return {
        products: { current: 0, max: 0, exceeded: true },
        orders: { current: 0, max: 0, exceeded: true },
        users: { current: 0, max: 0, exceeded: true },
      };
    }

    const plan = this.getPlanConfig(subscription.plan);
    
    // Buscar dados reais do localStorage
    const products = JSON.parse(localStorage.getItem('markethub_products') || '[]');
    const orders = JSON.parse(localStorage.getItem('markethub_orders') || '[]');
    const users = JSON.parse(localStorage.getItem('markethub_users') || '[]');

    return {
      products: {
        current: products.length,
        max: plan.maxProducts,
        exceeded: plan.maxProducts ? products.length >= plan.maxProducts : false,
      },
      orders: {
        current: orders.length,
        max: plan.maxOrders,
        exceeded: plan.maxOrders ? orders.length >= plan.maxOrders : false,
      },
      users: {
        current: users.length,
        max: plan.maxUsers,
        exceeded: plan.maxUsers ? users.length >= plan.maxUsers : false,
      },
    };
  }

  /**
   * Salvar evento de webhook (para evitar duplicatas)
   */
  saveWebhookEvent(eventId: string): void {
    const events = this.getWebhookEvents();
    if (!events.includes(eventId)) {
      events.push(eventId);
      localStorage.setItem(WEBHOOK_EVENTS_KEY, JSON.stringify(events));
    }
  }

  /**
   * Verificar se evento já foi processado
   */
  isWebhookEventProcessed(eventId: string): boolean {
    const events = this.getWebhookEvents();
    return events.includes(eventId);
  }

  /**
   * Listar eventos de webhook processados
   */
  private getWebhookEvents(): string[] {
    const data = localStorage.getItem(WEBHOOK_EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Limpar eventos antigos (mais de 30 dias)
   */
  cleanOldWebhookEvents(): void {
    // Implementar lógica de limpeza se necessário
    // Por enquanto, manter todos os eventos
  }
}

// Exportar instância única
export const subscriptionService = new SubscriptionService();
