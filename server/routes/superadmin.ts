import express from 'express';
import os from 'os';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = express.Router();

// Configurações de segurança via variáveis de ambiente
const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME || 'superadmin';
const SUPERADMIN_PASSWORD_HASH = process.env.SUPERADMIN_PASSWORD_HASH || '$2b$10$a/L96zEUUp5n1So14c1vmOFflvknXZRlvO8xzGgZYzllW50xsRgo.';
const SUPERADMIN_JWT_SECRET = process.env.SUPERADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = '24h';

// Middleware de autenticação do Super Admin com JWT
const superAdminAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const token = authHeader.substring(7);
  
  try {
    // Verificar e decodificar JWT
    const decoded = jwt.verify(token, SUPERADMIN_JWT_SECRET) as any;
    
    // Verificar se é super admin
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Adicionar informações do usuário à requisição
    req.superAdmin = decoded;
    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

// Login do Super Admin com bcrypt e JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar campos obrigatórios
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    // Verificar username
    if (username !== SUPERADMIN_USERNAME) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha com bcrypt
    const isPasswordValid = await bcrypt.compare(password, SUPERADMIN_PASSWORD_HASH);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar JWT
    const token = jwt.sign(
      {
        username: SUPERADMIN_USERNAME,
        role: 'superadmin',
        name: 'Super Administrador'
      },
      SUPERADMIN_JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        username: SUPERADMIN_USERNAME,
        name: 'Super Administrador',
        role: 'superadmin'
      },
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Erro no login do super admin:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Dashboard - Estatísticas gerais com dados reais
router.get('/dashboard', superAdminAuth, async (req, res) => {
  try {
    // Buscar estatísticas de tenants
    const tenantsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_tenants,
        COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
        COUNT(*) FILTER (WHERE status = 'trial') as trial_tenants,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_tenants,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tenants
      FROM tenants
      WHERE deletado_em IS NULL
    `);

    // Buscar estatísticas por plano
    const planStats = await pool.query(`
      SELECT 
        plano,
        COUNT(*) as count,
        SUM(usuarios_ativos) as total_users,
        SUM(produtos_cadastrados) as total_products,
        SUM(pedidos_mes_atual) as total_orders
      FROM tenants
      WHERE deletado_em IS NULL
      GROUP BY plano
      ORDER BY plano
    `);

    // Buscar logs de erro recentes (últimas 24h)
    const errorLogs = await pool.query(`
      SELECT COUNT(*) as total_errors
      FROM audit_log
      WHERE nivel IN ('error', 'critical')
      AND criado_em > NOW() - INTERVAL '24 hours'
    `);

    // Buscar tenants com mais erros
    const tenantsWithErrors = await pool.query(`
      SELECT 
        t.id,
        t.nome_empresa,
        t.slug,
        COUNT(*) FILTER (WHERE a.nivel = 'error') as error_count,
        COUNT(*) FILTER (WHERE a.nivel = 'warning') as warning_count,
        COUNT(*) FILTER (WHERE a.nivel = 'critical') as critical_count
      FROM tenants t
      LEFT JOIN audit_log a ON a.tenant_id = t.id AND a.criado_em > NOW() - INTERVAL '24 hours'
      WHERE t.deletado_em IS NULL
      GROUP BY t.id, t.nome_empresa, t.slug
      HAVING COUNT(*) FILTER (WHERE a.nivel IN ('error', 'critical', 'warning')) > 0
      ORDER BY COUNT(*) FILTER (WHERE a.nivel = 'critical') DESC, COUNT(*) FILTER (WHERE a.nivel = 'error') DESC
      LIMIT 10
    `);

    // Buscar logs recentes
    const recentLogs = await pool.query(`
      SELECT 
        a.id,
        a.tenant_id,
        t.nome_empresa as tenant_name,
        a.nivel as level,
        a.categoria as category,
        a.mensagem as message,
        a.criado_em as created_at
      FROM audit_log a
      LEFT JOIN tenants t ON t.id = a.tenant_id
      ORDER BY a.criado_em DESC
      LIMIT 20
    `);

    // Métricas do sistema
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Métricas do banco de dados
    const dbStats = await pool.query(`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_connections,
        COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    // Estatísticas de uso por tenant
    const tenantUsage = await pool.query(`
      SELECT 
        COUNT(DISTINCT t.id) as total_tenants,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_revenue
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN products p ON p.tenant_id = t.id
      LEFT JOIN orders o ON o.tenant_id = t.id
      WHERE t.deletado_em IS NULL
    `);

    // Tenants mais ativos (últimos 7 dias)
    const activeTenants = await pool.query(`
      SELECT 
        t.id,
        t.nome_empresa,
        t.slug,
        t.status,
        t.plano,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(o.total), 0) as revenue
      FROM tenants t
      LEFT JOIN orders o ON o.tenant_id = t.id 
        AND (o.created_at > NOW() - INTERVAL '7 days' OR o.criado_em > NOW() - INTERVAL '7 days')
      WHERE t.deletado_em IS NULL
      GROUP BY t.id, t.nome_empresa, t.slug, t.status, t.plano
      ORDER BY orders_count DESC, revenue DESC
      LIMIT 10
    `);

    const systemMetrics = {
      cpu_usage: parseFloat(((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2)),
      memory_usage: parseFloat((memUsage.heapUsed / 1024 / 1024).toFixed(2)),
      memory_total: parseFloat((memUsage.heapTotal / 1024 / 1024).toFixed(2)),
      memory_external: parseFloat((memUsage.external / 1024 / 1024).toFixed(2)),
      uptime_hours: parseFloat((uptime / 3600).toFixed(2)),
      uptime_days: parseFloat((uptime / 86400).toFixed(2)),
      platform: os.platform(),
      hostname: os.hostname(),
      node_version: process.version,
      total_memory: parseFloat((os.totalmem() / 1024 / 1024 / 1024).toFixed(2)), // GB
      free_memory: parseFloat((os.freemem() / 1024 / 1024 / 1024).toFixed(2)), // GB
      cpu_count: os.cpus().length,
      load_average: os.loadavg(),
      database: {
        total_connections: parseInt(dbStats.rows[0]?.total_connections || 0),
        active_connections: parseInt(dbStats.rows[0]?.active_connections || 0),
        idle_connections: parseInt(dbStats.rows[0]?.idle_connections || 0)
      },
      usage: tenantUsage.rows[0] || {},
      top_tenants: activeTenants.rows
    };

    res.json({
      stats: {
        ...tenantsStats.rows[0],
        total_errors_24h: errorLogs.rows[0]?.total_errors || 0,
        total_users: parseInt(systemMetrics.usage.total_users || 0),
        total_products: parseInt(systemMetrics.usage.total_products || 0),
        total_orders: parseInt(systemMetrics.usage.total_orders || 0),
        total_revenue: parseFloat(systemMetrics.usage.total_revenue || 0)
      },
      plan_stats: planStats.rows,
      errors_by_tenant: tenantsWithErrors.rows,
      recent_logs: recentLogs.rows,
      system_metrics: systemMetrics
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard', details: error.message });
  }
});

// Listar todos os tenants com estatísticas reais
router.get('/tenants', superAdminAuth, async (req, res) => {
  try {
    const { status, plano, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        id,
        nome_empresa,
        slug,
        cnpj,
        email_contato,
        telefone,
        plano,
        status,
        data_inicio,
        data_expiracao,
        limite_usuarios,
        limite_produtos,
        limite_pedidos_mes,
        usuarios_ativos,
        produtos_cadastrados,
        pedidos_mes_atual,
        criado_em,
        atualizado_em
      FROM tenants
      WHERE deletado_em IS NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (plano) {
      query += ` AND plano = $${paramIndex}`;
      params.push(plano);
      paramIndex++;
    }

    if (search) {
      query += ` AND (nome_empresa ILIKE $${paramIndex} OR slug ILIKE $${paramIndex} OR cnpj ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Buscar total de registros
    let countQuery = `SELECT COUNT(*) FROM tenants WHERE deletado_em IS NULL`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (plano) {
      countQuery += ` AND plano = $${countParamIndex}`;
      countParams.push(plano);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (nome_empresa ILIKE $${countParamIndex} OR slug ILIKE $${countParamIndex} OR cnpj ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      tenants: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Erro ao listar tenants', details: error.message });
  }
});

// Detalhes de um tenant específico com dados reais
router.get('/tenants/:id', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar tenant
    const tenantResult = await pool.query(`
      SELECT * FROM tenants WHERE id = $1
    `, [id]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const tenant = tenantResult.rows[0];

    // Buscar estatísticas detalhadas
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
        (SELECT COUNT(*) FROM products WHERE tenant_id = $1) as total_products,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $1) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $1 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as orders_this_month,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE tenant_id = $1) as total_revenue,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE tenant_id = $1 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as revenue_this_month
    `, [id]);

    // Buscar logs recentes do tenant
    const logs = await pool.query(`
      SELECT 
        id,
        nivel as level,
        categoria as category,
        mensagem as message,
        criado_em as created_at
      FROM audit_log
      WHERE tenant_id = $1
      ORDER BY criado_em DESC
      LIMIT 50
    `, [id]);

    // Contar logs por nível
    const errorsByLevel = await pool.query(`
      SELECT 
        nivel as level,
        COUNT(*) as count
      FROM audit_log
      WHERE tenant_id = $1
      AND criado_em > NOW() - INTERVAL '7 days'
      GROUP BY nivel
    `, [id]);

    const errorsMap = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0
    };

    errorsByLevel.rows.forEach(row => {
      errorsMap[row.level] = parseInt(row.count);
    });

    res.json({
      tenant,
      stats: stats.rows[0],
      logs: logs.rows,
      errors_by_level: errorsMap
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do tenant:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes', details: error.message });
  }
});

// Atualizar status de um tenant
router.patch('/tenants/:id/status', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['trial', 'active', 'suspended', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    await pool.query(`
      UPDATE tenants
      SET status = $1, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $2 AND deletado_em IS NULL
    `, [status, id]);

    res.json({ success: true, message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status', details: error.message });
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
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        a.id,
        a.tenant_id,
        t.nome_empresa as tenant_name,
        a.nivel as level,
        a.categoria as category,
        a.mensagem as message,
        a.criado_em as created_at
      FROM audit_log a
      LEFT JOIN tenants t ON t.id = a.tenant_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (tenant_id) {
      query += ` AND a.tenant_id = $${paramIndex}`;
      params.push(tenant_id);
      paramIndex++;
    }

    if (level) {
      query += ` AND a.nivel = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }

    if (category) {
      query += ` AND a.categoria = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY a.criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    res.status(500).json({ error: 'Erro ao listar logs', details: error.message });
  }
});

// Métricas do sistema
router.get('/metrics/system', superAdminAuth, async (req, res) => {
  try {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Buscar métricas do banco de dados
    const dbStats = await pool.query(`
      SELECT 
        COUNT(*) as total_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    res.json({
      cpu_usage: parseFloat(((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2)),
      memory_usage: parseFloat((memUsage.heapUsed / 1024 / 1024).toFixed(2)),
      memory_total: parseFloat((memUsage.heapTotal / 1024 / 1024).toFixed(2)),
      uptime_hours: parseFloat((uptime / 3600).toFixed(2)),
      platform: os.platform(),
      hostname: os.hostname(),
      node_version: process.version,
      database_connections: dbStats.rows[0].total_connections
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas', details: error.message });
  }
});

// Verificar status do token (útil para frontend)
router.get('/verify', superAdminAuth, async (req, res) => {
  try {
    res.json({
      valid: true,
      user: req.superAdmin
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ error: 'Erro ao verificar token' });
  }
});

export default router;
