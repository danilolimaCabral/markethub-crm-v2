import axios, { AxiosInstance } from 'axios';
import { BaseConnector } from '../core/BaseConnector';
import { ISyncResult, IProduct, IOrder } from '../core/IConnector';

/**
 * Conector para integração com Bling ERP
 * Documentação: https://developer.bling.com.br/
 */
export class BlingConnector extends BaseConnector {
  readonly name = 'Bling';
  readonly version = '3.0';
  
  private apiClient: AxiosInstance | null = null;
  private readonly baseURL = 'https://api.bling.com.br/Api/v3';

  protected validateCredentials(credentials: Record<string, string>): boolean {
    return !!(credentials.apiKey && credentials.apiKey.length > 0);
  }

  protected async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<any> {
    if (!this.apiClient) {
      throw new Error('Cliente API não inicializado');
    }

    try {
      const response = await this.apiClient.request({
        method,
        url: endpoint,
        data
      });
      return response.data;
    } catch (error: any) {
      console.error(`[Bling] Erro na requisição ${method} ${endpoint}:`, error.message);
      throw error;
    }
  }

  async connect(config: any): Promise<boolean> {
    const connected = await super.connect(config);
    
    if (connected && this.config) {
      // Inicializar cliente Axios
      this.apiClient = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    }

    return connected;
  }

  async syncProductsFromExternal(): Promise<ISyncResult> {
    if (!this.isConnected()) {
      return this.createSyncResult(false, 0, 0, 0, ['Não conectado']);
    }

    try {
      console.log(`[Bling] Iniciando sincronização de produtos...`);
      
      // Buscar produtos do Bling
      const response = await this.makeRequest('GET', '/produtos');
      const products = response.data || [];

      let created = 0;
      let updated = 0;
      const errors: string[] = [];

      // Processar cada produto
      for (const blingProduct of products) {
        try {
          // Converter formato Bling para formato MarketHub
          const product: IProduct = {
            externalId: blingProduct.id,
            name: blingProduct.nome,
            sku: blingProduct.codigo,
            price: parseFloat(blingProduct.preco),
            stock: parseInt(blingProduct.estoque),
            description: blingProduct.descricao,
            category: blingProduct.categoria?.descricao
          };

          // Aqui você salvaria no banco do MarketHub
          // Por enquanto, apenas contamos
          created++;
        } catch (error: any) {
          errors.push(`Erro ao processar produto ${blingProduct.id}: ${error.message}`);
        }
      }

      this.updateSyncStatus('success', `${created} produtos sincronizados`);
      return this.createSyncResult(true, products.length, created, updated, errors);
      
    } catch (error: any) {
      this.updateSyncStatus('error', error.message);
      return this.createSyncResult(false, 0, 0, 0, [error.message]);
    }
  }

  async syncProductsToExternal(products: IProduct[]): Promise<ISyncResult> {
    if (!this.isConnected()) {
      return this.createSyncResult(false, 0, 0, 0, ['Não conectado']);
    }

    try {
      let created = 0;
      let updated = 0;
      const errors: string[] = [];

      for (const product of products) {
        try {
          // Converter formato MarketHub para formato Bling
          const blingProduct = {
            nome: product.name,
            codigo: product.sku,
            preco: product.price,
            estoque: product.stock,
            descricao: product.description
          };

          if (product.externalId) {
            // Atualizar produto existente
            await this.makeRequest('PUT', `/produtos/${product.externalId}`, blingProduct);
            updated++;
          } else {
            // Criar novo produto
            await this.makeRequest('POST', '/produtos', blingProduct);
            created++;
          }
        } catch (error: any) {
          errors.push(`Erro ao sincronizar produto ${product.sku}: ${error.message}`);
        }
      }

      return this.createSyncResult(true, products.length, created, updated, errors);
      
    } catch (error: any) {
      return this.createSyncResult(false, 0, 0, 0, [error.message]);
    }
  }

  async syncOrdersFromExternal(): Promise<ISyncResult> {
    if (!this.isConnected()) {
      return this.createSyncResult(false, 0, 0, 0, ['Não conectado']);
    }

    try {
      console.log(`[Bling] Iniciando sincronização de pedidos...`);
      
      const response = await this.makeRequest('GET', '/pedidos');
      const orders = response.data || [];

      let created = 0;
      const errors: string[] = [];

      for (const blingOrder of orders) {
        try {
          // Converter formato Bling para formato MarketHub
          const order: IOrder = {
            externalId: blingOrder.id,
            customerId: blingOrder.cliente.id,
            customerName: blingOrder.cliente.nome,
            customerEmail: blingOrder.cliente.email,
            items: blingOrder.itens.map((item: any) => ({
              productId: item.produto.id,
              productName: item.produto.nome,
              quantity: item.quantidade,
              price: parseFloat(item.valor)
            })),
            total: parseFloat(blingOrder.total),
            status: this.mapBlingStatus(blingOrder.situacao),
            createdAt: new Date(blingOrder.data)
          };

          // Aqui você salvaria no banco do MarketHub
          created++;
        } catch (error: any) {
          errors.push(`Erro ao processar pedido ${blingOrder.id}: ${error.message}`);
        }
      }

      this.updateSyncStatus('success', `${created} pedidos sincronizados`);
      return this.createSyncResult(true, orders.length, created, 0, errors);
      
    } catch (error: any) {
      this.updateSyncStatus('error', error.message);
      return this.createSyncResult(false, 0, 0, 0, [error.message]);
    }
  }

  async createOrderInExternal(order: IOrder): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Não conectado');
    }

    try {
      // Converter formato MarketHub para formato Bling
      const blingOrder = {
        cliente: {
          id: order.customerId
        },
        itens: order.items.map(item => ({
          produto: { id: item.productId },
          quantidade: item.quantity,
          valor: item.price
        })),
        total: order.total
      };

      const response = await this.makeRequest('POST', '/pedidos', blingOrder);
      return response.data.id;
      
    } catch (error: any) {
      throw new Error(`Erro ao criar pedido no Bling: ${error.message}`);
    }
  }

  async updateStockInExternal(productId: string, quantity: number): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      await this.makeRequest('PUT', `/produtos/${productId}/estoque`, {
        estoque: quantity
      });
      return true;
    } catch (error: any) {
      console.error(`[Bling] Erro ao atualizar estoque:`, error.message);
      return false;
    }
  }

  /**
   * Mapear status do Bling para status do MarketHub
   */
  private mapBlingStatus(blingStatus: string): IOrder['status'] {
    const statusMap: Record<string, IOrder['status']> = {
      'em_aberto': 'pending',
      'em_andamento': 'processing',
      'enviado': 'shipped',
      'entregue': 'delivered',
      'cancelado': 'cancelled'
    };

    return statusMap[blingStatus] || 'pending';
  }
}
