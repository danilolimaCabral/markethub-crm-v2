import axios, { AxiosInstance } from 'axios';

interface MelhorEnvioConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  sandbox?: boolean;
}

interface Address {
  postal_code: string;
  address: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state_abbr: string;
  country_id: string;
}

interface Package {
  weight: number; // kg
  width: number; // cm
  height: number; // cm
  length: number; // cm
}

interface ShippingQuote {
  id: number;
  name: string;
  price: string;
  custom_price: string;
  discount: string;
  currency: string;
  delivery_time: number;
  delivery_range: {
    min: number;
    max: number;
  };
  custom_delivery_time: number;
  custom_delivery_range: {
    min: number;
    max: number;
  };
  packages: Array<{
    price: string;
    discount: string;
    format: string;
    weight: string;
    insurance_value: string;
    products: any[];
  }>;
  additional_services: {
    receipt: boolean;
    own_hand: boolean;
    collect: boolean;
  };
  company: {
    id: number;
    name: string;
    picture: string;
  };
}

export class MelhorEnvioService {
  private api: AxiosInstance;
  private config: MelhorEnvioConfig;

  constructor(config: MelhorEnvioConfig) {
    this.config = config;
    const baseURL = config.sandbox
      ? 'https://sandbox.melhorenvio.com.br/api/v2'
      : 'https://melhorenvio.com.br/api/v2';

    this.api = axios.create({
      baseURL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'MarketHub CRM (contato@markethubcrm.com.br)',
      },
    });

    // Interceptor para adicionar token em todas as requisições
    this.api.interceptors.request.use((config) => {
      if (this.config.accessToken) {
        config.headers.Authorization = `Bearer ${this.config.accessToken}`;
      }
      return config;
    });
  }

  /**
   * Obtém URL de autorização OAuth2
   */
  getAuthorizationUrl(redirectUri: string, state: string): string {
    const baseUrl = this.config.sandbox
      ? 'https://sandbox.melhorenvio.com.br'
      : 'https://melhorenvio.com.br';

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope: 'cart-read cart-write companies-read companies-write coupons-read coupons-write notifications-read orders-read products-read products-write purchases-read shipping-calculate shipping-cancel shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-share shipping-tracking ecommerce-shipping transactions-read',
    });

    return `${baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Troca código de autorização por tokens
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const baseUrl = this.config.sandbox
      ? 'https://sandbox.melhorenvio.com.br'
      : 'https://melhorenvio.com.br';

    const response = await axios.post(`${baseUrl}/oauth/token`, {
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    return response.data;
  }

  /**
   * Renova o access token usando refresh token
   */
  async refreshAccessToken(): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const baseUrl = this.config.sandbox
      ? 'https://sandbox.melhorenvio.com.br'
      : 'https://melhorenvio.com.br';

    const response = await axios.post(`${baseUrl}/oauth/token`, {
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
    });

    return response.data;
  }

  /**
   * Calcula frete para um endereço
   */
  async calculateShipping(
    from: Address,
    to: Address,
    packages: Package[]
  ): Promise<ShippingQuote[]> {
    const response = await this.api.post('/me/shipment/calculate', {
      from: {
        postal_code: from.postal_code,
      },
      to: {
        postal_code: to.postal_code,
      },
      products: packages.map((pkg) => ({
        id: '1',
        width: pkg.width,
        height: pkg.height,
        length: pkg.length,
        weight: pkg.weight,
        insurance_value: 0,
        quantity: 1,
      })),
    });

    return response.data;
  }

  /**
   * Adiciona envio ao carrinho
   */
  async addToCart(serviceId: number, from: Address, to: Address, packages: Package[], options?: {
    receipt?: boolean;
    ownHand?: boolean;
    collect?: boolean;
    insuranceValue?: number;
    invoice?: {
      key: string;
    };
  }): Promise<any> {
    const response = await this.api.post('/me/cart', {
      service: serviceId,
      from: {
        name: from.address,
        postal_code: from.postal_code,
        address: from.address,
        number: from.number,
        complement: from.complement,
        district: from.district,
        city: from.city,
        state_abbr: from.state_abbr,
        country_id: from.country_id,
      },
      to: {
        name: to.address,
        postal_code: to.postal_code,
        address: to.address,
        number: to.number,
        complement: to.complement,
        district: to.district,
        city: to.city,
        state_abbr: to.state_abbr,
        country_id: to.country_id,
      },
      products: packages.map((pkg) => ({
        name: 'Produto',
        quantity: 1,
        unitary_value: options?.insuranceValue || 0,
      })),
      volumes: packages.map((pkg) => ({
        height: pkg.height,
        width: pkg.width,
        length: pkg.length,
        weight: pkg.weight,
      })),
      options: {
        insurance_value: options?.insuranceValue || 0,
        receipt: options?.receipt || false,
        own_hand: options?.ownHand || false,
        collect: options?.collect || false,
        ...(options?.invoice && { invoice: options.invoice }),
      },
    });

    return response.data;
  }

  /**
   * Finaliza compra do carrinho
   */
  async checkout(orderIds: string[]): Promise<any> {
    const response = await this.api.post('/me/shipment/checkout', {
      orders: orderIds,
    });

    return response.data;
  }

  /**
   * Gera etiquetas de envio
   */
  async generateLabels(orderIds: string[]): Promise<any> {
    const response = await this.api.post('/me/shipment/generate', {
      orders: orderIds,
    });

    return response.data;
  }

  /**
   * Imprime etiquetas
   */
  async printLabels(orderIds: string[], mode: 'private' | 'public' = 'private'): Promise<string> {
    const response = await this.api.post('/me/shipment/print', {
      mode,
      orders: orderIds,
    });

    return response.data.url;
  }

  /**
   * Rastreia envio
   */
  async trackShipment(orderId: string): Promise<any> {
    const response = await this.api.get(`/me/shipment/tracking/${orderId}`);
    return response.data;
  }

  /**
   * Cancela envio
   */
  async cancelShipment(orderId: string, description: string): Promise<any> {
    const response = await this.api.post(`/me/shipment/cancel`, {
      order: {
        id: orderId,
        reason_id: '2', // Desistência da compra
        description,
      },
    });

    return response.data;
  }

  /**
   * Lista empresas de transporte disponíveis
   */
  async getShippingCompanies(): Promise<any[]> {
    const response = await this.api.get('/me/shipment/companies');
    return response.data;
  }

  /**
   * Obtém saldo da carteira
   */
  async getBalance(): Promise<{ balance: number }> {
    const response = await this.api.get('/me/balance');
    return response.data;
  }

  /**
   * Lista pedidos
   */
  async listOrders(params?: {
    status?: string;
    page?: number;
    perPage?: number;
  }): Promise<any> {
    const response = await this.api.get('/me/orders', { params });
    return response.data;
  }

  /**
   * Obtém detalhes de um pedido
   */
  async getOrder(orderId: string): Promise<any> {
    const response = await this.api.get(`/me/orders/${orderId}`);
    return response.data;
  }

  /**
   * Alias para calculateShipping (compatibilidade)
   */
  async calcularFrete(params: { from: Address; to: Address; package: Package }): Promise<ShippingQuote[]> {
    return this.calculateShipping(params.from, params.to, [params.package]);
  }

  /**
   * Alias para trackShipment (compatibilidade)
   */
  async rastrearEnvio(orderId: string): Promise<any> {
    return this.trackShipment(orderId);
  }

  /**
   * Alias para testConnection (compatibilidade)
   */
  async testarConexao(): Promise<boolean> {
    return this.testConnection();
  }

  /**
   * Testa conexão com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.api.get('/me');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default MelhorEnvioService;
