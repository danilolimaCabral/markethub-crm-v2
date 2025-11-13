/**
 * Serviço de Webhooks do Mercado Livre
 * Processa notificações em tempo real de pedidos, pagamentos, mensagens, etc.
 */

import { Request, Response } from 'express';
import Mercado

LiveSyncService from './MercadoLivreSyncService';
import MercadoLivreAPIClient from './MercadoLivreAPIClient';
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
  user_id: number;
  topic: string;
  application_id: number;
  attempts: number;
  sent: string; // ISO date
  received: string; // ISO date
}

class MercadoLivreWebhookService {
  /**
   * Processa notificação recebida do ML
   */
  static async processNotification(notification: MLNotification): Promise<void> {
    console.log('📨 Processando notificação ML:', {
      id: notification._id,
      topic: notification.topic,
      resource: notification.resource,
    });

    try {
      // Salvar notificação no log
      await this.saveNotificationLog(notification);

      // Processar baseado no tópico
      switch (notification.topic) {
        case NotificationTopic.ORDERS:
          await this.processOrderNotification(notification);
          break;

        case NotificationTopic.ITEMS:
          await this.processItemNotification(notification);
          break;

        case NotificationTopic.QUESTIONS:
          await this.processQuestionNotification(notification);
          break;

        case NotificationTopic.MESSAGES:
          await this.processMessageNotification(notification);
          break;

        case NotificationTopic.PAYMENTS:
          await this.processPaymentNotification(notification);
          break;

        case NotificationTopic.SHIPMENTS:
          await this.processShipmentNotification(notification);
          break;

        default:
          console.log(`⚠️  Tópico não suportado: ${notification.topic}`);
      }

      console.log(`✅ Notificação ${notification._id} processada`);
    } catch (error: any) {
      console.error(`❌ Erro ao processar notificação ${notification._id}:`, error);
      throw error;
    }
  }

  /**
   * Salva notificação no log
   */
  private static async saveNotificationLog(notification: MLNotification): Promise<void> {
    await query(
      `INSERT INTO marketplace_sync_log (
        integration_id, sync_type, status, details, started_at
      ) SELECT 
        id, $1, $2, $3, NOW()
      FROM marketplace_integrations
      WHERE marketplace = 'mercado_livre' 
      AND access_token IS NOT NULL
      LIMIT 1`,
      [
        `webhook_${notification.topic}`,
        'processing',
        JSON.stringify(notification),
      ]
    );
  }

  /**
   * Processa notificação de pedido
   */
  private static async processOrderNotification(notification: MLNotification): Promise<void> {
    // Extrair order ID do resource
    const orderId = notification.resource.split('/').pop();
    if (!orderId) return;

    console.log(`📦 Processando pedido: ${orderId}`);

    // Buscar tenant pela integração
    const tenantResult = await query(
      `SELECT tenant_id FROM marketplace_integrations 
       WHERE marketplace = 'mercado_livre' AND is_active = true
       LIMIT 1`
    );

    if (tenantResult.rows.length === 0) {
      console.error('❌ Nenhum tenant encontrado com integração ativa');
      return;
    }

    const tenantId = tenantResult.rows[0].tenant_id;

    // Buscar pedido via API e salvar
    const client = new MercadoLivreAPIClient(tenantId);
    await client.initialize();

    const order = await client.getOrder(orderId);
    
    const syncService = new MercadoLivreSyncService(tenantId);
    await syncService.initialize();

    // Usar método privado via reflexão ou criar método público
    // Por agora, vamos fazer sync completo de pedidos
    await syncService.syncOrders(1);

    console.log(`✅ Pedido ${orderId} sincronizado`);
  }

  /**
   * Processa notificação de item (produto)
   */
  private static async processItemNotification(notification: MLNotification): Promise<void> {
    const itemId = notification.resource.split('/').pop();
    if (!itemId) return;

    console.log(`🏷️  Processando produto: ${itemId}`);

    // Buscar tenant
    const tenantResult = await query(
      `SELECT tenant_id FROM marketplace_integrations 
       WHERE marketplace = 'mercado_livre' AND is_active = true
       LIMIT 1`
    );

    if (tenantResult.rows.length === 0) return;

    const tenantId = tenantResult.rows[0].tenant_id;

    // Sincronizar produto específico
    const syncService = new MercadoLivreSyncService(tenantId);
    await syncService.initialize();
    await syncService.syncProducts(1);

    console.log(`✅ Produto ${itemId} sincronizado`);
  }

  /**
   * Processa notificação de pergunta
   */
  private static async processQuestionNotification(notification: MLNotification): Promise<void> {
    const questionId = notification.resource.split('/').pop();
    console.log(`❓ Nova pergunta: ${questionId}`);

    // TODO: Implementar salvamento de pergunta no banco
    // e notificar usuário via email/push
  }

  /**
   * Processa notificação de mensagem
   */
  private static async processMessageNotification(notification: MLNotification): Promise<void> {
    console.log(`💬 Nova mensagem recebida`);
    // TODO: Implementar processamento de mensagens
  }

  /**
   * Processa notificação de pagamento
   */
  private static async processPaymentNotification(notification: MLNotification): Promise<void> {
    console.log(`💳 Atualização de pagamento`);
    
    // Quando recebe notificação de pagamento, sincronizar pedido relacionado
    await this.processOrderNotification(notification);
  }

  /**
   * Processa notificação de envio
   */
  private static async processShipmentNotification(notification: MLNotification): Promise<void> {
    console.log(`📮 Atualização de envio`);
    
    // Quando recebe notificação de envio, sincronizar pedido relacionado
    await this.processOrderNotification(notification);
  }

  /**
   * Valida webhook do ML (verificação de autenticidade)
   */
  static validateWebhook(notification: MLNotification): boolean {
    // ML não envia assinatura, então validamos estrutura
    if (!notification._id || !notification.resource || !notification.topic) {
      return false;
    }

    // Validar que o user_id corresponde a uma integração ativa
    // TODO: Implementar validação mais robusta

    return true;
  }

  /**
   * Responde ao webhook (sempre retornar 200 imediatamente)
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    // ML espera resposta 200 imediatamente (máx 3 segundos)
    // Processar notificação de forma assíncrona
    
    const notification: MLNotification = req.body;

    // Validar estrutura
    if (!this.validateWebhook(notification)) {
      console.error('❌ Webhook inválido:', notification);
      return res.status(400).json({ error: 'Invalid webhook' });
    }

    // Responder imediatamente
    res.status(200).json({ success: true });

    // Processar assincronamente (não aguarda)
    this.processNotification(notification).catch(error => {
      console.error('❌ Erro ao processar webhook:', error);
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
