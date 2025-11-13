import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { logInfo, logError } from '../middleware/logger';

const SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com'; // Região: América do Norte
// Para outras regiões:
// - Europa: sellingpartnerapi-eu.amazon.com
// - Extremo Oriente: sellingpartnerapi-fe.amazon.com

interface AmazonCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

class AmazonSPAPIService {
  private credentials: AmazonCredentials;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(credentials: AmazonCredentials) {
    this.credentials = credentials;
  }

  /**
   * Obtém access token usando LWA (Login with Amazon)
   */
  private async getAccessToken(): Promise<string> {
    // Se token ainda é válido, retorna
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://api.amazon.com/auth/o2/token',
        {
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refreshToken,
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expira em 1 hora
      this.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      return this.accessToken;
    } catch (error: any) {
      logError('Erro ao obter access token da Amazon', error);
      throw new Error('Falha na autenticação com Amazon SP-API');
    }
  }

  /**
   * Cria assinatura AWS Signature V4 para requisição
   */
  private createSignature(
    method: string,
    url: string,
    headers: Record<string, string>,
    payload: string = ''
  ): Record<string, string> {
    const urlObj = new URL(url);
    const host = urlObj.hostname;
    const path = urlObj.pathname + urlObj.search;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substr(0, 8);

    // Headers necessários
    const signedHeaders = 'host;x-amz-access-token;x-amz-date';
    const canonicalHeaders = `host:${host}\nx-amz-access-token:${headers['x-amz-access-token']}\nx-amz-date:${amzDate}\n`;
    const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${this.sha256(payload)}`;

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.credentials.region}/execute-api/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${this.sha256(canonicalRequest)}`;

    const kSecret = `AWS4${this.credentials.secretAccessKey}`;
    const kDate = this.hmacSha256(kSecret, dateStamp);
    const kRegion = this.hmacSha256(kDate, this.credentials.region);
    const kService = this.hmacSha256(kRegion, 'execute-api');
    const kSigning = this.hmacSha256(kService, 'aws4_request');
    const signature = this.hmacSha256(kSigning, stringToSign).toString('hex');

    headers['x-amz-date'] = amzDate;
    headers['Authorization'] = `${algorithm} Credential=${this.credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return headers;
  }

  private sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hmacSha256(key: string | Buffer, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
  }

  /**
   * Faz requisição autenticada para SP-API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    params?: Record<string, any>
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `${SP_API_BASE}${endpoint}`;

      const headers: Record<string, string> = {
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      };

      // Adiciona query parameters se houver
      let fullUrl = url;
      if (params && method === 'GET') {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        fullUrl = `${url}?${queryParams.toString()}`;
      }

      // Cria assinatura
      const signedHeaders = this.createSignature(method, fullUrl, headers, '');

      const config: any = {
        method,
        url: fullUrl,
        headers: signedHeaders,
      };

      if (method !== 'GET' && params) {
        config.data = params;
      }

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      logError('Erro na requisição SP-API', error, { endpoint, method });
      throw error;
    }
  }

  /**
   * Lista pedidos
   */
  async listOrders(options?: {
    createdAfter?: Date;
    createdBefore?: Date;
    orderStatuses?: string[];
    marketplaceIds?: string[];
    maxResultsPerPage?: number;
  }): Promise<any> {
    const params: Record<string, any> = {};

    if (options?.createdAfter) {
      params.CreatedAfter = options.createdAfter.toISOString();
    }
    if (options?.createdBefore) {
      params.CreatedBefore = options.createdBefore.toISOString();
    }
    if (options?.orderStatuses) {
      params.OrderStatuses = options.orderStatuses.join(',');
    }
    if (options?.marketplaceIds) {
      params.MarketplaceIds = options.marketplaceIds.join(',');
    }
    if (options?.maxResultsPerPage) {
      params.MaxResultsPerPage = options.maxResultsPerPage;
    }

    return await this.makeRequest('GET', '/orders/v0/orders', params);
  }

  /**
   * Obtém detalhes de um pedido
   */
  async getOrder(orderId: string): Promise<any> {
    return await this.makeRequest('GET', `/orders/v0/orders/${orderId}`);
  }

  /**
   * Lista itens de um pedido
   */
  async getOrderItems(orderId: string): Promise<any> {
    return await this.makeRequest('GET', `/orders/v0/orders/${orderId}/orderItems`);
  }

  /**
   * Busca produtos no catálogo
   */
  async searchCatalogItems(keywords: string, marketplaceIds: string[]): Promise<any> {
    return await this.makeRequest('POST', '/catalog/2022-04-01/items', {
      identifiers: keywords.split(',').map((k) => k.trim()),
      marketplaceIds,
      identifiersType: 'ASIN',
    });
  }

  /**
   * Obtém inventário FBA
   */
  async getFBAInventory(marketplaceIds: string[]): Promise<any> {
    const params = {
      marketplaceIds: marketplaceIds.join(','),
      granularityType: 'Marketplace',
    };

    return await this.makeRequest('GET', '/fba/inventory/v1/summaries', params);
  }
}

export default AmazonSPAPIService;
