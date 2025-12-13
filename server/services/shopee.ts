/**
 * Serviço de integração com Shopee Open Platform
 * Documentação: https://open.shopee.com/documents
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface ShopeeConfig {
  partnerId: number;
  partnerKey: string;
  shopId: number;
  accessToken?: string;
  refreshToken?: string;
}

interface ProductParams {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  images: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export class ShopeeService {
  private api: AxiosInstance;
  private config: ShopeeConfig;
  private baseUrl: string;

  constructor(config: ShopeeConfig, sandbox: boolean = false) {
    this.config = config;
    this.baseUrl = sandbox 
      ? 'https://partner.test-stable.shopeemobile.com'
      : 'https://partner.shopeemobile.com';
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Gerar assinatura para autenticação
   */
  private generateSign(path: string, timestamp: number, accessToken?: string, shopId?: number): string {
    const baseString = accessToken && shopId
      ? `${this.config.partnerId}${path}${timestamp}${accessToken}${shopId}`
      : `${this.config.partnerId}${path}${timestamp}`;
    
    return crypto
      .createHmac('sha256', this.config.partnerKey)
      .update(baseString)
      .digest('hex');
  }

  /**
   * Fazer requisição autenticada
   */
  private async makeRequest(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) {
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSign(path, timestamp, this.config.accessToken, this.config.shopId);

    const params: any = {
      partner_id: this.config.partnerId,
      timestamp,
      sign,
    };

    if (this.config.accessToken) {
      params.access_token = this.config.accessToken;
    }

    if (this.config.shopId) {
      params.shop_id = this.config.shopId;
    }

    try {
      const response = await this.api.request({
        url: path,
        method,
        params,
        data,
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro na requisição Shopee:', error.response?.data || error.message);
      throw new Error(`Erro Shopee: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Obter URL de autorização OAuth
   */
  getAuthUrl(redirectUrl: string): string {
    const path = '/api/v2/shop/auth_partner';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSign(path, timestamp);

    return `${this.baseUrl}${path}?partner_id=${this.config.partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(redirectUrl)}`;
  }

  /**
   * Obter access token após autorização
   */
  async getAccessToken(code: string, shopId: number): Promise<{ accessToken: string; refreshToken: string }> {
    const path = '/api/v2/auth/token/get';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSign(path, timestamp);

    const response = await this.api.post(path, {
      code,
      shop_id: shopId,
      partner_id: this.config.partnerId,
    }, {
      params: {
        partner_id: this.config.partnerId,
        timestamp,
        sign,
      },
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  }

  /**
   * Renovar access token
   */
  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const path = '/api/v2/auth/access_token/get';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSign(path, timestamp);

    const response = await this.api.post(path, {
      refresh_token: this.config.refreshToken,
      shop_id: this.config.shopId,
      partner_id: this.config.partnerId,
    }, {
      params: {
        partner_id: this.config.partnerId,
        timestamp,
        sign,
      },
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  }

  /**
   * Listar produtos
   */
  async listarProdutos(offset: number = 0, pageSize: number = 50) {
    const path = '/api/v2/product/get_item_list';
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Obter detalhes de um produto
   */
  async obterProduto(itemId: number) {
    const path = '/api/v2/product/get_item_base_info';
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Criar produto
   */
  async criarProduto(params: ProductParams) {
    const path = '/api/v2/product/add_item';
    return await this.makeRequest(path, 'POST', params);
  }

  /**
   * Atualizar estoque
   */
  async atualizarEstoque(itemId: number, stock: number) {
    const path = '/api/v2/product/update_stock';
    return await this.makeRequest(path, 'POST', {
      item_id: itemId,
      stock_list: [{
        model_id: 0,
        normal_stock: stock,
      }],
    });
  }

  /**
   * Listar pedidos
   */
  async listarPedidos(timeFrom: number, timeTo: number, pageSize: number = 50) {
    const path = '/api/v2/order/get_order_list';
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Obter detalhes de um pedido
   */
  async obterPedido(orderSn: string) {
    const path = '/api/v2/order/get_order_detail';
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Testar conexão
   */
  async testarConexao(): Promise<boolean> {
    try {
      const path = '/api/v2/shop/get_shop_info';
      await this.makeRequest(path, 'GET');
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão Shopee:', error);
      return false;
    }
  }
}

export default ShopeeService;
