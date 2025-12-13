/**
 * Serviço de integração com Magalu Marketplace API
 * Documentação: https://developers.magalu.com/
 */

import axios, { AxiosInstance } from 'axios';

interface MagaluConfig {
  clientId: string;
  clientSecret: string;
  sellerId: string;
  accessToken?: string;
  refreshToken?: string;
}

interface ProductParams {
  title: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  categoryId: string;
  brand?: string;
  images: string[];
  attributes?: Record<string, any>;
}

export class MagaluService {
  private api: AxiosInstance;
  private config: MagaluConfig;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: MagaluConfig) {
    this.config = config;
    
    this.api = axios.create({
      baseURL: 'https://api.magazineluiza.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Obter access token
   */
  private async getAccessToken(): Promise<string> {
    // Verificar se token ainda é válido
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://api.magazineluiza.com/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minuto de margem

      return this.accessToken;
    } catch (error: any) {
      console.error('Erro ao obter access token Magalu:', error.response?.data || error.message);
      throw new Error(`Erro ao autenticar: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Fazer requisição autenticada
   */
  private async makeRequest(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.api.request({
        url: path,
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Seller-Id': this.config.sellerId,
        },
        data,
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro na requisição Magalu:', error.response?.data || error.message);
      throw new Error(`Erro Magalu: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Listar produtos
   */
  async listarProdutos(page: number = 1, limit: number = 50) {
    const path = `/marketplace/v1/products`;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return await this.makeRequest(`${path}?${params.toString()}`, 'GET');
  }

  /**
   * Obter detalhes de um produto
   */
  async obterProduto(productId: string) {
    const path = `/marketplace/v1/products/${productId}`;
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Criar produto
   */
  async criarProduto(params: ProductParams) {
    const path = '/marketplace/v1/products';
    return await this.makeRequest(path, 'POST', {
      title: params.title,
      description: params.description,
      price: params.price,
      stock: params.stock,
      sku: params.sku,
      category_id: params.categoryId,
      brand: params.brand,
      images: params.images,
      attributes: params.attributes,
    });
  }

  /**
   * Atualizar produto
   */
  async atualizarProduto(productId: string, params: Partial<ProductParams>) {
    const path = `/marketplace/v1/products/${productId}`;
    return await this.makeRequest(path, 'PUT', params);
  }

  /**
   * Atualizar estoque
   */
  async atualizarEstoque(productId: string, stock: number) {
    const path = `/marketplace/v1/products/${productId}/stock`;
    return await this.makeRequest(path, 'PUT', { stock });
  }

  /**
   * Atualizar preço
   */
  async atualizarPreco(productId: string, price: number) {
    const path = `/marketplace/v1/products/${productId}/price`;
    return await this.makeRequest(path, 'PUT', { price });
  }

  /**
   * Listar pedidos
   */
  async listarPedidos(startDate?: string, endDate?: string, status?: string) {
    const path = '/marketplace/v1/orders';
    const params = new URLSearchParams();

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (status) params.append('status', status);

    return await this.makeRequest(`${path}?${params.toString()}`, 'GET');
  }

  /**
   * Obter detalhes de um pedido
   */
  async obterPedido(orderId: string) {
    const path = `/marketplace/v1/orders/${orderId}`;
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Confirmar pedido
   */
  async confirmarPedido(orderId: string) {
    const path = `/marketplace/v1/orders/${orderId}/confirm`;
    return await this.makeRequest(path, 'POST');
  }

  /**
   * Enviar código de rastreio
   */
  async enviarRastreio(orderId: string, trackingCode: string, carrier: string) {
    const path = `/marketplace/v1/orders/${orderId}/shipping`;
    return await this.makeRequest(path, 'POST', {
      tracking_code: trackingCode,
      carrier,
    });
  }

  /**
   * Listar categorias
   */
  async listarCategorias() {
    const path = '/marketplace/v1/categories';
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Obter atributos de uma categoria
   */
  async obterAtributosCategoria(categoryId: string) {
    const path = `/marketplace/v1/categories/${categoryId}/attributes`;
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Testar conexão
   */
  async testarConexao(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão Magalu:', error);
      return false;
    }
  }
}

export default MagaluService;
