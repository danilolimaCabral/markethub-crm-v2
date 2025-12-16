import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

// Listar todas as plataformas
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const result = await pool.query(`
      SELECT 
        p.*,
        COUNT(DISTINCT i.id) as instances_count,
        COUNT(DISTINCT c.id) as active_contracts,
        COALESCE(SUM(c.mrr_value), 0) as total_mrr
      FROM platforms p
      LEFT JOIN instances i ON i.platform_id = p.id
      LEFT JOIN contracts c ON c.instance_id = i.id AND c.status = 'active'
      WHERE p.tenant_id = $1
      GROUP BY p.id
      ORDER BY p.name
    `, [tenantId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar plataformas:', error);
    res.status(500).json({ error: 'Erro ao listar plataformas' });
  }
});

// Obter plataforma por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    const result = await pool.query(`
      SELECT 
        p.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', i.id,
          'name', i.name,
          'client_name', cl.name,
          'status', i.status,
          'url', i.url
        )) FILTER (WHERE i.id IS NOT NULL) as instances
      FROM platforms p
      LEFT JOIN instances i ON i.platform_id = p.id
      LEFT JOIN ct_clients cl ON cl.id = i.client_id
      WHERE p.id = $1 AND p.tenant_id = $2
      GROUP BY p.id
    `, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plataforma não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter plataforma:', error);
    res.status(500).json({ error: 'Erro ao obter plataforma' });
  }
});

// Criar nova plataforma
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { name, description, stack, version, roadmap, sla_hours } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    const result = await pool.query(`
      INSERT INTO platforms (tenant_id, name, description, stack, version, roadmap, sla_hours, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [tenantId, name, description, stack, version, roadmap, sla_hours || 24, userId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar plataforma:', error);
    res.status(500).json({ error: 'Erro ao criar plataforma' });
  }
});

// Atualizar plataforma
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const { name, description, stack, version, roadmap, sla_hours, is_active } = req.body;
    
    const result = await pool.query(`
      UPDATE platforms 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          stack = COALESCE($3, stack),
          version = COALESCE($4, version),
          roadmap = COALESCE($5, roadmap),
          sla_hours = COALESCE($6, sla_hours),
          is_active = COALESCE($7, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND tenant_id = $9
      RETURNING *
    `, [name, description, stack, version, roadmap, sla_hours, is_active, id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plataforma não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar plataforma:', error);
    res.status(500).json({ error: 'Erro ao atualizar plataforma' });
  }
});

// Excluir plataforma
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    // Verificar se há instâncias vinculadas
    const instancesCheck = await pool.query(
      'SELECT COUNT(*) FROM instances WHERE platform_id = $1',
      [id]
    );
    
    if (parseInt(instancesCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir plataforma com instâncias vinculadas' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM platforms WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plataforma não encontrada' });
    }
    
    res.json({ message: 'Plataforma excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir plataforma:', error);
    res.status(500).json({ error: 'Erro ao excluir plataforma' });
  }
});

// Dashboard de métricas da plataforma
router.get('/:id/metrics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    // MRR e contratos ativos
    const contractsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE c.status = 'active') as active_contracts,
        COALESCE(SUM(c.mrr_value) FILTER (WHERE c.status = 'active'), 0) as total_mrr
      FROM contracts c
      JOIN instances i ON i.id = c.instance_id
      WHERE i.platform_id = $1 AND i.tenant_id = $2
    `, [id, tenantId]);
    
    // Demandas por status
    const demandsResult = await pool.query(`
      SELECT 
        d.status,
        COUNT(*) as count
      FROM demands d
      JOIN instances i ON i.id = d.instance_id
      WHERE i.platform_id = $1 AND i.tenant_id = $2
      GROUP BY d.status
    `, [id, tenantId]);
    
    // Horas trabalhadas no mês
    const hoursResult = await pool.query(`
      SELECT 
        COALESCE(SUM(w.duration_minutes) / 60.0, 0) as total_hours,
        COALESCE(SUM(w.duration_minutes) FILTER (WHERE w.is_billable = true) / 60.0, 0) as billable_hours
      FROM worklogs w
      JOIN demands d ON d.id = w.demand_id
      JOIN instances i ON i.id = d.instance_id
      WHERE i.platform_id = $1 
        AND i.tenant_id = $2
        AND w.start_time >= DATE_TRUNC('month', CURRENT_DATE)
    `, [id, tenantId]);
    
    // SLA compliance
    const slaResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE d.closed_at <= d.sla_deadline) as met,
        COUNT(*) FILTER (WHERE d.closed_at > d.sla_deadline) as breached,
        COUNT(*) as total
      FROM demands d
      JOIN instances i ON i.id = d.instance_id
      WHERE i.platform_id = $1 
        AND i.tenant_id = $2
        AND d.status = 'closed'
        AND d.sla_deadline IS NOT NULL
        AND d.closed_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
    `, [id, tenantId]);
    
    res.json({
      contracts: contractsResult.rows[0],
      demands_by_status: demandsResult.rows,
      hours: hoursResult.rows[0],
      sla: slaResult.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter métricas da plataforma:', error);
    res.status(500).json({ error: 'Erro ao obter métricas' });
  }
});

export default router;
