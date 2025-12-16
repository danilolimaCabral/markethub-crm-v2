import { Router, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

// Dashboard principal do Control Tower
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM platforms WHERE tenant_id = $1 AND is_active = true) as platforms_count,
        (SELECT COUNT(*) FROM ct_clients WHERE tenant_id = $1 AND is_active = true) as clients_count,
        (SELECT COUNT(*) FROM instances WHERE tenant_id = $1 AND status = 'active') as instances_count,
        (SELECT COUNT(*) FROM contracts WHERE tenant_id = $1 AND status = 'active') as contracts_count,
        (SELECT COALESCE(SUM(mrr_value), 0) FROM contracts WHERE tenant_id = $1 AND status = 'active') as total_mrr
    `, [tenantId]);
    
    const demandsByStatus = await pool.query(`
      SELECT status, COUNT(*) as count FROM demands WHERE tenant_id = $1 GROUP BY status
    `, [tenantId]);
    
    const recentDemands = await pool.query(`
      SELECT d.id, d.demand_number, d.title, d.type, d.priority, d.status, d.created_at,
        i.name as instance_name, cl.name as client_name
      FROM demands d
      JOIN instances i ON i.id = d.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      WHERE d.tenant_id = $1 AND d.status NOT IN ('closed', 'cancelled')
      ORDER BY CASE d.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, d.created_at DESC
      LIMIT 10
    `, [tenantId]);
    
    const weeklyHours = await pool.query(`
      SELECT COALESCE(SUM(duration_minutes) / 60.0, 0) as total_hours,
        COALESCE(SUM(duration_minutes) FILTER (WHERE is_billable = true) / 60.0, 0) as billable_hours
      FROM worklogs WHERE tenant_id = $1 AND start_time >= DATE_TRUNC('week', CURRENT_DATE)
    `, [tenantId]);
    
    const expiringContracts = await pool.query(`
      SELECT c.id, c.contract_number, c.title, c.end_date, c.mrr_value, cl.name as client_name
      FROM contracts c
      JOIN instances i ON i.id = c.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      WHERE c.tenant_id = $1 AND c.status = 'active' AND c.end_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY c.end_date ASC LIMIT 5
    `, [tenantId]);
    
    const pendingInvoices = await pool.query(`
      SELECT inv.id, inv.invoice_number, inv.total, inv.due_date, inv.status, cl.name as client_name
      FROM ct_invoices inv
      JOIN instances i ON i.id = inv.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      WHERE inv.tenant_id = $1 AND inv.status IN ('sent', 'overdue')
      ORDER BY inv.due_date ASC LIMIT 5
    `, [tenantId]);
    
    res.json({
      summary: summary.rows[0],
      demands_by_status: demandsByStatus.rows,
      recent_demands: recentDemands.rows,
      weekly_hours: weeklyHours.rows[0],
      expiring_contracts: expiringContracts.rows,
      pending_invoices: pendingInvoices.rows
    });
  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    res.status(500).json({ error: 'Erro ao obter dashboard' });
  }
});

// MRR por plataforma
router.get('/mrr-by-platform', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await pool.query(`
      SELECT p.id, p.name, COUNT(DISTINCT c.id) as contracts_count, COALESCE(SUM(c.mrr_value), 0) as total_mrr
      FROM platforms p
      LEFT JOIN instances i ON i.platform_id = p.id
      LEFT JOIN contracts c ON c.instance_id = i.id AND c.status = 'active'
      WHERE p.tenant_id = $1 AND p.is_active = true
      GROUP BY p.id, p.name ORDER BY total_mrr DESC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter MRR por plataforma' });
  }
});

// SLA compliance
router.get('/sla-compliance', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await pool.query(`
      SELECT DATE_TRUNC('month', closed_at) as month, COUNT(*) as total,
        COUNT(*) FILTER (WHERE closed_at <= sla_deadline) as met,
        COUNT(*) FILTER (WHERE closed_at > sla_deadline) as breached
      FROM demands WHERE tenant_id = $1 AND status = 'closed' AND sla_deadline IS NOT NULL
        AND closed_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', closed_at) ORDER BY month
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter SLA compliance' });
  }
});

// Horas por usuário
router.get('/hours-by-user', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await pool.query(`
      SELECT u.id, u.full_name,
        COALESCE(SUM(w.duration_minutes) / 60.0, 0) as total_hours,
        COALESCE(SUM(w.duration_minutes) FILTER (WHERE w.is_billable = true) / 60.0, 0) as billable_hours
      FROM users u
      LEFT JOIN worklogs w ON w.user_id = u.id AND w.tenant_id = $1
      WHERE u.is_active = true
      GROUP BY u.id, u.full_name ORDER BY total_hours DESC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter horas por usuário' });
  }
});

// Rentabilidade por cliente
router.get('/profitability-by-client', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await pool.query(`
      SELECT cl.id, cl.name,
        COALESCE(SUM(inv.total) FILTER (WHERE inv.status = 'paid'), 0) as total_revenue,
        COALESCE(SUM(w.duration_minutes / 60.0 * u.cost_per_hour), 0) as total_cost
      FROM ct_clients cl
      LEFT JOIN instances i ON i.client_id = cl.id
      LEFT JOIN ct_invoices inv ON inv.instance_id = i.id
      LEFT JOIN demands d ON d.instance_id = i.id
      LEFT JOIN worklogs w ON w.demand_id = d.id
      LEFT JOIN users u ON u.id = w.user_id
      WHERE cl.tenant_id = $1 AND cl.is_active = true
      GROUP BY cl.id, cl.name ORDER BY total_revenue DESC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter rentabilidade' });
  }
});

// Backlog por plataforma
router.get('/backlog-by-platform', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const result = await pool.query(`
      SELECT p.id, p.name,
        COUNT(*) FILTER (WHERE d.status NOT IN ('closed', 'cancelled')) as open_demands,
        COUNT(*) FILTER (WHERE d.type = 'bug' AND d.status NOT IN ('closed', 'cancelled')) as open_bugs,
        COALESCE(SUM(d.estimated_hours) FILTER (WHERE d.status NOT IN ('closed', 'cancelled')), 0) as estimated_hours
      FROM platforms p
      LEFT JOIN instances i ON i.platform_id = p.id
      LEFT JOIN demands d ON d.instance_id = i.id
      WHERE p.tenant_id = $1 AND p.is_active = true
      GROUP BY p.id, p.name ORDER BY open_demands DESC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter backlog' });
  }
});

export default router;
