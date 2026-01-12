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

class MercadoLivreProductService {
  /**
   * Sincroniza produtos do Mercado Livre para o CRM
   */
  static async syncProducts(integration: Integration): Promise<{
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

      // Busca todos os itens ativos do usuário
      const items = await this.fetchUserItems(accessToken, mlUserId);

      for (const item of items) {
        try {
          // Busca detalhes completos do item
          const itemDetails = await this.fetchItemDetails(accessToken, item.id);

          // Verifica se o produto já existe
          const existingResult = await query(
            'SELECT id FROM ml_products WHERE ml_item_id = $1',
            [itemDetails.id]
          );

          if (existingResult.rows.length > 0) {
            // Atualiza produto existente
            await query(
              `UPDATE ml_products SET
                title = $1, price = $2, available_quantity = $3, sold_quantity = $4,
                status = $5, permalink = $6, thumbnail = $7, last_sync_at = NOW(), updated_at = NOW()
               WHERE id = $8`,
              [
                itemDetails.title,
                itemDetails.price,
                itemDetails.available_quantity,
                itemDetails.sold_quantity || 0,
                itemDetails.status,
                itemDetails.permalink,
                itemDetails.thumbnail,
                existingResult.rows[0].id,
              ]
            );
            updated++;
          } else {
            // Cria novo produto
            await query(
              `INSERT INTO ml_products (
                tenant_id, integration_id, product_id, ml_item_id, title, price,
                available_quantity, sold_quantity, status, permalink, thumbnail,
                category_id, listing_type_id, condition, last_sync_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
              [
                integration.tenant_id,
                integration.id,
                null,
                itemDetails.id,
                itemDetails.title,
                itemDetails.price,
                itemDetails.available_quantity,
                itemDetails.sold_quantity || 0,
                itemDetails.status,
                itemDetails.permalink,
                itemDetails.thumbnail,
                itemDetails.category_id,
                itemDetails.listing_type_id,
                itemDetails.condition,
              ]
            );
            imported++;
          }
        } catch (error: any) {
          console.error(`Erro ao sincronizar item ${item.id}:`, error.message);
          errors++;
        }
      }

      // Atualiza data da última sincronização
      await query(
        `UPDATE marketplace_integrations SET last_sync_at = NOW() WHERE id = $1`,
        [integration.id]
      );

      return { imported, updated, errors };
    } catch (error: any) {
      console.error('Erro ao sincronizar produtos:', error.message);
      throw error;
    }
  }

  /**
   * Busca lista de itens do usuário
   */
  private static async fetchUserItems(accessToken: string, userId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${ML_API_BASE}/users/${userId}/items/search`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          status: 'active',
          limit: 50,
        },
        timeout: 15000,
      });

      return response.data.results || [];
    } catch (error: any) {
      console.error('Erro ao buscar itens do usuário:', error.response?.data || error.message);
      throw new Error('Falha ao buscar itens do Mercado Livre');
    }
  }

  /**
   * Busca detalhes completos de um item
   */
  private static async fetchItemDetails(accessToken: string, itemId: string): Promise<any> {
    try {
      const response = await axios.get(`${ML_API_BASE}/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 15000,
      });

      return response.data;
    } catch (error: any) {
      console.error(`Erro ao buscar detalhes do item ${itemId}:`, error.response?.data || error.message);
      throw new Error(`Falha ao buscar detalhes do item ${itemId}`);
    }
  }

  /**
   * Cria um novo produto no Mercado Livre
   */
  static async createProduct(
    integration: Integration,
    productData: {
      title: string;
      category_id: string;
      price: number;
      currency_id: string;
      available_quantity: number;
      buying_mode: string;
      listing_type_id: string;
      condition: 'new' | 'used';
      description?: string;
      pictures?: { source: string }[];
    }
  ): Promise<any> {
    try {
      const accessToken = await MercadoLivreOAuthService.ensureValidToken(integration.tenant_id);

      const response = await axios.post(`${ML_API_BASE}/items`, productData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      // Salva o produto no banco
      await query(
        `INSERT INTO ml_products (
          tenant_id, integration_id, product_id, ml_item_id, title, price,
          available_quantity, sold_quantity, status, permalink, thumbnail,
          category_id, listing_type_id, condition, last_sync_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
        [
          integration.tenant_id,
          integration.id,
          null,
          response.data.id,
          response.data.title,
          response.data.price,
          response.data.available_quantity,
          0,
          response.data.status,
          response.data.permalink,
          response.data.thumbnail,
          response.data.category_id,
          response.data.listing_type_id,
          response.data.condition,
        ]
      );

      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar produto no ML:', error.response?.data || error.message);
      throw new Error('Falha ao criar produto no Mercado Livre');
    }
  }

  /**
   * Atualiza um produto no Mercado Livre
   */
  static async updateProduct(
    integration: Integration,
    itemId: string,
    updateData: {
      price?: number;
      available_quantity?: number;
      status?: 'active' | 'paused' | 'closed';
    }
  ): Promise<any> {
    try {
      const accessToken = await MercadoLivreOAuthService.ensureValidToken(integration.tenant_id);

      const response = await axios.put(`${ML_API_BASE}/items/${itemId}`, updateData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      // Atualiza no banco
      await query(
        `UPDATE ml_products SET
          price = $1, available_quantity = $2, status = $3, last_sync_at = NOW(), updated_at = NOW()
         WHERE ml_item_id = $4`,
        [response.data.price, response.data.available_quantity, response.data.status, itemId]
      );

      return response.data;
    } catch (error: any) {
      console.error(`Erro ao atualizar produto ${itemId}:`, error.response?.data || error.message);
      throw new Error('Falha ao atualizar produto no Mercado Livre');
    }
  }

  /**
   * Lista produtos sincronizados
   */
  static async listProducts(tenantId: number, integrationId: number): Promise<any[]> {
    const result = await query(
      `SELECT * FROM ml_products
       WHERE tenant_id = $1 AND integration_id = $2
       ORDER BY last_sync_at DESC`,
      [tenantId, integrationId]
    );
    return result.rows;
  }
}

export default MercadoLivreProductService;
