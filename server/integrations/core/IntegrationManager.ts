import { IConnector, IConnectorConfig } from './IConnector';
import { BlingConnector } from '../bling/BlingConnector';
import { OmieConnector } from '../omie/OmieConnector';
import { TinyConnector } from '../tiny/TinyConnector';

/**
 * Gerenciador central de todas as integrações
 */
export class IntegrationManager {
  private static instance: IntegrationManager;
  private connectors: Map<string, IConnector> = new Map();
  private activeConnections: Map<string, IConnector> = new Map();

  private constructor() {
    // Registrar todos os conectores disponíveis
    this.registerConnector('bling', new BlingConnector());
    this.registerConnector('omie', new OmieConnector());
    this.registerConnector('tiny', new TinyConnector());
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  /**
   * Registrar um novo conector
   */
  private registerConnector(key: string, connector: IConnector): void {
    this.connectors.set(key, connector);
    console.log(`[IntegrationManager] Conector ${connector.name} registrado`);
  }

  /**
   * Listar todos os conectores disponíveis
   */
  public getAvailableConnectors(): Array<{
    key: string;
    name: string;
    version: string;
  }> {
    return Array.from(this.connectors.entries()).map(([key, connector]) => ({
      key,
      name: connector.name,
      version: connector.version
    }));
  }

  /**
   * Conectar a um sistema externo
   */
  public async connect(
    connectorKey: string,
    config: IConnectorConfig
  ): Promise<boolean> {
    const connector = this.connectors.get(connectorKey);
    
    if (!connector) {
      throw new Error(`Conector ${connectorKey} não encontrado`);
    }

    const connectionKey = `${connectorKey}_${config.tenantId}`;
    
    // Verificar se já está conectado
    if (this.activeConnections.has(connectionKey)) {
      console.log(`[IntegrationManager] Já conectado a ${connectorKey} para tenant ${config.tenantId}`);
      return true;
    }

    // Conectar
    const success = await connector.connect(config);
    
    if (success) {
      this.activeConnections.set(connectionKey, connector);
      console.log(`[IntegrationManager] Conectado a ${connectorKey} para tenant ${config.tenantId}`);
    }

    return success;
  }

  /**
   * Desconectar de um sistema externo
   */
  public async disconnect(connectorKey: string, tenantId: string): Promise<void> {
    const connectionKey = `${connectorKey}_${tenantId}`;
    const connector = this.activeConnections.get(connectionKey);

    if (connector) {
      await connector.disconnect();
      this.activeConnections.delete(connectionKey);
      console.log(`[IntegrationManager] Desconectado de ${connectorKey} para tenant ${tenantId}`);
    }
  }

  /**
   * Obter conector ativo
   */
  public getActiveConnector(connectorKey: string, tenantId: string): IConnector | null {
    const connectionKey = `${connectorKey}_${tenantId}`;
    return this.activeConnections.get(connectionKey) || null;
  }

  /**
   * Verificar se está conectado
   */
  public isConnected(connectorKey: string, tenantId: string): boolean {
    const connector = this.getActiveConnector(connectorKey, tenantId);
    return connector ? connector.isConnected() : false;
  }

  /**
   * Sincronizar produtos de um sistema externo
   */
  public async syncProducts(connectorKey: string, tenantId: string, direction: 'from' | 'to', products?: any[]) {
    const connector = this.getActiveConnector(connectorKey, tenantId);
    
    if (!connector) {
      throw new Error(`Não conectado a ${connectorKey}`);
    }

    if (direction === 'from') {
      return await connector.syncProductsFromExternal();
    } else {
      if (!products) {
        throw new Error('Produtos não fornecidos para sincronização');
      }
      return await connector.syncProductsToExternal(products);
    }
  }

  /**
   * Sincronizar pedidos de um sistema externo
   */
  public async syncOrders(connectorKey: string, tenantId: string) {
    const connector = this.getActiveConnector(connectorKey, tenantId);
    
    if (!connector) {
      throw new Error(`Não conectado a ${connectorKey}`);
    }

    return await connector.syncOrdersFromExternal();
  }

  /**
   * Atualizar estoque em um sistema externo
   */
  public async updateStock(connectorKey: string, tenantId: string, productId: string, quantity: number) {
    const connector = this.getActiveConnector(connectorKey, tenantId);
    
    if (!connector) {
      throw new Error(`Não conectado a ${connectorKey}`);
    }

    return await connector.updateStockInExternal(productId, quantity);
  }

  /**
   * Obter status de todas as conexões ativas
   */
  public async getConnectionsStatus(tenantId: string): Promise<Array<{
    connector: string;
    connected: boolean;
    lastSync: Date;
    status: string;
    message?: string;
  }>> {
    const status = [];

    for (const [key, connector] of this.activeConnections.entries()) {
      if (key.endsWith(`_${tenantId}`)) {
        const connectorKey = key.replace(`_${tenantId}`, '');
        const lastSyncStatus = await connector.getLastSyncStatus();
        
        status.push({
          connector: connectorKey,
          connected: connector.isConnected(),
          lastSync: lastSyncStatus.lastSync,
          status: lastSyncStatus.status,
          message: lastSyncStatus.message
        });
      }
    }

    return status;
  }
}
