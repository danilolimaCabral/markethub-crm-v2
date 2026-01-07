import { pool } from '../config/database';
import axios from 'axios';

interface HealthCheckResult {
  connected: boolean;
  lastSync?: Date;
  productsCount?: number;
  ordersCount?: number;
  error?: string;
  warnings?: string[];
}

export class IntegrationHealthCheckService {
  /**
   * Verifica o status de saúde da integração com o Mercado Livre
   */
  static async checkMercadoLivreHealth(tenantId: string): Promise<HealthCheckResult> {
    try {
      // 1. Verificar se há credenciais válidas
      const [credentials] = await pool.query(
        `SELECT access_token, refresh_token, expires_at, user_id
         FROM marketplace_credentials
         WHERE tenant_id = ? AND marketplace = 'mercadolivre' AND status = 'active'
         LIMIT 1`,
        [tenantId]
      );

      if (!credentials || credentials.length === 0) {
        return {
          connected: false,
          error: 'Nenhuma credencial ativa encontrada'
        };
      }

      const cred = credentials[0];

      // 2. Verificar se o token está expirado
      const now = new Date();
      const expiresAt = new Date(cred.expires_at);

      if (now >= expiresAt) {
        return {
          connected: false,
          error: 'Token de acesso expirado. Reconecte sua conta.',
          warnings: ['Será necessário renovar a autorização']
        };
      }

      // 3. Testar conexão com a API do Mercado Livre
      try {
        const response = await axios.get(`https://api.mercadolibre.com/users/${cred.user_id}`, {
          headers: {
            'Authorization': `Bearer ${cred.access_token}`
          },
          timeout: 5000
        });

        if (response.status !== 200) {
          throw new Error('API retornou status inválido');
        }
      } catch (apiError: any) {
        if (apiError.response?.status === 401) {
          return {
            connected: false,
            error: 'Token inválido ou revogado',
            warnings: ['Reconecte sua conta do Mercado Livre']
          };
        }
        throw apiError;
      }

      // 4. Obter estatísticas de sincronização
      const [stats] = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM produtos WHERE tenant_id = ? AND origem = 'mercadolivre') as products_count,
          (SELECT COUNT(*) FROM pedidos WHERE tenant_id = ? AND marketplace = 'mercadolivre') as orders_count,
          (SELECT MAX(updated_at) FROM produtos WHERE tenant_id = ? AND origem = 'mercadolivre') as last_product_sync,
          (SELECT MAX(updated_at) FROM pedidos WHERE tenant_id = ? AND marketplace = 'mercadolivre') as last_order_sync
        `,
        [tenantId, tenantId, tenantId, tenantId]
      );

      const lastSync = stats[0].last_product_sync || stats[0].last_order_sync;
      const warnings: string[] = [];

      // 5. Verificar se há sincronização recente
      if (lastSync) {
        const hoursSinceSync = (now.getTime() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
        if (hoursSinceSync > 24) {
          warnings.push('Última sincronização há mais de 24 horas');
        }
      } else {
        warnings.push('Nenhuma sincronização realizada ainda');
      }

      return {
        connected: true,
        lastSync: lastSync ? new Date(lastSync) : undefined,
        productsCount: stats[0].products_count || 0,
        ordersCount: stats[0].orders_count || 0,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error: any) {
      console.error('Erro ao verificar saúde da integração:', error);
      return {
        connected: false,
        error: 'Erro ao verificar status da integração',
        warnings: [error.message]
      };
    }
  }

  /**
   * Testa a conexão antes de salvar as credenciais
   */
  static async testConnection(accessToken: string, userId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await axios.get(`https://api.mercadolibre.com/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 5000
      });

      if (response.status === 200 && response.data.id) {
        return { valid: true };
      }

      return {
        valid: false,
        error: 'Resposta inválida da API do Mercado Livre'
      };

    } catch (error: any) {
      console.error('Erro ao testar conexão:', error);
      
      if (error.response?.status === 401) {
        return {
          valid: false,
          error: 'Token de acesso inválido ou expirado'
        };
      }

      if (error.code === 'ECONNABORTED') {
        return {
          valid: false,
          error: 'Tempo limite de conexão excedido'
        };
      }

      return {
        valid: false,
        error: 'Erro ao conectar com o Mercado Livre'
      };
    }
  }

  /**
   * Monitora a saúde de todas as integrações de um tenant
   */
  static async monitorAllIntegrations(tenantId: string) {
    const results = {
      mercadolivre: await this.checkMercadoLivreHealth(tenantId),
      // Adicionar outras integrações aqui no futuro
      // amazon: await this.checkAmazonHealth(tenantId),
      // shopee: await this.checkShopeeHealth(tenantId),
    };

    return results;
  }
}
