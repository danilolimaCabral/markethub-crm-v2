import axios from 'axios';
import { query } from '../db';
import MercadoLivreIntegration from '../models/MercadoLivreIntegration';
import MercadoLivreOrderService from './MercadoLivreOrderService';
import MercadoLivreProductService from './MercadoLivreProductService';
import MercadoLivreOAuthService from './MercadoLivreOAuthService';
import { logInfo, logError } from '../middleware/logger';

const ML_API_BASE = 'https://api.mercadolibre.com';

interface WebhookPayload {
  resource: string;
  user_id: number;
  topic: string;
  application_id: number;
  attempts: number;
  sent: string;
  received: string;
}

class MercadoLivreWebhookService {
  /**
   * Processa notificação recebida do Mercado Livre
   */
  static async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      logInfo('Webhook recebido do Mercado Livre', { topic: payload.topic, resource: payload.resource });

      // Busca integração do usuário
      const integration = await MercadoLivreIntegration.findOne({
        where: { mlUserId: payload.user_id.toString(), isActive: true },
      });

      if (!integration) {
        logError('Integração não encontrada para webhook', null, { user_id: payload.user_id });
        return;
      }

      // Processa baseado no tópico
      switch (payload.topic) {
        case 'orders_v2':
          await this.handleOrderWebhook(integration, payload.resource);
          break;
        case 'items':
          await this.handleItemWebhook(integration, payload.resource);
          break;
        case 'questions':
          await this.handleQuestionWebhook(integration, payload.resource);
          break;
        case 'messages':
          await this.handleMessageWebhook(integration, payload.resource);
          break;
        default:
          logInfo('Tópico de webhook não processado', { topic: payload.topic });
      }
    } catch (error: any) {
      logError('Erro ao processar webhook', error, { payload });
      throw error;
    }
  }

  /**
   * Processa webhook de pedidos
   */
  private static async handleOrderWebhook(
    integration: MercadoLivreIntegration,
    resource: string
  ): Promise<void> {
    try {
      // Extrai order ID do resource (ex: /orders/123456789)
      const orderId = resource.split('/').pop();
      if (!orderId) {
        throw new Error('Order ID não encontrado no resource');
      }

      // Busca detalhes do pedido na API do ML
      const accessToken = await MercadoLivreOAuthService.ensureValidToken(integration);
      const orderDetails = await this.fetchOrderDetails(accessToken, orderId);

      // Sincroniza o pedido específico
      const existingOrder = await query(
        'SELECT id FROM ml_orders WHERE ml_order_id = $1 AND tenant_id = $2',
        [orderId, integration.tenantId]
      );

      if (existingOrder.rows.length > 0) {
        // Atualiza pedido existente
        await query(
          `UPDATE ml_orders 
           SET status = $1, total_amount = $2, paid_amount = $3, 
               items = $4, payments = $5, shipping = $6, last_sync_at = NOW()
           WHERE ml_order_id = $7 AND tenant_id = $8`,
          [
            orderDetails.status,
            orderDetails.total_amount,
            orderDetails.paid_amount,
            JSON.stringify(orderDetails.order_items),
            JSON.stringify(orderDetails.payments),
            JSON.stringify(orderDetails.shipping),
            orderId,
            integration.tenantId,
          ]
        );
      } else {
        // Cria novo pedido
        await query(
          `INSERT INTO ml_orders 
           (tenant_id, integration_id, ml_order_id, status, date_created, total_amount, 
            paid_amount, currency_id, buyer_id, items, payments, shipping, last_sync_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [
            integration.tenantId,
            integration.id,
            orderId,
            orderDetails.status,
            new Date(orderDetails.date_created),
            orderDetails.total_amount,
            orderDetails.paid_amount,
            orderDetails.currency_id,
            orderDetails.buyer.id.toString(),
            JSON.stringify(orderDetails.order_items),
            JSON.stringify(orderDetails.payments),
            JSON.stringify(orderDetails.shipping),
          ]
        );
      }

      logInfo('Pedido sincronizado via webhook', { orderId, tenantId: integration.tenantId });
    } catch (error: any) {
      logError('Erro ao processar webhook de pedido', error, { resource });
      throw error;
    }
  }

  /**
   * Processa webhook de produtos
   */
  private static async handleItemWebhook(
    integration: MercadoLivreIntegration,
    resource: string
  ): Promise<void> {
    try {
      const itemId = resource.split('/').pop();
      if (!itemId) {
        throw new Error('Item ID não encontrado no resource');
      }

      // Sincroniza o produto específico
      await MercadoLivreProductService.syncProducts(integration);

      logInfo('Produto sincronizado via webhook', { itemId, tenantId: integration.tenantId });
    } catch (error: any) {
      logError('Erro ao processar webhook de produto', error, { resource });
    }
  }

  /**
   * Processa webhook de perguntas
   */
  private static async handleQuestionWebhook(
    integration: MercadoLivreIntegration,
    resource: string
  ): Promise<void> {
    // TODO: Implementar processamento de perguntas
    logInfo('Webhook de pergunta recebido', { resource, tenantId: integration.tenantId });
  }

  /**
   * Processa webhook de mensagens
   */
  private static async handleMessageWebhook(
    integration: MercadoLivreIntegration,
    resource: string
  ): Promise<void> {
    // TODO: Implementar processamento de mensagens
    logInfo('Webhook de mensagem recebido', { resource, tenantId: integration.tenantId });
  }

  /**
   * Busca detalhes de um pedido
   */
  private static async fetchOrderDetails(accessToken: string, orderId: string): Promise<any> {
    try {
      const response = await axios.get(`${ML_API_BASE}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      logError('Erro ao buscar detalhes do pedido', error, { orderId });
      throw error;
    }
  }

  /**
   * Configura webhook no Mercado Livre
   */
  static async setupWebhook(integration: MercadoLivreIntegration, webhookUrl: string): Promise<void> {
    try {
      const accessToken = await MercadoLivreOAuthService.ensureValidToken(integration);
      const appId = process.env.ML_APP_ID || '';

      // Tópicos a configurar
      const topics = ['orders_v2', 'items', 'questions', 'messages'];

      for (const topic of topics) {
        try {
          await axios.post(
            `${ML_API_BASE}/applications/${appId}/notifications`,
            {
              topic,
              url: webhookUrl,
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          logInfo('Webhook configurado', { topic, webhookUrl, tenantId: integration.tenantId });
        } catch (error: any) {
          logError('Erro ao configurar webhook', error, { topic });
        }
      }
    } catch (error: any) {
      logError('Erro ao configurar webhooks', error);
      throw error;
    }
  }
}

export default MercadoLivreWebhookService;
