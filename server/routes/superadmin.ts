import express from 'express';
import os from 'os';

const router = express.Router();

// Dados mock em memória
const mockTenants = [
  {
    id: 1,
    name: 'Comex Brasil Smart',
    slug: 'comex-brasil',
    is_active: true,
    created_at: new Date('2025-01-15'),
    total_users: 5,
    total_orders: 127,
    total_products: 45,
    total_revenue: 15420.50,
    errors_24h: 2,
    last_activity: new Date()
  },
  {
    id: 2,
    name: 'Loja Exemplo 1',
    slug: 'loja-exemplo-1',
    is_active: true,
    created_at: new Date('2025-02-01'),
    total_users: 3,
    total_orders: 89,
    total_products: 32,
    total_revenue: 8950.00,
    errors_24h: 0,
    last_activity: new Date()
  },
  {
    id: 3,
    name: 'Loja Exemplo 2',
    slug: 'loja-exemplo-2',
    is_active: false,
    created_at: new Date('2025-01-20'),
    total_users: 2,
    total_orders: 15,
    total_products: 12,
    total_revenue: 1250.00,
    errors_24h: 5,
    last_activity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

const mockLogs = [
  { id: 1, tenant_id: 1, level: 'info', category: 'http', message: 'GET /api/products - 200 OK', created_at: new Date() },
  { id: 2, tenant_id: 1, level: 'error', category: 'database', message: 'Connection timeout', created_at: new Date(Date.now() - 1000 * 60 * 5) },
  { id: 3, tenant_id: 2, level: 'warning', category: 'application', message: 'Low stock alert for product #123', created_at: new Date(Date.now() - 1000 * 60 * 10) },
  { id: 4, tenant_id: 1, level: 'info', category: 'http', message: 'POST /api/orders - 201 Created', created_at: new Date(Date.now() - 1000 * 60 * 15) },
  { id: 5, tenant_id: 3, level: 'critical', category: 'application', message: 'Payment gateway error', created_at: new Date(Date.now() - 1000 * 60 * 20) },
  { id: 6, tenant_id: 2, level: 'info', category: 'http', message: 'GET /api/dashboard - 200 OK', created_at: new Date(Date.now() - 1000 * 60 * 25) },
  { id: 7, tenant_id: 1, level: 'warning', category: 'security', message: 'Multiple failed login attempts', created_at: new Date(Date.now() - 1000 * 60 * 30) },
  { id: 8, tenant_id: 3, level: 'error', category: 'integration', message: 'Mercado Livre API timeout', created_at: new Date(Date.now() - 1000 * 60 * 35) },
  { id: 9, tenant_id: 2, level: 'info', category: 'http', message: 'GET /api/reports - 200 OK', created_at: new Date(Date.now() - 1000 * 60 * 40) },
  { id: 10, tenant_id: 1, level: 'info', category: 'application', message: 'Daily backup completed', created_at: new Date(Date.now() - 1000 * 60 * 45) }
];

// Middleware de autenticação do Super Admin
const superAdminAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const token = authHeader.substring(7);
  
  // Verificar se é o token do super admin
  if (token !== 'super-admin-secret-token-2024') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  next();
};

// Login do Super Admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Credenciais hardcoded
    if (username === 'superadmin' && password === 'SuperAdmin@2024!') {
      res.json({
        success: true,
        token: 'super-admin-secret-token-2024',
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
    const totalTenants = mockTenants.length;
    const activeTenants = mockTenants.filter(t => t.is_active).length;
    const totalErrors = mockLogs.filter(l => l.level === 'error' || l.level === 'critical').length;
    const totalRequests = mockLogs.filter(l => l.category === 'http').length;

    // Métricas do sistema
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    const systemMetrics = {
      cpu_usage: ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2), // Convertendo para segundos
      memory_usage: (memUsage.heapUsed / 1024 / 1024).toFixed(2), // MB
      memory_total: (memUsage.heapTotal / 1024 / 1024).toFixed(2), // MB
      uptime_hours: (uptime / 3600).toFixed(2),
      platform: os.platform(),
      hostname: os.hostname()
    };

    // Erros por tenant
    const errorsByTenant = mockTenants.map(tenant => ({
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      error_count: mockLogs.filter(l => l.tenant_id === tenant.id && (l.level === 'error' || l.level === 'critical')).length,
      warning_count: mockLogs.filter(l => l.tenant_id === tenant.id && l.level === 'warning').length,
      critical_count: mockLogs.filter(l => l.tenant_id === tenant.id && l.level === 'critical').length
    })).filter(e => e.error_count > 0 || e.warning_count > 0 || e.critical_count > 0);

    // Logs recentes
    const recentLogs = mockLogs.slice(0, 10);

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
    res.json({ tenants: mockTenants });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
});

// Detalhes de um tenant específico
router.get('/tenants/:id', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = mockTenants.find(t => t.id === parseInt(id));

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const logs = mockLogs.filter(l => l.tenant_id === parseInt(id));
    const errorsByLevel = {
      info: logs.filter(l => l.level === 'info').length,
      warning: logs.filter(l => l.level === 'warning').length,
      error: logs.filter(l => l.level === 'error').length,
      critical: logs.filter(l => l.level === 'critical').length
    };

    res.json({
      tenant,
      stats: {
        total_users: tenant.total_users,
        total_orders: tenant.total_orders,
        total_products: tenant.total_products,
        total_revenue: tenant.total_revenue
      },
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
      limit = 100
    } = req.query;

    let filteredLogs = [...mockLogs];

    if (tenant_id) {
      filteredLogs = filteredLogs.filter(l => l.tenant_id === parseInt(tenant_id as string));
    }
    if (level) {
      filteredLogs = filteredLogs.filter(l => l.level === level);
    }
    if (category) {
      filteredLogs = filteredLogs.filter(l => l.category === category);
    }

    filteredLogs = filteredLogs.slice(0, parseInt(limit as string));

    res.json({ logs: filteredLogs });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    res.status(500).json({ error: 'Erro ao listar logs' });
  }
});

// Métricas do sistema
router.get('/metrics/system', superAdminAuth, async (req, res) => {
  try {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      cpu_usage: ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2),
      memory_usage: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
      memory_total: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
      uptime_hours: (uptime / 3600).toFixed(2),
      platform: os.platform(),
      hostname: os.hostname(),
      node_version: process.version
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

export default router;
