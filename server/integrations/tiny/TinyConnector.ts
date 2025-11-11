import axios, { AxiosInstance } from 'axios';
import { BaseConnector } from '../core/BaseConnector';
import { ISyncResult, IProduct, IOrder } from '../core/IConnector';

/**
 * Conector para integração com Tiny ERP
 * Documentação: https://tiny.com.br/api-docs
 */
export class TinyConnector extends BaseConnector {
  readonly name = 'Tiny ERP';
  readonly version = '1.0';
  
  private apiClient: AxiosInstance | null = null;
  private readonly baseURL = 'https://api.tiny.com.br/api2';

  protected validateCredentials(credentials: Record<string, string>): boolean {
    return !!(credentials.token && credentials.token.length > 0);
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
      const params = {
        token: this.config.credentials.token,
        formato: 'json',
        ...data
      };

      const response = await this.apiClient.post(endpoint, null, { params });
      return response.data;
    } catch (error: any) {
      console.error(`[Tiny] Erro na requisição ${endpoint}:`, error.message);
      throw error;
    }
  }

  async connect(config: any): Promise<boolean> {
    const connected = await super.connect(config);
    
    if (connected) {
      this.apiClient = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
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
      console.log(`[Tiny] Iniciando sincronização de produtos...`);
      
      const response = await this.makeRequest('POST', '/produtos.pesquisa.php', {
        pagina: 1
      });
      
      const products = response.retorno?.produtos || [];

      let created = 0;
      const errors: string[] = [];

      for (const tinyProduct of products) {
        try {
          const product: IProduct = {
            externalId: tinyProduct.produto.id,
            name: tinyProduct.produto.nome,
            sku: tinyProduct.produto.codigo,
            price: parseFloat(tinyProduct.produto.preco),
            stock: parseInt(tinyProduct.produto.saldo || 0),
            description: tinyProduct.produto.descricao_complementar
          };

          created++;
        } catch (error: any) {
          errors.push(`Erro ao processar produto ${tinyProduct.produto.codigo}: ${error.message}`);
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
          const tinyProduct = {
            produto: {
              nome: product.name,
              codigo: product.sku,
              preco: product.price,
              saldo: product.stock,
              descricao_complementar: product.description
            }
          };

          const xmlData = this.convertToXML(tinyProduct);

          if (product.externalId) {
            await this.makeRequest('POST', '/produto.alterar.php', {
              id: product.externalId,
              produto: xmlData
            });
            updated++;
          } else {
            await this.makeRequest('POST', '/produto.incluir.php', {
              produto: xmlData
            });
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
      console.log(`[Tiny] Iniciando sincronização de pedidos...`);
      
      const response = await this.makeRequest('POST', '/pedidos.pesquisa.php', {
        pagina: 1
      });
      
      const orders = response.retorno?.pedidos || [];

      let created = 0;
      const errors: string[] = [];

      for (const tinyOrder of orders) {
        try {
          const order: IOrder = {
            externalId: tinyOrder.pedido.id,
            customerId: tinyOrder.pedido.cliente.id,
            customerName: tinyOrder.pedido.cliente.nome,
            customerEmail: tinyOrder.pedido.cliente.email,
            items: tinyOrder.pedido.itens.map((item: any) => ({
              productId: item.item.id_produto,
              productName: item.item.descricao,
              quantity: parseInt(item.item.quantidade),
              price: parseFloat(item.item.valor_unitario)
            })),
            total: parseFloat(tinyOrder.pedido.total),
            status: this.mapTinyStatus(tinyOrder.pedido.situacao),
            createdAt: new Date(tinyOrder.pedido.data_pedido)
          };

          created++;
        } catch (error: any) {
          errors.push(`Erro ao processar pedido ${tinyOrder.pedido.id}: ${error.message}`);
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
      const tinyOrder = {
        pedido: {
          cliente: {
            id: order.customerId
          },
          itens: order.items.map(item => ({
            item: {
              id_produto: item.productId,
              quantidade: item.quantity,
              valor_unitario: item.price
            }
          })),
          total: order.total
        }
      };

      const xmlData = this.convertToXML(tinyOrder);
      const response = await this.makeRequest('POST', '/pedido.incluir.php', {
        pedido: xmlData
      });
      
      return response.retorno.registros.registro.id;
      
    } catch (error: any) {
      throw new Error(`Erro ao criar pedido no Tiny: ${error.message}`);
    }
  }

  async updateStockInExternal(productId: string, quantity: number): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const xmlData = this.convertToXML({
        produto: {
          saldo: quantity
        }
      });

      await this.makeRequest('POST', '/produto.alterar.php', {
        id: productId,
        produto: xmlData
      });
      
      return true;
    } catch (error: any) {
      console.error(`[Tiny] Erro ao atualizar estoque:`, error.message);
      return false;
    }
  }

  private mapTinyStatus(tinyStatus: string): IOrder['status'] {
    const statusMap: Record<string, IOrder['status']> = {
      'aberto': 'pending',
      'aprovado': 'processing',
      'enviado': 'shipped',
      'entregue': 'delivered',
      'cancelado': 'cancelled'
    };

    return statusMap[tinyStatus.toLowerCase()] || 'pending';
  }

  /**
   * Tiny ERP usa XML em algumas requisições
   * Converter objeto para XML simples
   */
  private convertToXML(obj: any): string {
    // Implementação simplificada
    // Em produção, usar biblioteca como xml2js
    return JSON.stringify(obj);
  }
}
