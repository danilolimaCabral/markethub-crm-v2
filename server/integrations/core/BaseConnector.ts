import { IConnector, IConnectorConfig, ISyncResult, IProduct, IOrder } from './IConnector';

/**
 * Classe base abstrata que implementa funcionalidades comuns
 * a todos os conectores
 */
export abstract class BaseConnector implements IConnector {
  protected config: IConnectorConfig | null = null;
  protected connected: boolean = false;
  protected lastSyncDate: Date | null = null;
  protected lastSyncStatus: 'success' | 'error' | 'pending' = 'pending';
  protected lastSyncMessage: string = '';

  abstract readonly name: string;
  abstract readonly version: string;

  /**
   * Método abstrato para validar credenciais
   * Cada conector deve implementar sua própria validação
   */
  protected abstract validateCredentials(credentials: Record<string, string>): boolean;

  /**
   * Método abstrato para fazer requisição HTTP ao sistema externo
   */
  protected abstract makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<any>;

  async connect(config: IConnectorConfig): Promise<boolean> {
    try {
      // Validar credenciais
      if (!this.validateCredentials(config.credentials)) {
        throw new Error('Credenciais inválidas');
      }

      this.config = config;
      this.connected = true;
      
      console.log(`[${this.name}] Conectado com sucesso para tenant ${config.tenantId}`);
      return true;
    } catch (error) {
      console.error(`[${this.name}] Erro ao conectar:`, error);
      this.connected = false;
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.config = null;
    console.log(`[${this.name}] Desconectado`);
  }

  async getLastSyncStatus() {
    return {
      lastSync: this.lastSyncDate || new Date(),
      status: this.lastSyncStatus,
      message: this.lastSyncMessage
    };
  }

  /**
   * Métodos abstratos que cada conector deve implementar
   */
  abstract syncProductsFromExternal(): Promise<ISyncResult>;
  abstract syncProductsToExternal(products: IProduct[]): Promise<ISyncResult>;
  abstract syncOrdersFromExternal(): Promise<ISyncResult>;
  abstract createOrderInExternal(order: IOrder): Promise<string>;
  abstract updateStockInExternal(productId: string, quantity: number): Promise<boolean>;

  /**
   * Método helper para atualizar status de sincronização
   */
  protected updateSyncStatus(status: 'success' | 'error' | 'pending', message?: string) {
    this.lastSyncDate = new Date();
    this.lastSyncStatus = status;
    this.lastSyncMessage = message || '';
  }

  /**
   * Método helper para criar resultado de sincronização
   */
  protected createSyncResult(
    success: boolean,
    processed: number = 0,
    created: number = 0,
    updated: number = 0,
    errors: string[] = []
  ): ISyncResult {
    return {
      success,
      itemsProcessed: processed,
      itemsCreated: created,
      itemsUpdated: updated,
      errors
    };
  }
}
