import express from 'express';
import { SystemLogModel } from '../models/SystemLog';
import { SystemMetricModel } from '../models/SystemMetric';
import pool from '../db';

const router = express.Router();

// Middleware de autenticação do Super Admin
const superAdminAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const token = authHeader.substring(7);
  
  // Verificar se é o token do super admin
  // Em produção, usar JWT ou sessão real
  if (token !== process.env.SUPER_ADMIN_TOKEN || token !== 'super-admin-secret-token-2024') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  next();
};

// Login do Super Admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Credenciais hardcoded (em produção, usar hash bcrypt)
    if (username === 'superadmin' && password === 'SuperAdmin@2024!') {
      res.json({
        success: true,
        token: process.env.SUPER_ADMIN_TOKEN || 'super-admin-secret-token-2024',
        user: {
          username: 'superadmin',
          name: 'Super Administrador',
          role: 'superadmin'
        }
      });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('Erro no login do super admin:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Dashboard - Estatísticas gerais
router.get('/dashboard', superAdminAuth, async (req, res) => {
  try {
    // Total de tenants
    const tenantsResult = await pool.query('SELECT COUNT(*) as total FROM tenants');
    const totalTenants = parseInt(tenantsResult.rows[0].total);

    // Tenants ativos (com atividade nas últimas 24h)
    const activeTenantsResult = await pool.query(`
      SELECT COUNT(DISTINCT tenant_id) as active
      FROM system_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    const activeTenants = parseInt(activeTenantsResult.rows[0].active || 0);

    // Total de erros nas últimas 24h
    const errorsResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM system_logs
      WHERE level IN ('error', 'critical')
        AND created_at >= NOW() - INTERVAL '24 hours'
    `);
    const totalErrors = parseInt(errorsResult.rows[0].total || 0);

    // Total de requests nas últimas 24h
    const requestsResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM system_metrics
      WHERE metric_type = 'request'
        AND created_at >= NOW() - INTERVAL '24 hours'
    `);
    const totalRequests = parseInt(requestsResult.rows[0].total || 0);

    // Métricas do sistema
    const systemMetrics = await SystemMetricModel.getSystemMetrics();

    // Erros por tenant
    const errorsByTenant = await SystemLogModel.errorsByTenant(24);

    // Logs recentes
    const recentLogs = await SystemLogModel.list({ limit: 10 });

    res.json({
      stats: {
        total_tenants: totalTenants,
        active_tenants: activeTenants,
        total_errors: totalErrors,
        total_requests: totalRequests
      },
      system_metrics: systemMetrics,
      errors_by_tenant: errorsByTenant,
      recent_logs: recentLogs
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

// Listar todos os tenants com estatísticas
router.get('/tenants', superAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.slug,
        t.is_active,
        t.created_at,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT p.id) as total_products,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        (
          SELECT COUNT(*)
          FROM system_logs sl
          WHERE sl.tenant_id = t.id
            AND sl.level IN ('error', 'critical')
            AND sl.created_at >= NOW() - INTERVAL '24 hours'
        ) as errors_24h,
        (
          SELECT MAX(created_at)
          FROM system_logs sl
          WHERE sl.tenant_id = t.id
        ) as last_activity
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN orders o ON t.id = o.tenant_id
      LEFT JOIN products p ON t.id = p.tenant_id
      GROUP BY t.id, t.name, t.slug, t.is_active, t.created_at
      ORDER BY t.created_at DESC
    `);

    res.json({ tenants: result.rows });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
});

// Detalhes de um tenant específico
router.get('/tenants/:id', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Informações do tenant
    const tenantResult = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const tenant = tenantResult.rows[0];

    // Estatísticas
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $1) as total_orders,
        (SELECT COUNT(*) FROM products WHERE tenant_id = $1) as total_products,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE tenant_id = $1) as total_revenue
    `, [id]);

    // Logs recentes do tenant
    const logs = await SystemLogModel.list({ tenant_id: parseInt(id), limit: 50 });

    // Erros por nível
    const errorsByLevel = await SystemLogModel.countByLevel(parseInt(id));

    res.json({
      tenant,
      stats: statsResult.rows[0],
      logs,
      errors_by_level: errorsByLevel
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do tenant:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
});

// Listar logs com filtros
router.get('/logs', superAdminAuth, async (req, res) => {
  try {
    const {
      tenant_id,
      level,
      category,
      limit = 100,
      offset = 0,
      start_date,
      end_date
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (tenant_id) filters.tenant_id = parseInt(tenant_id as string);
    if (level) filters.level = level as string;
    if (category) filters.category = category as string;
    if (start_date) filters.start_date = new Date(start_date as string);
    if (end_date) filters.end_date = new Date(end_date as string);

    const logs = await SystemLogModel.list(filters);

    res.json({ logs });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    res.status(500).json({ error: 'Erro ao listar logs' });
  }
});

// Métricas do sistema
router.get('/metrics/system', superAdminAuth, async (req, res) => {
  try {
    const metrics = await SystemMetricModel.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// Métricas de performance
router.get('/metrics/performance', superAdminAuth, async (req, res) => {
  try {
    const { hours = 1 } = req.query;
    const metrics = await SystemMetricModel.getPerformanceMetrics(parseInt(hours as string));
    res.json({ metrics });
  } catch (error) {
    console.error('Erro ao buscar métricas de performance:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// Requests por tenant
router.get('/metrics/requests', superAdminAuth, async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const metrics = await SystemMetricModel.requestsByTenant(parseInt(hours as string));
    res.json({ metrics });
  } catch (error) {
    console.error('Erro ao buscar métricas de requests:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// Limpar logs antigos
router.post('/maintenance/cleanup-logs', superAdminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const deleted = await SystemLogModel.cleanup(days);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    res.status(500).json({ error: 'Erro ao limpar logs' });
  }
});

// Limpar métricas antigas
router.post('/maintenance/cleanup-metrics', superAdminAuth, async (req, res) => {
  try {
    const { days = 7 } = req.body;
    const deleted = await SystemMetricModel.cleanup(days);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Erro ao limpar métricas:', error);
    res.status(500).json({ error: 'Erro ao limpar métricas' });
  }
});

export default router;
