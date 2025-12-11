import { BaseConnector } from '../core/BaseConnector';
import {
  IConnectorConfig,
  IProduct,
  IOrder,
  ISyncResult
} from '../core/IConnector';
import axios, { AxiosInstance } from 'axios';

/**
 * Conector para Amazon SP-API (Selling Partner API)
 * Documentação: https://developer-docs.amazon.com/sp-api/
 */
export class AmazonConnector extends BaseConnector {
  public readonly name = 'Amazon SP-API';
  public readonly version = '1.0.0';

  private apiClient: AxiosInstance | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private config: IConnectorConfig | null = null;

  /**
   * Conectar à Amazon SP-API
   */
  public async connect(config: IConnectorConfig): Promise<boolean> {
    try {
      this.config = config;
      const { credentials } = config;

      // Validar credenciais necessárias
      const required = [
        'clientId',
        'clientSecret',
        'refreshToken',
        'awsAccessKey',
        'awsSecretKey',
        'region',
        'marketplaceId',
        'sellerId'
      ];

      for (const field of required) {
        if (!credentials[field]) {
          throw new Error(`Campo obrigatório faltando: ${field}`);
        }
      }

      this.refreshToken = credentials.refreshToken;

      // Obter access token
      await this.refreshAccessToken(credentials);

      // Configurar cliente API
      this.apiClient = axios.create({
        baseURL: `https://sellingpartnerapi-na.amazon.com`,
        headers: {
          'Content-Type': 'application/json',
          'x-amz-access-token': this.accessToken
        }
      });

      this.connected = true;
      console.log(`[${this.name}] Conectado com sucesso`);
      return true;
    } catch (error: any) {
      console.error(`[${this.name}] Erro ao conectar:`, error.message);
      this.connected = false;
      return false;
    }
  }

  /**
   * Renovar access token usando refresh token
   */
  private async refreshAccessToken(credentials: Record<string, string>): Promise<void> {
    try {
      const response = await axios.post('https://api.amazon.com/auth/o2/token', {
        grant_type: 'refresh_token',
        refresh_token: credentials.refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret
      });

      this.accessToken = response.data.access_token;
      console.log(`[${this.name}] Access token renovado`);
    } catch (error: any) {
      throw new Error(`Falha ao renovar access token: ${error.message}`);
    }
  }

  /**
   * Sincronizar produtos da Amazon para o Markthub
   */
  public async syncProductsFromExternal(): Promise<ISyncResult> {
    const result: ISyncResult = {
      success: false,
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      errors: []
    };

    if (!this.apiClient || !this.config) {
      result.errors.push('Não conectado');
      return result;
    }

    try {
      // Buscar produtos via Catalog Items API
      const response = await this.apiClient.get('/catalog/2022-04-01/items', {
        params: {
          marketplaceIds: this.config.credentials.marketplaceId,
          sellerId: this.config.credentials.sellerId
        }
      });

      const items = response.data.items || [];
      result.itemsProcessed = items.length;

      // Processar cada produto
      for (const item of items) {
        try {
          const product: IProduct = {
            externalId: item.asin,
            name: item.summaries?.[0]?.itemName || 'Sem nome',
            sku: item.identifiers?.sku || item.asin,
            price: item.summaries?.[0]?.mainImage?.link || 0,
            stock: 0, // Requer chamada separada para inventory
            description: item.summaries?.[0]?.description || '',
            category: item.summaries?.[0]?.productType || '',
            images: item.images?.map((img: any) => img.link) || []
          };

          // Aqui você salvaria no banco de dados do Markthub
          // await saveProductToDatabase(this.config.tenantId, product);
          
          result.itemsCreated++;
        } catch (error: any) {
          result.errors.push(`Erro ao processar ${item.asin}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      this.updateLastSync(result.success ? 'success' : 'error');
      
      return result;
    } catch (error: any) {
      result.errors.push(`Erro na API: ${error.message}`);
      this.updateLastSync('error', error.message);
      return result;
    }
  }

  /**
   * Sincronizar produtos do Markthub para a Amazon
   */
  public async syncProductsToExternal(products: IProduct[]): Promise<ISyncResult> {
    const result: ISyncResult = {
      success: false,
      itemsProcessed: products.length,
      itemsCreated: 0,
      itemsUpdated: 0,
      errors: []
    };

    if (!this.apiClient) {
      result.errors.push('Não conectado');
      return result;
    }

    try {
      for (const product of products) {
        try {
          // Criar/atualizar produto via Listings Items API
          await this.apiClient.put(
            `/listings/2021-08-01/items/${this.config?.credentials.sellerId}/${product.sku}`,
            {
              productType: product.category || 'PRODUCT',
              requirements: 'LISTING',
              attributes: {
                condition_type: [{ value: 'new_new' }],
                item_name: [{ value: product.name }],
                description: [{ value: product.description || product.name }],
                list_price: [{ value: product.price, currency: 'USD' }],
                quantity: [{ value: product.stock }]
              }
            },
            {
              params: {
                marketplaceIds: this.config?.credentials.marketplaceId
              }
            }
          );

          result.itemsUpdated++;
        } catch (error: any) {
          result.errors.push(`Erro ao sincronizar ${product.sku}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      this.updateLastSync(result.success ? 'success' : 'error');
      
      return result;
    } catch (error: any) {
      result.errors.push(`Erro geral: ${error.message}`);
      this.updateLastSync('error', error.message);
      return result;
    }
  }

  /**
   * Sincronizar pedidos da Amazon para o Markthub
   */
  public async syncOrdersFromExternal(): Promise<ISyncResult> {
    const result: ISyncResult = {
      success: false,
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      errors: []
    };

    if (!this.apiClient || !this.config) {
      result.errors.push('Não conectado');
      return result;
    }

    try {
      // Buscar pedidos dos últimos 7 dias
      const createdAfter = new Date();
      createdAfter.setDate(createdAfter.getDate() - 7);

      const response = await this.apiClient.get('/orders/v0/orders', {
        params: {
          MarketplaceIds: this.config.credentials.marketplaceId,
          CreatedAfter: createdAfter.toISOString()
        }
      });

      const orders = response.data.payload?.Orders || [];
      result.itemsProcessed = orders.length;

      for (const amazonOrder of orders) {
        try {
          // Buscar itens do pedido
          const itemsResponse = await this.apiClient.get(
            `/orders/v0/orders/${amazonOrder.AmazonOrderId}/orderItems`
          );

          const items = itemsResponse.data.payload?.OrderItems || [];

          const order: IOrder = {
            externalId: amazonOrder.AmazonOrderId,
            customerId: amazonOrder.BuyerInfo?.BuyerEmail || 'unknown',
            customerName: amazonOrder.BuyerInfo?.BuyerName || 'Cliente Amazon',
            customerEmail: amazonOrder.BuyerInfo?.BuyerEmail,
            items: items.map((item: any) => ({
              productId: item.ASIN,
              productName: item.Title,
              quantity: item.QuantityOrdered,
              price: parseFloat(item.ItemPrice?.Amount || '0')
            })),
            total: parseFloat(amazonOrder.OrderTotal?.Amount || '0'),
            status: this.mapAmazonStatus(amazonOrder.OrderStatus),
            createdAt: new Date(amazonOrder.PurchaseDate)
          };

          // Aqui você salvaria no banco de dados do Markthub
          // await saveOrderToDatabase(this.config.tenantId, order);
          
          result.itemsCreated++;
        } catch (error: any) {
          result.errors.push(`Erro ao processar pedido ${amazonOrder.AmazonOrderId}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      this.updateLastSync(result.success ? 'success' : 'error');
      
      return result;
    } catch (error: any) {
      result.errors.push(`Erro na API: ${error.message}`);
      this.updateLastSync('error', error.message);
      return result;
    }
  }

  /**
   * Mapear status da Amazon para status interno
   */
  private mapAmazonStatus(amazonStatus: string): IOrder['status'] {
    const statusMap: Record<string, IOrder['status']> = {
      'Pending': 'pending',
      'Unshipped': 'processing',
      'PartiallyShipped': 'processing',
      'Shipped': 'shipped',
      'Canceled': 'cancelled',
      'Unfulfillable': 'cancelled'
    };

    return statusMap[amazonStatus] || 'pending';
  }

  /**
   * Criar pedido na Amazon (não suportado pela SP-API)
   */
  public async createOrderInExternal(order: IOrder): Promise<string> {
    throw new Error('Criação de pedidos não é suportada pela Amazon SP-API');
  }

  /**
   * Atualizar estoque na Amazon
   */
  public async updateStockInExternal(productId: string, quantity: number): Promise<boolean> {
    if (!this.apiClient || !this.config) {
      return false;
    }

    try {
      await this.apiClient.post('/fba/inventory/v1/items/inventory', {
        sellerSkus: [productId],
        quantity: {
          amount: quantity,
          unit: 'units'
        }
      });

      return true;
    } catch (error: any) {
      console.error(`[${this.name}] Erro ao atualizar estoque:`, error.message);
      return false;
    }
  }
}
