import axios from 'axios';
import { query } from '../db';
import MercadoLivreOAuthService from './MercadoLivreOAuthService';

const ML_API_BASE = 'https://api.mercadolibre.com';

interface Integration {
  id: number;
  tenant_id: number;
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
  config: {
    ml_user_id?: string;
    ml_nickname?: string;
  };
}

class MercadoLivreOrderService {
  /**
   * Sincroniza pedidos do Mercado Livre para o CRM
   */
  static async syncOrders(
    integration: Integration,
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
      const accessToken = await MercadoLivreOAuthService.ensureValidToken(integration.tenant_id);
      const mlUserId = integration.config?.ml_user_id;

      if (!mlUserId) {
        throw new Error('ML User ID não encontrado na configuração');
      }

      // Busca pedidos do vendedor
      const orders = await this.fetchSellerOrders(accessToken, mlUserId, options);

      for (const orderSummary of orders) {
        try {
          // Busca detalhes completos do pedido
          const orderDetails = await this.fetchOrderDetails(accessToken, orderSummary.id.toString());

          // Verifica se o pedido já existe
          const existingResult = await query(
            'SELECT id FROM ml_orders WHERE ml_order_id = $1',
            [orderDetails.id.toString()]
          );

          if (existingResult.rows.length > 0) {
            // Atualiza pedido existente
            await query(
              `UPDATE ml_orders SET
                status = $1, date_closed = $2, total_amount = $3, paid_amount = $4,
                items = $5, payments = $6, shipping = $7, last_sync_at = NOW(), updated_at = NOW()
               WHERE id = $8`,
              [
                orderDetails.status,
                orderDetails.date_closed ? new Date(orderDetails.date_closed) : null,
                orderDetails.total_amount,
                orderDetails.paid_amount,
                JSON.stringify(orderDetails.order_items),
                JSON.stringify(orderDetails.payments),
                JSON.stringify(orderDetails.shipping),
                existingResult.rows[0].id,
              ]
            );
            updated++;
          } else {
            // Cria novo pedido
            await query(
              `INSERT INTO ml_orders (
                tenant_id, integration_id, order_id, ml_order_id, status, date_created,
                date_closed, total_amount, paid_amount, currency_id, buyer_id, buyer_nickname,
                items, payments, shipping, last_sync_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())`,
              [
                integration.tenant_id,
                integration.id,
                null,
                orderDetails.id.toString(),
                orderDetails.status,
                new Date(orderDetails.date_created),
                orderDetails.date_closed ? new Date(orderDetails.date_closed) : null,
                orderDetails.total_amount,
                orderDetails.paid_amount,
                orderDetails.currency_id,
                orderDetails.buyer.id.toString(),
                orderDetails.buyer.nickname || null,
                JSON.stringify(orderDetails.order_items),
                JSON.stringify(orderDetails.payments),
                JSON.stringify(orderDetails.shipping),
              ]
            );
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
        timeout: 15000,
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
        timeout: 15000,
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
  ): Promise<any[]> {
    let sql = `SELECT * FROM ml_orders WHERE tenant_id = $1 AND integration_id = $2`;
    const params: any[] = [tenantId, integrationId];
    let paramIndex = 3;

    if (filters?.status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      sql += ` AND date_created >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      sql += ` AND date_created <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    sql += ` ORDER BY date_created DESC`;

    const result = await query(sql, params);
    return result.rows;
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
    const result = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'paid') as paid,
        COUNT(*) FILTER (WHERE status IN ('payment_required', 'payment_in_process')) as pending,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) as total_revenue
       FROM ml_orders
       WHERE tenant_id = $1 AND integration_id = $2`,
      [tenantId, integrationId]
    );

    const row = result.rows[0];
    return {
      total: parseInt(row.total) || 0,
      paid: parseInt(row.paid) || 0,
      pending: parseInt(row.pending) || 0,
      cancelled: parseInt(row.cancelled) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
    };
  }
}

export default MercadoLivreOrderService;
