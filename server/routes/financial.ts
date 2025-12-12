import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/financial/dashboard - Dados financeiros para o dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
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
    
    // Como não temos tabelas de contas a pagar/receber ainda, retornar dados zerados
    // Isso pode ser implementado quando as tabelas forem criadas
    
    res.json({
      saldoAtual: 0,
      aReceber30d: 0,
      aPagar30d: 0,
      contasVencidas: 0,
      totalVencido: 0,
      pagarProximos7Dias: { total: 0, quantidade: 0 },
      pagarProximos15Dias: { total: 0, quantidade: 0 },
      pagarProximos30Dias: { total: 0, quantidade: 0 },
      receberProximos7Dias: { total: 0, quantidade: 0 },
      receberProximos15Dias: { total: 0, quantidade: 0 },
      receberProximos30Dias: { total: 0, quantidade: 0 }
    });
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    res.status(500).json({ message: 'Erro ao buscar dados financeiros' });
  }
});

export default router;
