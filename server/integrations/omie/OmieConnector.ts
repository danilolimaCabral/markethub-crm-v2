import axios, { AxiosInstance } from 'axios';
import { BaseConnector } from '../core/BaseConnector';
import { ISyncResult, IProduct, IOrder } from '../core/IConnector';

/**
 * Conector para integração com Omie ERP
 * Documentação: https://developer.omie.com.br/
 */
export class OmieConnector extends BaseConnector {
  readonly name = 'Omie';
  readonly version = '1.0';
  
  private apiClient: AxiosInstance | null = null;
  private readonly baseURL = 'https://app.omie.com.br/api/v1';

  protected validateCredentials(credentials: Record<string, string>): boolean {
    return !!(credentials.appKey && credentials.appSecret);
  }

  protected async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<any> {
    if (!this.apiClient || !this.config) {
      throw new Error('Cliente API não inicializado');
    }

    try {
      // Omie usa sempre POST com call e param
      const response = await this.apiClient.post('', {
        call: endpoint,
        app_key: this.config.credentials.appKey,
        app_secret: this.config.credentials.appSecret,
        param: [data || {}]
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`[Omie] Erro na requisição ${endpoint}:`, error.message);
      throw error;
    }
  }

  async connect(config: any): Promise<boolean> {
    const connected = await super.connect(config);
    
    if (connected) {
      this.apiClient = axios.create({
        baseURL: this.baseURL,
        headers: {
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
      console.log(`[Omie] Iniciando sincronização de produtos...`);
      
      const response = await this.makeRequest('POST', 'geral/produtos/', {
        pagina: 1,
        registros_por_pagina: 100
      });
      
      const products = response.produto_servico_cadastro || [];

      let created = 0;
      const errors: string[] = [];

      for (const omieProduct of products) {
        try {
          const product: IProduct = {
            externalId: omieProduct.codigo_produto,
            name: omieProduct.descricao,
            sku: omieProduct.codigo,
            price: parseFloat(omieProduct.valor_unitario),
            stock: parseInt(omieProduct.quantidade_estoque || 0),
            description: omieProduct.obs_internas
          };

          created++;
        } catch (error: any) {
          errors.push(`Erro ao processar produto ${omieProduct.codigo}: ${error.message}`);
        }
      }

      this.updateSyncStatus('success', `${created} produtos sincronizados`);
      return this.createSyncResult(true, products.length, created, 0, errors);
      
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
          const omieProduct = {
            descricao: product.name,
            codigo: product.sku,
            valor_unitario: product.price,
            quantidade_estoque: product.stock,
            obs_internas: product.description
          };

          if (product.externalId) {
            await this.makeRequest('POST', 'geral/produtos/AlterarProduto/', {
              codigo_produto: product.externalId,
              ...omieProduct
            });
            updated++;
          } else {
            await this.makeRequest('POST', 'geral/produtos/IncluirProduto/', omieProduct);
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
      console.log(`[Omie] Iniciando sincronização de pedidos...`);
      
      const response = await this.makeRequest('POST', 'produtos/pedido/', {
        pagina: 1,
        registros_por_pagina: 100
      });
      
      const orders = response.pedido_venda_produto || [];

      let created = 0;
      const errors: string[] = [];

      for (const omieOrder of orders) {
        try {
          const order: IOrder = {
            externalId: omieOrder.codigo_pedido,
            customerId: omieOrder.codigo_cliente,
            customerName: omieOrder.nome_cliente,
            customerEmail: omieOrder.email_cliente,
            items: omieOrder.det.map((item: any) => ({
              productId: item.produto.codigo_produto,
              productName: item.produto.descricao,
              quantity: item.quantidade,
              price: parseFloat(item.valor_unitario)
            })),
            total: parseFloat(omieOrder.total_pedido),
            status: this.mapOmieStatus(omieOrder.etapa),
            createdAt: new Date(omieOrder.data_previsao)
          };

          created++;
        } catch (error: any) {
          errors.push(`Erro ao processar pedido ${omieOrder.codigo_pedido}: ${error.message}`);
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
      const omieOrder = {
        codigo_cliente: order.customerId,
        det: order.items.map(item => ({
          produto: {
            codigo_produto: item.productId
          },
          quantidade: item.quantity,
          valor_unitario: item.price
        })),
        total_pedido: order.total
      };

      const response = await this.makeRequest('POST', 'produtos/pedido/IncluirPedido/', omieOrder);
      return response.codigo_pedido;
      
    } catch (error: any) {
      throw new Error(`Erro ao criar pedido no Omie: ${error.message}`);
    }
  }

  async updateStockInExternal(productId: string, quantity: number): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      await this.makeRequest('POST', 'geral/produtos/AlterarProduto/', {
        codigo_produto: productId,
        quantidade_estoque: quantity
      });
      return true;
    } catch (error: any) {
      console.error(`[Omie] Erro ao atualizar estoque:`, error.message);
      return false;
    }
  }

  private mapOmieStatus(omieStatus: string): IOrder['status'] {
    const statusMap: Record<string, IOrder['status']> = {
      '10': 'pending',      // Pendente
      '20': 'processing',   // Em andamento
      '30': 'shipped',      // Enviado
      '40': 'delivered',    // Entregue
      '50': 'cancelled'     // Cancelado
    };

    return statusMap[omieStatus] || 'pending';
  }
}
