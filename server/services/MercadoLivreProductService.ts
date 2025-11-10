import axios from 'axios';
import MercadoLivreIntegration from '../models/MercadoLivreIntegration';
import MLProduct from '../models/MLProduct';
import MercadoLivreOAuthService from './MercadoLivreOAuthService';

const ML_API_BASE = 'https://api.mercadolibre.com';

class MercadoLivreProductService {
  /**
   * Sincroniza produtos do Mercado Livre para o CRM
   */
  static async syncProducts(integration: MercadoLivreIntegration): Promise<{
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

      // Busca todos os itens ativos do usuário
      const items = await this.fetchUserItems(accessToken, integration.mlUserId);

      for (const item of items) {
        try {
          // Busca detalhes completos do item
          const itemDetails = await this.fetchItemDetails(accessToken, item.id);

          // Verifica se o produto já existe
          const existingProduct = await MLProduct.findOne({
            where: { mlItemId: itemDetails.id },
          });

          if (existingProduct) {
            // Atualiza produto existente
            await existingProduct.update({
              title: itemDetails.title,
              price: itemDetails.price,
              availableQuantity: itemDetails.available_quantity,
              soldQuantity: itemDetails.sold_quantity || 0,
              status: itemDetails.status,
              permalink: itemDetails.permalink,
              thumbnail: itemDetails.thumbnail,
              lastSyncAt: new Date(),
            });
            updated++;
          } else {
            // Cria novo produto
            await MLProduct.create({
              tenantId: integration.tenantId,
              integrationId: integration.id,
              productId: null,
              mlItemId: itemDetails.id,
              title: itemDetails.title,
              price: itemDetails.price,
              availableQuantity: itemDetails.available_quantity,
              soldQuantity: itemDetails.sold_quantity || 0,
              status: itemDetails.status,
              permalink: itemDetails.permalink,
              thumbnail: itemDetails.thumbnail,
              categoryId: itemDetails.category_id,
              listingTypeId: itemDetails.listing_type_id,
              condition: itemDetails.condition,
              lastSyncAt: new Date(),
            });
            imported++;
          }
        } catch (error: any) {
          console.error(`Erro ao sincronizar item ${item.id}:`, error.message);
          errors++;
        }
      }

      // Atualiza data da última sincronização
      await integration.update({ lastSync: new Date() });

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
    integration: MercadoLivreIntegration,
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
      const accessToken = await MercadoLivreOAuthService.ensureValidToken(integration);

      const response = await axios.post(`${ML_API_BASE}/items`, productData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Salva o produto no banco
      await MLProduct.create({
        tenantId: integration.tenantId,
        integrationId: integration.id,
        productId: null,
        mlItemId: response.data.id,
        title: response.data.title,
        price: response.data.price,
        availableQuantity: response.data.available_quantity,
        soldQuantity: 0,
        status: response.data.status,
        permalink: response.data.permalink,
        thumbnail: response.data.thumbnail,
        categoryId: response.data.category_id,
        listingTypeId: response.data.listing_type_id,
        condition: response.data.condition,
        lastSyncAt: new Date(),
      });

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
    integration: MercadoLivreIntegration,
    itemId: string,
    updateData: {
      price?: number;
      available_quantity?: number;
      status?: 'active' | 'paused' | 'closed';
    }
  ): Promise<any> {
    try {
      const accessToken = await MercadoLivreOAuthService.ensureValidToken(integration);

      const response = await axios.put(`${ML_API_BASE}/items/${itemId}`, updateData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Atualiza no banco
      const mlProduct = await MLProduct.findOne({ where: { mlItemId: itemId } });
      if (mlProduct) {
        await mlProduct.update({
          price: response.data.price,
          availableQuantity: response.data.available_quantity,
          status: response.data.status,
          lastSyncAt: new Date(),
        });
      }

      return response.data;
    } catch (error: any) {
      console.error(`Erro ao atualizar produto ${itemId}:`, error.response?.data || error.message);
      throw new Error('Falha ao atualizar produto no Mercado Livre');
    }
  }

  /**
   * Lista produtos sincronizados
   */
  static async listProducts(tenantId: number, integrationId: number): Promise<MLProduct[]> {
    return await MLProduct.findAll({
      where: { tenantId, integrationId },
      order: [['lastSyncAt', 'DESC']],
    });
  }
}

export default MercadoLivreProductService;
