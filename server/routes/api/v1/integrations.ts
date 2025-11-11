import express from 'express';
import { IntegrationManager } from '../../../integrations/core/IntegrationManager';

const router = express.Router();
const integrationManager = IntegrationManager.getInstance();

/**
 * GET /api/v1/integrations/available
 * Listar conectores disponíveis
 */
router.get('/available', (req, res) => {
  try {
    const connectors = integrationManager.getAvailableConnectors();
    res.json({
      success: true,
      data: connectors
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/connect
 * Conectar a um sistema externo
 */
router.post('/connect', async (req, res) => {
  try {
    const { connector, tenantId, credentials } = req.body;

    if (!connector || !tenantId || !credentials) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros faltando: connector, tenantId, credentials'
      });
    }

    const success = await integrationManager.connect(connector, {
      tenantId,
      credentials
    });

    res.json({
      success,
      message: success ? 'Conectado com sucesso' : 'Falha ao conectar'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/disconnect
 * Desconectar de um sistema externo
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { connector, tenantId } = req.body;

    if (!connector || !tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros faltando: connector, tenantId'
      });
    }

    await integrationManager.disconnect(connector, tenantId);

    res.json({
      success: true,
      message: 'Desconectado com sucesso'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/integrations/status/:tenantId
 * Obter status de todas as integrações de um tenant
 */
router.get('/status/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const status = await integrationManager.getConnectionsStatus(tenantId);

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/sync/products
 * Sincronizar produtos
 */
router.post('/sync/products', async (req, res) => {
  try {
    const { connector, tenantId, direction, products } = req.body;

    if (!connector || !tenantId || !direction) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros faltando: connector, tenantId, direction'
      });
    }

    const result = await integrationManager.syncProducts(
      connector,
      tenantId,
      direction,
      products
    );

    res.json({
      success: result.success,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/sync/orders
 * Sincronizar pedidos
 */
router.post('/sync/orders', async (req, res) => {
  try {
    const { connector, tenantId } = req.body;

    if (!connector || !tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros faltando: connector, tenantId'
      });
    }

    const result = await integrationManager.syncOrders(connector, tenantId);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/update-stock
 * Atualizar estoque em sistema externo
 */
router.post('/update-stock', async (req, res) => {
  try {
    const { connector, tenantId, productId, quantity } = req.body;

    if (!connector || !tenantId || !productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros faltando: connector, tenantId, productId, quantity'
      });
    }

    const success = await integrationManager.updateStock(
      connector,
      tenantId,
      productId,
      quantity
    );

    res.json({
      success,
      message: success ? 'Estoque atualizado' : 'Falha ao atualizar estoque'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
