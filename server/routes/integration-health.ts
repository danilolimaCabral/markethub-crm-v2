import express, { Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { IntegrationHealthCheckService } from '../services/IntegrationHealthCheck';

const router = express.Router();

/**
 * GET /api/integrations/health/mercadolivre
 * Verifica o status de saúde da integração com Mercado Livre
 */
router.get('/mercadolivre', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const tenantId = authReq.user.tenant_id;

    const health = await IntegrationHealthCheckService.checkMercadoLivreHealth(tenantId);

    res.json(health);
  } catch (error: any) {
    console.error('Erro ao verificar saúde da integração:', error);
    res.status(500).json({
      connected: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/integrations/health/all
 * Verifica o status de todas as integrações
 */
router.get('/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const tenantId = authReq.user.tenant_id;

    const health = await IntegrationHealthCheckService.monitorAllIntegrations(tenantId);

    res.json(health);
  } catch (error: any) {
    console.error('Erro ao verificar saúde das integrações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/integrations/test-connection
 * Testa a conexão com o Mercado Livre antes de salvar
 */
router.post('/test-connection', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { accessToken, userId } = req.body;

    if (!accessToken || !userId) {
      return res.status(400).json({
        valid: false,
        error: 'Token de acesso e ID do usuário são obrigatórios'
      });
    }

    const result = await IntegrationHealthCheckService.testConnection(accessToken, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao testar conexão:', error);
    res.status(500).json({
      valid: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
