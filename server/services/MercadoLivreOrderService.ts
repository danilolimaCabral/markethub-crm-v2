import axios from 'axios';
import MercadoLivreIntegration from '../models/MercadoLivreIntegration';
import MLOrder from '../models/MLOrder';
import MercadoLivreOAuthService from './MercadoLivreOAuthService';

const ML_API_BASE = 'https://api.mercadolibre.com';

class MercadoLivreOrderService {
  /**
   * Sincroniza pedidos do Mercado Livre para o CRM
   */
  static async syncOrders(
    integration: MercadoLivreIntegration,
    options?: {
      dateFrom?: Date;
      dateTo?: Date;
      status?: string;
    }
  ): Promise<{
    imported: number;
    updated: number;
    errors: number;
  }> {
    let imported = 0;
    let updated = 0;
    let errors = 0;

    try {
      // Garante que o token está válido
      const accessToken = await MercadoLivreOAuthService.ensureValidToken(integration);

      // Busca pedidos do vendedor
      const orders = await this.fetchSellerOrders(accessToken, integration.mlUserId, options);

      for (const orderSummary of orders) {
        try {
          // Busca detalhes completos do pedido
          const orderDetails = await this.fetchOrderDetails(accessToken, orderSummary.id.toString());

          // Verifica se o pedido já existe
          const existingOrder = await MLOrder.findOne({
            where: { mlOrderId: orderDetails.id.toString() },
          });

          if (existingOrder) {
            // Atualiza pedido existente
            await existingOrder.update({
              status: orderDetails.status,
              dateClosed: orderDetails.date_closed ? new Date(orderDetails.date_closed) : null,
              totalAmount: orderDetails.total_amount,
              paidAmount: orderDetails.paid_amount,
              items: orderDetails.order_items,
              payments: orderDetails.payments,
              shipping: orderDetails.shipping,
              lastSyncAt: new Date(),
            });
            updated++;
          } else {
            // Cria novo pedido
            await MLOrder.create({
              tenantId: integration.tenantId,
              integrationId: integration.id,
              orderId: null,
              mlOrderId: orderDetails.id.toString(),
              status: orderDetails.status,
              dateCreated: new Date(orderDetails.date_created),
              dateClosed: orderDetails.date_closed ? new Date(orderDetails.date_closed) : null,
              totalAmount: orderDetails.total_amount,
              paidAmount: orderDetails.paid_amount,
              currencyId: orderDetails.currency_id,
              buyerId: orderDetails.buyer.id.toString(),
              buyerNickname: orderDetails.buyer.nickname || null,
              items: orderDetails.order_items,
              payments: orderDetails.payments,
              shipping: orderDetails.shipping,
              lastSyncAt: new Date(),
            });
            imported++;
          }
        } catch (error: any) {
          console.error(`Erro ao sincronizar pedido ${orderSummary.id}:`, error.message);
          errors++;
        }
      }

      return { imported, updated, errors };
    } catch (error: any) {
      console.error('Erro ao sincronizar pedidos:', error.message);
      throw error;
    }
  }

  /**
   * Busca lista de pedidos do vendedor
   */
  private static async fetchSellerOrders(
    accessToken: string,
    sellerId: string,
    options?: {
      dateFrom?: Date;
      dateTo?: Date;
      status?: string;
    }
  ): Promise<any[]> {
    try {
      const params: any = {
        seller: sellerId,
        sort: 'date_desc',
        limit: 50,
      };

      if (options?.dateFrom) {
        params['order.date_created.from'] = options.dateFrom.toISOString();
      }

      if (options?.dateTo) {
        params['order.date_created.to'] = options.dateTo.toISOString();
      }

      if (options?.status) {
        params['order.status'] = options.status;
      }

      const response = await axios.get(`${ML_API_BASE}/orders/search`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      });

      return response.data.results || [];
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error.response?.data || error.message);
      throw new Error('Falha ao buscar pedidos do Mercado Livre');
    }
  }

  /**
   * Busca detalhes completos de um pedido
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
      console.error(`Erro ao buscar detalhes do pedido ${orderId}:`, error.response?.data || error.message);
      throw new Error(`Falha ao buscar detalhes do pedido ${orderId}`);
    }
  }

  /**
   * Lista pedidos sincronizados
   */
  static async listOrders(
    tenantId: number,
    integrationId: number,
    filters?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<MLOrder[]> {
    const where: any = { tenantId, integrationId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.dateCreated = {};
      if (filters.dateFrom) {
        where.dateCreated.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.dateCreated.lte = filters.dateTo;
      }
    }

    return await MLOrder.findAll({
      where,
      order: [['dateCreated', 'DESC']],
    });
  }

  /**
   * Obtém estatísticas de pedidos
   */
  static async getOrderStats(tenantId: number, integrationId: number): Promise<{
    total: number;
    paid: number;
    pending: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    const orders = await MLOrder.findAll({
      where: { tenantId, integrationId },
    });

    const stats = {
      total: orders.length,
      paid: orders.filter((o) => o.status === 'paid').length,
      pending: orders.filter((o) => ['payment_required', 'payment_in_process'].includes(o.status)).length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter((o) => o.status === 'paid')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount.toString()), 0),
    };

    return stats;
  }
}

export default MercadoLivreOrderService;
