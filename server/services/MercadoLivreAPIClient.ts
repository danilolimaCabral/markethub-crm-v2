/**
 * Cliente API do Mercado Livre com gerenciamento automático de tokens,
 * rate limiting e retry logic
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { query } from '../db';

const ML_API_BASE = 'https://api.mercadolibre.com';
const ML_CLIENT_ID = process.env.ML_CLIENT_ID || '';
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET || '';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // timestamp
}

class MercadoLivreAPIClient {
  private axios: AxiosInstance;
  private rateLimitInfo: RateLimitInfo | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.axios = axios.create({
      baseURL: ML_API_BASE,
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token automaticamente
    this.axios.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }

      // Respeitar rate limit
      await this.waitForRateLimit();

      return config;
    });

    // Interceptor para capturar rate limit info
    this.axios.interceptors.response.use(
      (response) => {
        this.updateRateLimitInfo(response.headers);
        return response;
      },
      async (error: AxiosError) => {
        // Se token expirou, tentar renovar e repetir
        if (error.response?.status === 401) {
          await this.refreshAccessTokenInternal();
          // Repetir requisição original
          return this.axios.request(error.config!);
        }

        // Se atingiu rate limit, esperar e repetir
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          console.log(`⏳ Rate limit atingido. Aguardando ${retryAfter}s...`);
          await this.sleep(retryAfter * 1000);
          return this.axios.request(error.config!);
        }

        throw error;
      }
    );
  }

  /**
   * Inicializa o cliente com tokens existentes
   */
  async initialize(): Promise<void> {
    const result = await query(
      `SELECT access_token, refresh_token, token_expires_at 
       FROM marketplace_integrations 
       WHERE tenant_id = $1 AND marketplace = 'mercado_livre' AND is_active = true
       LIMIT 1`,
      [this.tenantId]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      this.accessToken = row.access_token;
      this.refreshToken = row.refresh_token;
      this.tokenExpiresAt = new Date(row.token_expires_at);
    } else {
      throw new Error('Integração do Mercado Livre não encontrada ou inativa');
    }
  }

  /**
   * Garante que o token é válido, renovando se necessário
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.tokenExpiresAt || !this.refreshToken) {
      await this.initialize();
    }

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Renovar se expira em menos de 1 hora
    if (this.tokenExpiresAt! <= oneHourFromNow) {
      await this.refreshAccessTokenInternal();
    }
  }

  /**
   * Renova o access token internamente
   */
  private async refreshAccessTokenInternal(): Promise<void> {
    try {
      console.log('🔄 Renovando token do Mercado Livre...');

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        refresh_token: this.refreshToken!,
      });

      const response = await axios.post(
        `${ML_API_BASE}/oauth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      // Atualizar no banco
      await query(
        `UPDATE marketplace_integrations 
         SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW()
         WHERE tenant_id = $4 AND marketplace = 'mercado_livre'`,
        [this.accessToken, this.refreshToken, this.tokenExpiresAt, this.tenantId]
      );

      console.log('✅ Token renovado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao renovar token:', error.response?.data || error.message);
      throw new Error('Falha ao renovar token do Mercado Livre');
    }
  }

  /**
   * Atualiza informações de rate limit dos headers da resposta
   */
  private updateRateLimitInfo(headers: any): void {
    if (headers['x-ratelimit-limit']) {
      this.rateLimitInfo = {
        limit: parseInt(headers['x-ratelimit-limit']),
        remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
        reset: parseInt(headers['x-ratelimit-reset'] || '0'),
      };
    }
  }

  /**
   * Aguarda se necessário para respeitar rate limit
   */
  private async waitForRateLimit(): Promise<void> {
    if (!this.rateLimitInfo || this.rateLimitInfo.remaining > 5) {
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const waitTime = (this.rateLimitInfo.reset - now) * 1000;

    if (waitTime > 0) {
      console.log(`⏳ Aguardando ${waitTime}ms para respeitar rate limit...`);
      await this.sleep(waitTime);
    }
  }

  /**
   * Helper para aguardar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Faz requisição GET com retry automático
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get(url, config);
    return response.data;
  }

  /**
   * Faz requisição POST com retry automático
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post(url, data, config);
    return response.data;
  }

  /**
   * Faz requisição PUT com retry automático
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put(url, data, config);
    return response.data;
  }

  /**
   * Faz requisição DELETE com retry automático
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete(url, config);
    return response.data;
  }

  // ========================================
  // MÉTODOS ESPECÍFICOS DA API DO ML
  // ========================================

  /**
   * Obtém informações do usuário
   */
  async getUserInfo(): Promise<any> {
    return this.get('/users/me');
  }

  /**
   * Busca pedidos
   */
  async searchOrders(params: {
    seller?: string;
    buyer?: string;
    status?: string;
    offset?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params.seller) queryParams.append('seller', params.seller);
    if (params.buyer) queryParams.append('buyer', params.buyer);
    if (params.status) queryParams.append('order.status', params.status);
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    return this.get(`/orders/search?${queryParams.toString()}`);
  }

  /**
   * Obtém detalhes de um pedido
   */
  async getOrder(orderId: string): Promise<any> {
    return this.get(`/orders/${orderId}`);
  }

  /**
   * Busca produtos do vendedor
   */
  async searchItems(sellerId: string, offset: number = 0, limit: number = 50): Promise<any> {
    return this.get(`/users/${sellerId}/items/search`, {
      params: { offset, limit },
    });
  }

  /**
   * Obtém detalhes de um produto
   */
  async getItem(itemId: string): Promise<any> {
    return this.get(`/items/${itemId}`);
  }

  /**
   * Cria um novo produto
   */
  async createItem(itemData: any): Promise<any> {
    return this.post('/items', itemData);
  }

  /**
   * Atualiza um produto
   */
  async updateItem(itemId: string, updates: any): Promise<any> {
    return this.put(`/items/${itemId}`, updates);
  }

  /**
   * Atualiza estoque de um produto
   */
  async updateStock(itemId: string, quantity: number): Promise<any> {
    return this.put(`/items/${itemId}`, {
      available_quantity: quantity,
    });
  }

  /**
   * Busca perguntas
   */
  async searchQuestions(params: {
    sellerId?: string;
    itemId?: string;
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params.sellerId) queryParams.append('seller_id', params.sellerId);
    if (params.itemId) queryParams.append('item_id', params.itemId);
    if (params.status) queryParams.append('status', params.status);
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    return this.get(`/questions/search?${queryParams.toString()}`);
  }

  /**
   * Responde uma pergunta
   */
  async answerQuestion(questionId: string, text: string): Promise<any> {
    return this.post(`/answers`, {
      question_id: questionId,
      text: text,
    });
  }

  /**
   * Obtém categorias
   */
  async getCategories(siteId: string = 'MLB'): Promise<any> {
    return this.get(`/sites/${siteId}/categories`);
  }

  /**
   * Prediz categoria para um produto
   */
  async predictCategory(siteId: string, title: string): Promise<any> {
    return this.get(`/sites/${siteId}/category_predictor/predict`, {
      params: { title },
    });
  }

  /**
   * Obtém informações de envio
   */
  async getShippingInfo(orderId: string): Promise<any> {
    return this.get(`/shipments/${orderId}`);
  }

  /**
   * Obtém notificações
   */
  async getNotifications(params: {
    userId: string;
    topic?: string;
    offset?: number;
    limit?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('user_id', params.userId);
    if (params.topic) queryParams.append('topic', params.topic);
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    return this.get(`/myfeeds?${queryParams.toString()}`);
  }

  /**
   * Marca notificação como lida
   */
  async markNotificationAsRead(notificationId: string): Promise<any> {
    return this.put(`/myfeeds/${notificationId}`, {
      status: 'read',
    });
  }
}

export default MercadoLivreAPIClient;
