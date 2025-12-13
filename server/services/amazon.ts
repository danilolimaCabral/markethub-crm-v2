/**
 * Serviço de integração com Amazon Selling Partner API (SP-API)
 * Documentação: https://developer-docs.amazon.com/sp-api/
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface AmazonConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: 'us-east-1' | 'eu-west-1' | 'us-west-2';
  marketplaceId: string;
  sellerId: string;
}

export class AmazonService {
  private api: AxiosInstance;
  private config: AmazonConfig;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: AmazonConfig) {
    this.config = config;
    
    const endpoints: Record<string, string> = {
      'us-east-1': 'https://sellingpartnerapi-na.amazon.com',
      'eu-west-1': 'https://sellingpartnerapi-eu.amazon.com',
      'us-west-2': 'https://sellingpartnerapi-fe.amazon.com',
    };

    this.api = axios.create({
      baseURL: endpoints[config.region],
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Obter access token usando refresh token
   */
  private async getAccessToken(): Promise<string> {
    // Verificar se token ainda é válido
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://api.amazon.com/auth/o2/token', {
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
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
      console.error('Erro ao obter access token Amazon:', error.response?.data || error.message);
      throw new Error(`Erro ao autenticar: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Gerar assinatura AWS Signature Version 4
   */
  private generateAwsSignature(method: string, path: string, headers: Record<string, string>, payload: string = ''): string {
    const service = 'execute-api';
    const region = this.config.region;
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = timestamp.substr(0, 8);

    // Canonical request
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key].trim()}\n`)
      .join('');

    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');

    const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');

    const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    // String to sign
    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

    // Signing key
    const kDate = crypto.createHmac('sha256', `AWS4${this.config.secretAccessKey}`).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();

    // Signature
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  /**
   * Fazer requisição autenticada
   */
  private async makeRequest(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    const accessToken = await this.getAccessToken();

    const headers: Record<string, string> = {
      'x-amz-access-token': accessToken,
      'x-amz-date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
      'host': this.api.defaults.baseURL!.replace('https://', ''),
    };

    const payload = data ? JSON.stringify(data) : '';
    const authorization = this.generateAwsSignature(method, path, headers, payload);

    try {
      const response = await this.api.request({
        url: path,
        method,
        headers: {
          ...headers,
          'Authorization': authorization,
        },
        data,
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro na requisição Amazon:', error.response?.data || error.message);
      throw new Error(`Erro Amazon: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  /**
   * Listar pedidos
   */
  async listarPedidos(createdAfter: string, createdBefore?: string) {
    const path = '/orders/v0/orders';
    const params = new URLSearchParams({
      MarketplaceIds: this.config.marketplaceId,
      CreatedAfter: createdAfter,
      ...(createdBefore && { CreatedBefore: createdBefore }),
    });

    return await this.makeRequest(`${path}?${params.toString()}`, 'GET');
  }

  /**
   * Obter detalhes de um pedido
   */
  async obterPedido(orderId: string) {
    const path = `/orders/v0/orders/${orderId}`;
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Listar produtos (inventário)
   */
  async listarProdutos() {
    const path = '/catalog/2022-04-01/items';
    const params = new URLSearchParams({
      marketplaceIds: this.config.marketplaceId,
      sellerId: this.config.sellerId,
    });

    return await this.makeRequest(`${path}?${params.toString()}`, 'GET');
  }

  /**
   * Obter detalhes de um produto
   */
  async obterProduto(asin: string) {
    const path = `/catalog/2022-04-01/items/${asin}`;
    const params = new URLSearchParams({
      marketplaceIds: this.config.marketplaceId,
    });

    return await this.makeRequest(`${path}?${params.toString()}`, 'GET');
  }

  /**
   * Atualizar estoque
   */
  async atualizarEstoque(sku: string, quantity: number) {
    const path = '/fba/inventory/v1/items/inventory';
    return await this.makeRequest(path, 'POST', {
      sellerSku: sku,
      marketplaceId: this.config.marketplaceId,
      quantity,
    });
  }

  /**
   * Testar conexão
   */
  async testarConexao(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão Amazon:', error);
      return false;
    }
  }
}

export default AmazonService;
