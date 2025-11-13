import axios from 'axios';
import crypto from 'crypto';
import { logInfo, logError } from '../middleware/logger';

const SHOPEE_API_BASE = 'https://partner.shopeemobile.com/api/v2';

interface ShopeeCredentials {
  partnerId: string;
  partnerKey: string;
  shopId: string;
  accessToken?: string;
}

class ShopeeAPIService {
  private credentials: ShopeeCredentials;
  private baseURL: string;

  constructor(credentials: ShopeeCredentials) {
    this.credentials = credentials;
    this.baseURL = SHOPEE_API_BASE;
  }

  /**
   * Cria assinatura para requisição Shopee
   */
  private createSignature(path: string, timestamp: number, params: Record<string, any>): string {
    const baseString = `${this.credentials.partnerId}${path}${timestamp}${this.credentials.accessToken || ''}${JSON.stringify(params)}`;
    return crypto.createHmac('sha256', this.credentials.partnerKey).update(baseString).digest('hex');
  }

  /**
   * Faz requisição autenticada para Shopee API
   */
  private async makeRequest(
    path: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.createSignature(path, timestamp, params);

      const requestParams = {
        partner_id: parseInt(this.credentials.partnerId),
        shop_id: parseInt(this.credentials.shopId),
        timestamp,
        ...params,
      };

      const response = await axios.post(
        `${this.baseURL}${path}`,
        requestParams,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            partner_id: this.credentials.partnerId,
            shop_id: this.credentials.shopId,
            timestamp,
            sign: signature,
          },
        }
      );

      if (response.data.error) {
        throw new Error(response.data.message || 'Erro na API Shopee');
      }

      return response.data.response;
    } catch (error: any) {
      logError('Erro na requisição Shopee API', error, { path });
      throw error;
    }
  }

  /**
   * Obtém access token (OAuth)
   */
  async getAccessToken(authCode: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    expire_in: number;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${this.credentials.partnerId}${redirectUri}${timestamp}`;
    const signature = crypto.createHmac('sha256', this.credentials.partnerKey).update(baseString).digest('hex');

    try {
      const response = await axios.post(
        `${this.baseURL}/auth/token/get`,
        {
          partner_id: parseInt(this.credentials.partnerId),
          code: authCode,
          shop_id: parseInt(this.credentials.shopId),
        },
        {
          params: {
            partner_id: this.credentials.partnerId,
            timestamp,
            sign: signature,
          },
        }
      );

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      this.credentials.accessToken = response.data.response.access_token;

      return {
        access_token: response.data.response.access_token,
        refresh_token: response.data.response.refresh_token,
        expire_in: response.data.response.expire_in,
      };
    } catch (error: any) {
      logError('Erro ao obter access token Shopee', error);
      throw error;
    }
  }

  /**
   * Renova access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expire_in: number;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${this.credentials.partnerId}${refreshToken}${timestamp}`;
    const signature = crypto.createHmac('sha256', this.credentials.partnerKey).update(baseString).digest('hex');

    try {
      const response = await axios.post(
        `${this.baseURL}/auth/access_token/get`,
        {
          partner_id: parseInt(this.credentials.partnerId),
          refresh_token: refreshToken,
          shop_id: parseInt(this.credentials.shopId),
        },
        {
          params: {
            partner_id: this.credentials.partnerId,
            timestamp,
            sign: signature,
          },
        }
      );

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      this.credentials.accessToken = response.data.response.access_token;

      return {
        access_token: response.data.response.access_token,
        refresh_token: response.data.response.refresh_token,
        expire_in: response.data.response.expire_in,
      };
    } catch (error: any) {
      logError('Erro ao renovar token Shopee', error);
      throw error;
    }
  }

  /**
   * Lista pedidos
   */
  async listOrders(options?: {
    timeRangeField?: 'create_time' | 'update_time';
    timeFrom?: Date;
    timeTo?: Date;
    pageSize?: number;
    cursor?: string;
    orderStatus?: string;
  }): Promise<any> {
    const params: Record<string, any> = {};

    if (options?.timeRangeField) {
      params.time_range_field = options.timeRangeField;
    }
    if (options?.timeFrom) {
      params.time_from = Math.floor(options.timeFrom.getTime() / 1000);
    }
    if (options?.timeTo) {
      params.time_to = Math.floor(options.timeTo.getTime() / 1000);
    }
    if (options?.pageSize) {
      params.page_size = options.pageSize;
    }
    if (options?.cursor) {
      params.cursor = options.cursor;
    }
    if (options?.orderStatus) {
      params.order_status = options.orderStatus;
    }

    return await this.makeRequest('/order/get_order_list', params);
  }

  /**
   * Obtém detalhes de um pedido
   */
  async getOrder(orderSn: string): Promise<any> {
    return await this.makeRequest('/order/get_order_detail', {
      order_sn_list: orderSn,
    });
  }

  /**
   * Lista produtos
   */
  async listProducts(options?: {
    pageSize?: number;
    cursor?: string;
    itemStatus?: 'NORMAL' | 'BANNED' | 'DELETED';
  }): Promise<any> {
    const params: Record<string, any> = {};

    if (options?.pageSize) {
      params.page_size = options.pageSize;
    }
    if (options?.cursor) {
      params.cursor = options.cursor;
    }
    if (options?.itemStatus) {
      params.item_status = options.itemStatus;
    }

    return await this.makeRequest('/product/get_item_list', params);
  }

  /**
   * Obtém detalhes de um produto
   */
  async getProduct(itemId: number): Promise<any> {
    return await this.makeRequest('/product/get_item_base_info', {
      item_id_list: [itemId],
    });
  }

  /**
   * Atualiza estoque de um produto
   */
  async updateStock(itemId: number, stockList: Array<{ modelId: number; stock: number }>): Promise<any> {
    return await this.makeRequest('/product/update_stock', {
      item_id: itemId,
      stock_list: stockList,
    });
  }

  /**
   * Atualiza preço de um produto
   */
  async updatePrice(itemId: number, priceList: Array<{ modelId: number; originalPrice: number }>): Promise<any> {
    return await this.makeRequest('/product/update_price', {
      item_id: itemId,
      price_list: priceList,
    });
  }
}

export default ShopeeAPIService;
