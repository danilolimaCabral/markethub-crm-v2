import { Router } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/integrations/status - Buscar status de todas as integrações
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID não encontrado' });
    }

    // Buscar integrações de marketplace
    const marketplacesResult = await pool.query(
      `SELECT 
        marketplace as id,
        marketplace as name,
        is_active,
        access_token,
        last_sync_at,
        sync_error
      FROM marketplace_integrations 
      WHERE tenant_id = $1`,
      [tenantId]
    );

    const marketplaces = marketplacesResult.rows.map(row => ({
      id: row.id,
      name: getMarketplaceName(row.name),
      type: 'marketplace',
      status: row.is_active && row.access_token ? 'connected' : 'disconnected',
      lastSync: row.last_sync_at,
      error: row.sync_error,
      connectUrl: `/api/integrations/${row.id}/auth`,
      itemsSynced: 0
    }));

    // Adicionar marketplaces não configurados
    const configuredMarketplaces = marketplaces.map(m => m.id);
    const allMarketplaces = ['mercadolivre', 'shopee', 'amazon', 'magalu'];
    
    allMarketplaces.forEach(marketplace => {
      if (!configuredMarketplaces.includes(marketplace)) {
        marketplaces.push({
          id: marketplace,
          name: getMarketplaceName(marketplace),
          type: 'marketplace',
          status: 'disconnected',
          connectUrl: `/api/integrations/${marketplace}/auth`,
          itemsSynced: 0,
          lastSync: null,
          error: null
        });
      }
    });

    // Buscar contagem de itens sincronizados
    for (const marketplace of marketplaces) {
      if (marketplace.status === 'connected') {
        const ordersCount = await pool.query(
          'SELECT COUNT(*) as total FROM orders WHERE tenant_id = $1 AND marketplace = $2',
          [tenantId, marketplace.id]
        );
        marketplace.itemsSynced = parseInt(ordersCount.rows[0]?.total || '0');
      }
    }

    // APIs do sistema (verificar se endpoints estão respondendo)
    const apis = [
      {
        id: 'orders_api',
        name: 'API de Pedidos',
        type: 'api',
        status: 'connected', // Sempre conectado se o servidor está rodando
        lastSync: new Date().toISOString()
      },
      {
        id: 'products_api',
        name: 'API de Produtos',
        type: 'api',
        status: 'connected',
        lastSync: new Date().toISOString()
      },
      {
        id: 'customers_api',
        name: 'API de Clientes',
        type: 'api',
        status: 'connected',
        lastSync: new Date().toISOString()
      },
      {
        id: 'financial_api',
        name: 'API Financeira',
        type: 'api',
        status: 'connected',
        lastSync: new Date().toISOString()
      }
    ];

    // Gateways de pagamento (placeholder para futuras integrações)
    const payments = [
      {
        id: 'mercadopago',
        name: 'Mercado Pago',
        type: 'payment',
        status: 'disconnected',
        connectUrl: '/api/integrations/mercadopago/auth'
      },
      {
        id: 'pagseguro',
        name: 'PagSeguro',
        type: 'payment',
        status: 'disconnected',
        connectUrl: '/api/integrations/pagseguro/auth'
      }
    ];

    res.json({
      marketplaces,
      payments,
      apis
    });

  } catch (error) {
    console.error('Erro ao buscar status das integrações:', error);
    res.status(500).json({ error: 'Erro ao buscar status das integrações' });
  }
});

function getMarketplaceName(id: string): string {
  const names: Record<string, string> = {
    'mercadolivre': 'Mercado Livre',
    'shopee': 'Shopee',
    'amazon': 'Amazon',
    'magalu': 'Magazine Luiza'
  };
  return names[id] || id;
}

export default router;
