import MercadoLivreIntegration from '../models/MercadoLivreIntegration';
import MercadoLivreOrderService from './MercadoLivreOrderService';
import MercadoLivreProductService from './MercadoLivreProductService';
import { logInfo, logError } from '../middleware/logger';

// Importação dinâmica de node-cron será feita no método start()

class SyncScheduler {
  private static jobs: Map<string, any> = new Map();

  /**
   * Inicia o scheduler de sincronização automática
   */
  static async start(): Promise<void> {
    try {
      const cron = await import('node-cron');
      
      logInfo('Iniciando scheduler de sincronização automática');

      // Sincronização de pedidos a cada 15 minutos
      const ordersJob = cron.default.schedule('*/15 * * * *', async () => {
        await this.syncAllOrders();
      });

      this.jobs.set('orders', ordersJob);

      // Sincronização de produtos a cada 30 minutos
      const productsJob = cron.default.schedule('*/30 * * * *', async () => {
        await this.syncAllProducts();
      });

      this.jobs.set('products', productsJob);

      logInfo('Scheduler iniciado com sucesso');
    } catch (error: any) {
      logError('Erro ao iniciar scheduler. node-cron pode não estar instalado.', error);
      console.warn('⚠️  Sincronização automática desabilitada. Instale node-cron: pnpm add node-cron');
    }
  }

  /**
   * Para o scheduler
   */
  static stop(): void {
    logInfo('Parando scheduler de sincronização');
    this.jobs.forEach((job) => job.stop());
    this.jobs.clear();
  }

  /**
   * Sincroniza pedidos de todas as integrações ativas
   */
  private static async syncAllOrders(): Promise<void> {
    try {
      logInfo('Iniciando sincronização automática de pedidos');

      // Busca todas as integrações ativas
      const integrations = await MercadoLivreIntegration.findAll({
        where: { isActive: true },
      });

      for (const integration of integrations) {
        try {
          // Sincroniza apenas pedidos das últimas 24 horas
          const dateFrom = new Date();
          dateFrom.setHours(dateFrom.getHours() - 24);

          const result = await MercadoLivreOrderService.syncOrders(integration, {
            dateFrom,
          });

          logInfo('Pedidos sincronizados', {
            tenantId: integration.tenantId,
            imported: result.imported,
            updated: result.updated,
            errors: result.errors,
          });

          // Atualiza última sincronização
          await integration.update({ lastSync: new Date() });
        } catch (error: any) {
          logError('Erro ao sincronizar pedidos', error, {
            tenantId: integration.tenantId,
            integrationId: integration.id,
          });
        }
      }
    } catch (error: any) {
      logError('Erro na sincronização automática de pedidos', error);
    }
  }

  /**
   * Sincroniza produtos de todas as integrações ativas
   */
  private static async syncAllProducts(): Promise<void> {
    try {
      logInfo('Iniciando sincronização automática de produtos');

      const integrations = await MercadoLivreIntegration.findAll({
        where: { isActive: true },
      });

      for (const integration of integrations) {
        try {
          const result = await MercadoLivreProductService.syncProducts(integration);

          logInfo('Produtos sincronizados', {
            tenantId: integration.tenantId,
            imported: result.imported,
            updated: result.updated,
            errors: result.errors,
          });
        } catch (error: any) {
          logError('Erro ao sincronizar produtos', error, {
            tenantId: integration.tenantId,
            integrationId: integration.id,
          });
        }
      }
    } catch (error: any) {
      logError('Erro na sincronização automática de produtos', error);
    }
  }

  /**
   * Agenda sincronização personalizada para uma integração
   */
  static async scheduleCustomSync(
    integrationId: number,
    cronExpression: string,
    syncType: 'orders' | 'products' | 'both'
  ): Promise<void> {
    try {
      const cron = await import('node-cron');
      
      const jobId = `custom_${integrationId}_${syncType}`;

      // Remove job existente se houver
      const existingJob = this.jobs.get(jobId);
      if (existingJob) {
        existingJob.stop();
      }

      const job = cron.default.schedule(cronExpression, async () => {
      try {
        const integration = await MercadoLivreIntegration.findByPk(integrationId);
        if (!integration || !integration.isActive) {
          return;
        }

        if (syncType === 'orders' || syncType === 'both') {
          await MercadoLivreOrderService.syncOrders(integration);
        }

        if (syncType === 'products' || syncType === 'both') {
          await MercadoLivreProductService.syncProducts(integration);
        }

        await integration.update({ lastSync: new Date() });
      } catch (error: any) {
        logError('Erro em sincronização personalizada', error, { integrationId, syncType });
      }
    });

      this.jobs.set(jobId, job);
      logInfo('Sincronização personalizada agendada', { integrationId, cronExpression, syncType });
    } catch (error: any) {
      logError('Erro ao agendar sincronização personalizada', error);
      throw error;
    }
  }
}

export default SyncScheduler;
