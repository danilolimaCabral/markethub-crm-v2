import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Middleware para verificar se é admin master
const isAdminMaster = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  
  // Verificar se é o email do admin master
  if (user.email === 'admin@markethubcrm.com.br') {
    return next();
  }
  
  return res.status(403).json({ 
    error: 'Acesso negado. Apenas admin master pode acessar.' 
  });
};

// GET /api/admin-master/tenants - Listar todos os tenants
router.get('/tenants', authenticateToken, isAdminMaster, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.nome_empresa,
        t.slug,
        t.email_contato,
        t.plano,
        t.status,
        t.criado_em,
        t.atualizado_em,
        t.limite_usuarios,
        t.limite_produtos,
        t.limite_pedidos_mes,
        t.usuarios_ativos,
        t.produtos_cadastrados,
        t.pedidos_mes_atual,
        COUNT(DISTINCT u.id) as total_usuarios
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id AND u.deletado_em IS NULL
      GROUP BY t.id
      ORDER BY t.criado_em DESC
    `);

    res.json({
      success: true,
      tenants: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ 
      error: 'Erro ao listar tenants',
      message: error.message 
    });
  }
});

// GET /api/admin-master/tenants/:id - Detalhes de um tenant específico
router.get('/tenants/:id', authenticateToken, isAdminMaster, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar tenant
    const tenantResult = await pool.query(`
      SELECT * FROM tenants WHERE id = $1
    `, [id]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar usuários do tenant
    const usersResult = await pool.query(`
      SELECT 
        id,
        email,
        full_name,
        username,
        role,
        is_active,
        criado_em,
        ultimo_acesso
      FROM users
      WHERE tenant_id = $1 AND deletado_em IS NULL
      ORDER BY criado_em DESC
    `, [id]);

    // Buscar estatísticas
    const statsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products WHERE tenant_id = $1 AND deletado_em IS NULL) as total_produtos,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $1) as total_pedidos,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = $1 AND deletado_em IS NULL) as total_clientes
    `, [id]);

    res.json({
      success: true,
      tenant: tenantResult.rows[0],
      users: usersResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao buscar detalhes do tenant:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar detalhes do tenant',
      message: error.message 
    });
  }
});

// PUT /api/admin-master/tenants/:id - Atualizar tenant
router.put('/tenants/:id', authenticateToken, isAdminMaster, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      nome_empresa, 
      email_contato, 
      plano, 
      status,
      limite_usuarios,
      limite_produtos,
      limite_pedidos_mes
    } = req.body;

    const result = await pool.query(`
      UPDATE tenants
      SET 
        nome_empresa = COALESCE($1, nome_empresa),
        email_contato = COALESCE($2, email_contato),
        plano = COALESCE($3, plano),
        status = COALESCE($4, status),
        limite_usuarios = COALESCE($5, limite_usuarios),
        limite_produtos = COALESCE($6, limite_produtos),
        limite_pedidos_mes = COALESCE($7, limite_pedidos_mes),
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [nome_empresa, email_contato, plano, status, limite_usuarios, limite_produtos, limite_pedidos_mes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    res.json({
      success: true,
      tenant: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao atualizar tenant:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar tenant',
      message: error.message 
    });
  }
});

// GET /api/admin-master/stats - Estatísticas gerais do sistema
router.get('/stats', authenticateToken, isAdminMaster, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM tenants WHERE status = 'active') as tenants_ativos,
        (SELECT COUNT(*) FROM tenants WHERE status = 'trial') as tenants_trial,
        (SELECT COUNT(*) FROM tenants WHERE status = 'suspended') as tenants_suspensos,
        (SELECT COUNT(*) FROM users WHERE deletado_em IS NULL) as total_usuarios,
        (SELECT COUNT(*) FROM products WHERE deletado_em IS NULL) as total_produtos,
        (SELECT COUNT(*) FROM orders) as total_pedidos
    `);

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      message: error.message 
    });
  }
});

export default router;
