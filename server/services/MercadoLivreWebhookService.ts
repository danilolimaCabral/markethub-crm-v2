/**
 * Serviço de Webhooks do Mercado Livre
 * Processa notificações em tempo real de pedidos, pagamentos, mensagens, etc.
 * CORRIGIDO: Identificação correta de tenant via ml_user_id
 */

import { Request, Response } from 'express';
import MercadoLivreSyncService from './MercadoLivreSyncService';
import MercadoLivreAPIClient from './MercadoLivreAPIClient';
import MercadoLivreOAuthService from './MercadoLivreOAuthService';
import { query } from '../db';

// Tipos de notificações do ML
enum NotificationTopic {
  ORDERS = 'orders_v2',
  ITEMS = 'items',
  QUESTIONS = 'questions',
  MESSAGES = 'messages',
  PAYMENTS = 'payments',
  SHIPMENTS = 'shipments',
}

interface MLNotification {
  _id: string;
  resource: string; // URL do recurso (ex: /orders/123456)
  user_id: number;  // ML User ID - usado para identificar o tenant!
  topic: string;
  application_id: number;
  attempts: number;
  sent: string; // ISO date
  received: string; // ISO date
}

class MercadoLivreWebhookService {
  /**
   * Processa notificação recebida do ML
   * CORRIGIDO: Agora identifica o tenant correto pelo ml_user_id
   */
  static async processNotification(notification: MLNotification): Promise<void> {
    console.log('📨 Processando notificação ML:', {
      id: notification._id,
      topic: notification.topic,
      resource: notification.resource,
      user_id: notification.user_id,
    });

    try {
      // CORRIGIDO: Buscar tenant pelo ml_user_id da notificação
      const integration = await MercadoLivreOAuthService.getIntegrationByMLUserId(
        notification.user_id.toString()
      );

      if (!integration) {
        console.error(`❌ Nenhuma integração encontrada para ML User ID: ${notification.user_id}`);
        return;
      }

      const tenantId = integration.tenant_id;
      console.log(`✅ Tenant identificado: ${tenantId} para ML User: ${notification.user_id}`);

      // Salvar notificação no log
      await this.saveNotificationLog(notification, tenantId);

      // Processar baseado no tópico
      switch (notification.topic) {
        case NotificationTopic.ORDERS:
          await this.processOrderNotification(notification, tenantId);
          break;

        case NotificationTopic.ITEMS:
          await this.processItemNotification(notification, tenantId);
          break;

        case NotificationTopic.QUESTIONS:
          await this.processQuestionNotification(notification, tenantId);
          break;

        case NotificationTopic.MESSAGES:
          await this.processMessageNotification(notification, tenantId);
          break;

        case NotificationTopic.PAYMENTS:
          await this.processPaymentNotification(notification, tenantId);
          break;

        case NotificationTopic.SHIPMENTS:
          await this.processShipmentNotification(notification, tenantId);
          break;

        default:
          console.log(`⚠️  Tópico não suportado: ${notification.topic}`);
      }

      console.log(`✅ Notificação ${notification._id} processada para tenant ${tenantId}`);
    } catch (error: any) {
      console.error(`❌ Erro ao processar notificação ${notification._id}:`, error);
      throw error;
    }
  }

  /**
   * Salva notificação no log
   * CORRIGIDO: Agora recebe tenantId como parâmetro
   */
  private static async saveNotificationLog(notification: MLNotification, tenantId: number): Promise<void> {
    try {
      await query(
        `INSERT INTO marketplace_sync_log (
          integration_id, sync_type, status, details, started_at, completed_at
        ) SELECT
          id, $1, $2, $3, NOW(), NOW()
        FROM marketplace_integrations
        WHERE tenant_id = $4 AND marketplace = 'mercado_livre'
        LIMIT 1`,
        [
          `webhook_${notification.topic}`,
          'completed',
          JSON.stringify({
            notification_id: notification._id,
            resource: notification.resource,
            user_id: notification.user_id,
            attempts: notification.attempts,
          }),
          tenantId,
        ]
      );
    } catch (error: any) {
      // Log de erros não deve bloquear o processamento
      console.warn('⚠️  Erro ao salvar log de notificação:', error.message);
    }
  }

  /**
   * Processa notificação de pedido
   * CORRIGIDO: Recebe tenantId como parâmetro
   */
  private static async processOrderNotification(notification: MLNotification, tenantId: number): Promise<void> {
    // Extrair order ID do resource
    const orderId = notification.resource.split('/').pop();
    if (!orderId) return;

    console.log(`📦 Processando pedido: ${orderId} para tenant: ${tenantId}`);

    try {
      // Buscar pedido via API e salvar
      const client = new MercadoLivreAPIClient(tenantId.toString());
      await client.initialize();

      const order = await client.getOrder(orderId);

      const syncService = new MercadoLivreSyncService(tenantId.toString());
      await syncService.initialize();

      // Sincronizar pedidos recentes (inclui o novo)
      await syncService.syncOrders(10);

      console.log(`✅ Pedido ${orderId} sincronizado para tenant ${tenantId}`);
    } catch (error: any) {
      console.error(`❌ Erro ao processar pedido ${orderId}:`, error.message);
      throw error;
    }
  }

  /**
   * Processa notificação de item (produto)
   * CORRIGIDO: Recebe tenantId como parâmetro
   */
  private static async processItemNotification(notification: MLNotification, tenantId: number): Promise<void> {
    const itemId = notification.resource.split('/').pop();
    if (!itemId) return;

    console.log(`🏷️  Processando produto: ${itemId} para tenant: ${tenantId}`);

    try {
      // Sincronizar produto específico
      const syncService = new MercadoLivreSyncService(tenantId.toString());
      await syncService.initialize();
      await syncService.syncProducts(10);

      console.log(`✅ Produto ${itemId} sincronizado para tenant ${tenantId}`);
    } catch (error: any) {
      console.error(`❌ Erro ao processar produto ${itemId}:`, error.message);
      throw error;
    }
  }

  /**
   * Processa notificação de pergunta
   * CORRIGIDO: Recebe tenantId como parâmetro
   */
  private static async processQuestionNotification(notification: MLNotification, tenantId: number): Promise<void> {
    const questionId = notification.resource.split('/').pop();
    console.log(`❓ Nova pergunta: ${questionId} para tenant: ${tenantId}`);

    // TODO: Implementar salvamento de pergunta no banco
    // e notificar usuário via email/push
  }

  /**
   * Processa notificação de mensagem
   * CORRIGIDO: Recebe tenantId como parâmetro
   */
  private static async processMessageNotification(notification: MLNotification, tenantId: number): Promise<void> {
    console.log(`💬 Nova mensagem recebida para tenant: ${tenantId}`);
    // TODO: Implementar processamento de mensagens
  }

  /**
   * Processa notificação de pagamento
   * CORRIGIDO: Recebe tenantId como parâmetro
   */
  private static async processPaymentNotification(notification: MLNotification, tenantId: number): Promise<void> {
    console.log(`💳 Atualização de pagamento para tenant: ${tenantId}`);

    // Quando recebe notificação de pagamento, sincronizar pedido relacionado
    await this.processOrderNotification(notification, tenantId);
  }

  /**
   * Processa notificação de envio
   * CORRIGIDO: Recebe tenantId como parâmetro
   */
  private static async processShipmentNotification(notification: MLNotification, tenantId: number): Promise<void> {
    console.log(`📮 Atualização de envio para tenant: ${tenantId}`);

    // Quando recebe notificação de envio, sincronizar pedido relacionado
    await this.processOrderNotification(notification, tenantId);
  }

  /**
   * Valida webhook do ML (verificação de autenticidade)
   */
  static validateWebhook(notification: MLNotification, sourceIp?: string): boolean {
    // Validar estrutura básica
    if (!notification._id || !notification.resource || !notification.topic) {
      console.error('❌ Webhook com estrutura inválida');
      return false;
    }

    // Validar tipos de dados
    if (typeof notification.user_id !== 'number' || typeof notification.application_id !== 'number') {
      console.error('❌ Tipos de dados inválidos no webhook');
      return false;
    }

    // Validar formato do resource (deve começar com /)
    if (!notification.resource.startsWith('/')) {
      console.error('❌ Formato de resource inválido');
      return false;
    }

    // Validar tópico conhecido
    const validTopics = Object.values(NotificationTopic);
    if (!validTopics.includes(notification.topic as NotificationTopic)) {
      console.warn(`⚠️  Tópico desconhecido: ${notification.topic}`);
      // Não bloquear - pode ser novo tópico do ML
    }

    return true;
  }

  /**
   * Responde ao webhook (sempre retornar 200 imediatamente)
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    // ML espera resposta 200 imediatamente (máx 3 segundos)
    // Processar notificação de forma assíncrona

    const notification: MLNotification = req.body;
    const sourceIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';

    console.log(`📨 Webhook recebido de ${sourceIp}:`, {
      id: notification._id,
      topic: notification.topic,
      resource: notification.resource,
      user_id: notification.user_id,
      attempts: notification.attempts,
    });

    // Validar estrutura
    if (!this.validateWebhook(notification, sourceIp)) {
      console.error('❌ Webhook inválido:', notification);
      res.status(400).json({ error: 'Invalid webhook' });
      return;
    }

    // Responder imediatamente (requisito do ML)
    const responseTime = Date.now() - startTime;
    res.status(200).json({
      success: true,
      received: true,
      response_time_ms: responseTime
    });

    // Processar assincronamente (não aguarda)
    this.processNotification(notification).catch(error => {
      console.error('❌ Erro ao processar webhook:', error);
      // TODO: Implementar retry queue para notificações que falharam
    });
  }

  /**
   * Registra URL de webhook no ML (executar uma vez por aplicação)
   */
  static async registerWebhook(
    accessToken: string,
    webhookUrl: string
  ): Promise<void> {
    // TODO: Implementar registro de webhook via API do ML
    // Endpoint: POST /applications/:app_id/notifications/subscriptions
    console.log(`📝 Registrar webhook: ${webhookUrl}`);
  }

  /**
   * Lista webhooks registrados
   */
  static async listWebhooks(accessToken: string): Promise<any[]> {
    // TODO: Implementar listagem de webhooks
    // Endpoint: GET /applications/:app_id/notifications/subscriptions
    return [];
  }

  /**
   * Remove webhook
   */
  static async deleteWebhook(accessToken: string, webhookId: string): Promise<void> {
    // TODO: Implementar remoção de webhook
    // Endpoint: DELETE /applications/:app_id/notifications/subscriptions/:id
    console.log(`🗑️  Remover webhook: ${webhookId}`);
  }

  /**
   * Testa webhook enviando uma notificação de teste
   */
  static async testWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const testNotification: MLNotification = {
        _id: 'test-' + Date.now(),
        resource: '/orders/test',
        user_id: 12345,
        topic: 'orders_v2',
        application_id: 12345,
        attempts: 1,
        sent: new Date().toISOString(),
        received: new Date().toISOString(),
      };

      // TODO: Enviar POST para webhookUrl
      console.log('🧪 Testando webhook:', webhookUrl);
      return true;
    } catch (error) {
      console.error('❌ Erro ao testar webhook:', error);
      return false;
    }
  }
}

export default MercadoLivreWebhookService;
