import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/metrics - Métricas do dashboard
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    // Buscar tenant_id do usuário
    const userResult = await pool.query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const tenantId = userResult.rows[0].tenant_id;
    
    // Buscar métricas
    const metricsResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $1 AND status IN ('pending', 'processing')) as pedidos_pendentes,
        (SELECT COUNT(*) FROM products WHERE tenant_id = $1 AND is_active = true) as produtos_ativos,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders 
         WHERE tenant_id = $1 
         AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as faturamento_mes,
        (SELECT CASE 
           WHEN COUNT(*) > 0 
           THEN (COUNT(CASE WHEN status = 'shipped' THEN 1 END)::float / COUNT(*)::float * 100)
           ELSE 0 
         END
         FROM orders WHERE tenant_id = $1) as taxa_conferencia`,
      [tenantId]
    );
    
    const metrics = metricsResult.rows[0];
    
    res.json({
      pedidosPendentes: parseInt(metrics.pedidos_pendentes) || 0,
      produtosAtivos: parseInt(metrics.produtos_ativos) || 0,
      faturamentoMes: parseFloat(metrics.faturamento_mes) || 0,
      taxaConferencia: parseFloat(metrics.taxa_conferencia) || 0
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ message: 'Erro ao buscar métricas' });
  }
});

export default router;
