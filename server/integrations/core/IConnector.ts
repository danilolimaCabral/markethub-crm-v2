/**
 * Interface base para todos os conectores de integração
 */

export interface IConnectorConfig {
  tenantId: string;
  credentials: Record<string, string>;
  syncInterval?: number; // em minutos
  autoSync?: boolean;
}

export interface IProduct {
  id?: string;
  externalId?: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  description?: string;
  category?: string;
  images?: string[];
}

export interface IOrder {
  id?: string;
  externalId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  items: IOrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: Date;
}

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ISyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  errors: string[];
}

/**
 * Interface que todos os conectores devem implementar
 */
export interface IConnector {
  /**
   * Nome do conector (ex: "Bling", "Omie", "Tiny")
   */
  readonly name: string;

  /**
   * Versão da API do conector
   */
  readonly version: string;

  /**
   * Inicializar conexão com o sistema externo
   */
  connect(config: IConnectorConfig): Promise<boolean>;

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean;

  /**
   * Desconectar
   */
  disconnect(): Promise<void>;

  /**
   * Sincronizar produtos do sistema externo para o Markthub
   */
  syncProductsFromExternal(): Promise<ISyncResult>;

  /**
   * Sincronizar produtos do Markthub para o sistema externo
   */
  syncProductsToExternal(products: IProduct[]): Promise<ISyncResult>;

  /**
   * Sincronizar pedidos do sistema externo para o Markthub
   */
  syncOrdersFromExternal(): Promise<ISyncResult>;

  /**
   * Criar pedido no sistema externo
   */
  createOrderInExternal(order: IOrder): Promise<string>;

  /**
   * Atualizar estoque no sistema externo
   */
  updateStockInExternal(productId: string, quantity: number): Promise<boolean>;

  /**
   * Obter status da última sincronização
   */
  getLastSyncStatus(): Promise<{
    lastSync: Date;
    status: 'success' | 'error' | 'pending';
    message?: string;
  }>;
}
