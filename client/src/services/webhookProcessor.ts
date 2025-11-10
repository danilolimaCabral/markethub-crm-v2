/**
 * Processador de Webhooks Asaas
 * Processa eventos recebidos da API Asaas
 */

import { AsaasWebhookPayload, AsaasWebhookEvent } from '@/types/asaas';
import { subscriptionService } from './subscriptionService';
import { toast } from 'sonner';

class WebhookProcessor {
  /**
   * Processar webhook recebido
   */
  async processWebhook(payload: AsaasWebhookPayload): Promise<void> {
    // Verificar se evento já foi processado (idempotência)
    if (subscriptionService.isWebhookEventProcessed(payload.id)) {
      console.log('Evento já processado:', payload.id);
      return;
    }

    console.log('Processando webhook:', payload.event, payload);

    // Processar evento baseado no tipo
    switch (payload.event) {
      case 'SUBSCRIPTION_CREATED':
        await this.handleSubscriptionCreated(payload);
        break;
      
      case 'SUBSCRIPTION_UPDATED':
        await this.handleSubscriptionUpdated(payload);
        break;
      
      case 'SUBSCRIPTION_DELETED':
        await this.handleSubscriptionDeleted(payload);
        break;
      
      case 'PAYMENT_RECEIVED':
        await this.handlePaymentReceived(payload);
        break;
      
      case 'PAYMENT_CONFIRMED':
        await this.handlePaymentConfirmed(payload);
        break;
      
      case 'PAYMENT_OVERDUE':
        await this.handlePaymentOverdue(payload);
        break;
      
      case 'PAYMENT_REFUNDED':
        await this.handlePaymentRefunded(payload);
        break;
      
      case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
        await this.handlePaymentRefused(payload);
        break;
      
      default:
        console.log('Evento não tratado:', payload.event);
    }

    // Marcar evento como processado
    subscriptionService.saveWebhookEvent(payload.id);
  }

  /**
   * SUBSCRIPTION_CREATED: Nova assinatura criada
   */
  private async handleSubscriptionCreated(payload: AsaasWebhookPayload): Promise<void> {
    if (!payload.subscription) return;

    const { subscription } = payload;
    const email = subscription.externalReference || '';

    // Buscar assinatura existente
    const existing = subscriptionService.getSubscriptionByEmail(email);
    
    if (existing) {
      console.log('Assinatura já existe para:', email);
      return;
    }

    toast.info('Nova assinatura criada', {
      description: `Aguardando confirmação de pagamento para ${email}`,
    });
  }

  /**
   * SUBSCRIPTION_UPDATED: Assinatura atualizada
   */
  private async handleSubscriptionUpdated(payload: AsaasWebhookPayload): Promise<void> {
    if (!payload.subscription) return;

    const { subscription } = payload;
    const existing = subscriptionService.getSubscriptionByAsaasId(subscription.id);
    
    if (existing) {
      subscriptionService.saveSubscription({
        ...existing,
        updatedAt: new Date(),
      });

      toast.info('Assinatura atualizada', {
        description: `Plano de ${existing.email} foi atualizado`,
      });
    }
  }

  /**
   * SUBSCRIPTION_DELETED: Assinatura cancelada
   */
  private async handleSubscriptionDeleted(payload: AsaasWebhookPayload): Promise<void> {
    if (!payload.subscription) return;

    const { subscription } = payload;
    const existing = subscriptionService.getSubscriptionByAsaasId(subscription.id);
    
    if (existing) {
      subscriptionService.cancelSubscription(existing.userId);

      toast.error('Assinatura cancelada', {
        description: `Acesso de ${existing.email} foi desativado`,
      });

      // Enviar email de cancelamento
      this.sendCancellationEmail(existing.email);
    }
  }

  /**
   * PAYMENT_RECEIVED: Pagamento confirmado - ATIVAR ACESSO
   */
  private async handlePaymentReceived(payload: AsaasWebhookPayload): Promise<void> {
    if (!payload.payment) return;

    const { payment } = payload;
    const email = payment.externalReference || '';
    
    // Buscar assinatura
    const subscription = subscriptionService.getSubscriptionByEmail(email);
    
    if (subscription) {
      // ATIVAR ACESSO AO CRM
      subscriptionService.activateSubscription(subscription.userId);

      toast.success('Pagamento confirmado!', {
        description: `Acesso de ${email} foi ativado`,
      });

      // Enviar email de boas-vindas
      this.sendWelcomeEmail(email);

      // Criar notificação no sistema
      this.createNotification({
        title: 'Novo cliente ativado',
        message: `${email} realizou o pagamento e teve o acesso ativado`,
        type: 'success',
      });
    }
  }

  /**
   * PAYMENT_CONFIRMED: Pagamento confirmado (aguardando repasse)
   */
  private async handlePaymentConfirmed(payload: AsaasWebhookPayload): Promise<void> {
    if (!payload.payment) return;

    const { payment } = payload;
    const email = payment.externalReference || '';

    toast.info('Pagamento confirmado', {
      description: `Pagamento de ${email} foi confirmado. Aguardando compensação.`,
    });
  }

  /**
   * PAYMENT_OVERDUE: Pagamento vencido
   */
  private async handlePaymentOverdue(payload: AsaasWebhookPayload): Promise<void> {
    if (!payload.payment) return;

    const { payment } = payload;
    const email = payment.externalReference || '';
    
    // Buscar assinatura
    const subscription = subscriptionService.getSubscriptionByEmail(email);
    
    if (subscription) {
      // Marcar como vencida
      subscriptionService.markAsOverdue(subscription.userId);

      toast.warning('Pagamento vencido', {
        description: `Cobrança de ${email} está vencida`,
      });

      // Enviar email de lembrete
      this.sendOverdueEmail(email);

      // Criar alerta no sistema
      this.createNotification({
        title: 'Pagamento vencido',
        message: `Cobrança de ${email} está vencida. Acesso será bloqueado em 7 dias.`,
        type: 'warning',
      });

      // Agendar bloqueio após 7 dias (implementar com cron job)
      this.scheduleBlockAfter7Days(subscription.userId);
    }
  }

  /**
   * PAYMENT_REFUNDED: Pagamento estornado
   */
  private async handlePaymentRefunded(payload: AsaasWebhookPayload): Promise<void> {
    if (!payload.payment) return;

    const { payment } = payload;
    const email = payment.externalReference || '';
    
    // Buscar assinatura
    const subscription = subscriptionService.getSubscriptionByEmail(email);
    
    if (subscription) {
      // Cancelar assinatura imediatamente
      subscriptionService.cancelSubscription(subscription.userId);

      toast.error('Pagamento estornado', {
        description: `Pagamento de ${email} foi estornado. Acesso cancelado.`,
      });

      // Enviar email de confirmação de estorno
      this.sendRefundEmail(email);
    }
  }

  /**
   * PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: Falha no cartão
   */
  private async handlePaymentRefused(payload: AsaasWebhookPayload): Promise<void> {
    if (!payload.payment) return;

    const { payment } = payload;
    const email = payment.externalReference || '';

    toast.error('Falha no pagamento', {
      description: `Pagamento de ${email} foi recusado. Cartão inválido.`,
    });

    // Enviar email solicitando atualização do cartão
    this.sendPaymentFailedEmail(email);
  }

  /**
   * Enviar email de boas-vindas
   */
  private sendWelcomeEmail(email: string): void {
    console.log('📧 Enviando email de boas-vindas para:', email);
    // Implementar integração com serviço de email (SendGrid, Mailgun, etc)
  }

  /**
   * Enviar email de cancelamento
   */
  private sendCancellationEmail(email: string): void {
    console.log('📧 Enviando email de cancelamento para:', email);
  }

  /**
   * Enviar email de cobrança vencida
   */
  private sendOverdueEmail(email: string): void {
    console.log('📧 Enviando email de cobrança vencida para:', email);
  }

  /**
   * Enviar email de estorno
   */
  private sendRefundEmail(email: string): void {
    console.log('📧 Enviando email de estorno para:', email);
  }

  /**
   * Enviar email de falha no pagamento
   */
  private sendPaymentFailedEmail(email: string): void {
    console.log('📧 Enviando email de falha no pagamento para:', email);
  }

  /**
   * Criar notificação no sistema
   */
  private createNotification(notification: {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
  }): void {
    const notifications = JSON.parse(localStorage.getItem('markethub_notifications') || '[]');
    
    notifications.unshift({
      id: Date.now().toString(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Manter apenas últimas 100 notificações
    if (notifications.length > 100) {
      notifications.splice(100);
    }

    localStorage.setItem('markethub_notifications', JSON.stringify(notifications));
  }

  /**
   * Agendar bloqueio após 7 dias
   */
  private scheduleBlockAfter7Days(userId: string): void {
    console.log('⏰ Agendando bloqueio para userId:', userId, 'em 7 dias');
    // Implementar com cron job ou serviço de agendamento
    // Por enquanto, apenas log
  }
}

// Exportar instância única
export const webhookProcessor = new WebhookProcessor();
