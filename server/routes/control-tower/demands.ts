import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

// Listar demandas com filtros
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { 
      instance_id, 
      status, 
      type, 
      priority, 
      assigned_to,
      search,
      page = 1, 
      limit = 20 
    } = req.query;
    
    let whereConditions = ['d.tenant_id = $1'];
    let params: any[] = [tenantId];
    let paramIndex = 2;
    
    if (instance_id) {
      whereConditions.push(`d.instance_id = $${paramIndex++}`);
      params.push(instance_id);
    }
    if (status) {
      whereConditions.push(`d.status = $${paramIndex++}`);
      params.push(status);
    }
    if (type) {
      whereConditions.push(`d.type = $${paramIndex++}`);
      params.push(type);
    }
    if (priority) {
      whereConditions.push(`d.priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (assigned_to) {
      whereConditions.push(`d.assigned_to = $${paramIndex++}`);
      params.push(assigned_to);
    }
    if (search) {
      whereConditions.push(`(d.title ILIKE $${paramIndex} OR d.demand_number ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM demands d WHERE ${whereConditions.join(' AND ')}
    `, params);
    
    const result = await pool.query(`
      SELECT 
        d.*,
        i.name as instance_name,
        cl.name as client_name,
        p.name as platform_name,
        u.full_name as assigned_to_name,
        COALESCE(SUM(w.duration_minutes) / 60.0, 0) as logged_hours
      FROM demands d
      JOIN instances i ON i.id = d.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      JOIN platforms p ON p.id = i.platform_id
      LEFT JOIN users u ON u.id = d.assigned_to
      LEFT JOIN worklogs w ON w.demand_id = d.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY d.id, i.name, cl.name, p.name, u.full_name
      ORDER BY 
        CASE d.priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        d.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, [...params, limit, offset]);
    
    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar demandas:', error);
    res.status(500).json({ error: 'Erro ao listar demandas' });
  }
});

// Obter demanda por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    
    const result = await pool.query(`
      SELECT 
        d.*,
        i.name as instance_name,
        i.url as instance_url,
        cl.name as client_name,
        cl.contact_email as client_email,
        p.name as platform_name,
        u.full_name as assigned_to_name,
        creator.full_name as created_by_name
      FROM demands d
      JOIN instances i ON i.id = d.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      JOIN platforms p ON p.id = i.platform_id
      LEFT JOIN users u ON u.id = d.assigned_to
      LEFT JOIN users creator ON creator.id = d.created_by
      WHERE d.id = $1 AND d.tenant_id = $2
    `, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }
    
    // Buscar comentários
    const comments = await pool.query(`
      SELECT 
        dc.*,
        u.full_name as author_name
      FROM demand_comments dc
      LEFT JOIN users u ON u.id = dc.created_by
      WHERE dc.demand_id = $1
      ORDER BY dc.created_at ASC
    `, [id]);
    
    // Buscar worklogs
    const worklogs = await pool.query(`
      SELECT 
        w.*,
        u.full_name as user_name
      FROM worklogs w
      JOIN users u ON u.id = w.user_id
      WHERE w.demand_id = $1
      ORDER BY w.start_time DESC
    `, [id]);
    
    // Buscar histórico de status
    const statusHistory = await pool.query(`
      SELECT 
        dsh.*,
        u.full_name as changed_by_name
      FROM demand_status_history dsh
      LEFT JOIN users u ON u.id = dsh.changed_by
      WHERE dsh.demand_id = $1
      ORDER BY dsh.created_at DESC
    `, [id]);
    
    res.json({
      ...result.rows[0],
      comments: comments.rows,
      worklogs: worklogs.rows,
      status_history: statusHistory.rows
    });
  } catch (error) {
    console.error('Erro ao obter demanda:', error);
    res.status(500).json({ error: 'Erro ao obter demanda' });
  }
});

// Criar nova demanda
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { 
      instance_id, 
      title, 
      description, 
      type, 
      priority,
      estimated_hours,
      tags,
      assigned_to,
      requested_by,
      requested_by_email
    } = req.body;
    
    if (!instance_id || !title || !type) {
      return res.status(400).json({ error: 'Instância, título e tipo são obrigatórios' });
    }
    
    // Gerar número da demanda
    const numberResult = await pool.query(
      'SELECT generate_demand_number($1) as demand_number',
      [tenantId]
    );
    const demandNumber = numberResult.rows[0].demand_number;
    
    // Buscar SLA da plataforma
    const slaResult = await pool.query(`
      SELECT p.sla_hours 
      FROM platforms p 
      JOIN instances i ON i.platform_id = p.id 
      WHERE i.id = $1
    `, [instance_id]);
    
    const slaHours = slaResult.rows[0]?.sla_hours || 24;
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + slaHours);
    
    const result = await pool.query(`
      INSERT INTO demands (
        tenant_id, instance_id, demand_number, title, description, 
        type, priority, sla_hours, sla_deadline, estimated_hours,
        tags, assigned_to, requested_by, requested_by_email, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      tenantId, instance_id, demandNumber, title, description,
      type, priority || 'medium', slaHours, slaDeadline, estimated_hours,
      tags, assigned_to, requested_by, requested_by_email, userId
    ]);
    
    // Registrar histórico inicial
    await pool.query(`
      INSERT INTO demand_status_history (demand_id, to_status, changed_by)
      VALUES ($1, 'open', $2)
    `, [result.rows[0].id, userId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar demanda:', error);
    res.status(500).json({ error: 'Erro ao criar demanda' });
  }
});

// Atualizar demanda
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { 
      title, 
      description, 
      type, 
      priority,
      status,
      estimated_hours,
      tags,
      assigned_to
    } = req.body;
    
    // Buscar status atual para histórico
    const currentDemand = await pool.query(
      'SELECT status FROM demands WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (currentDemand.rows.length === 0) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }
    
    const oldStatus = currentDemand.rows[0].status;
    
    // Atualizar demanda
    const result = await pool.query(`
      UPDATE demands 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          type = COALESCE($3, type),
          priority = COALESCE($4, priority),
          status = COALESCE($5, status),
          estimated_hours = COALESCE($6, estimated_hours),
          tags = COALESCE($7, tags),
          assigned_to = COALESCE($8, assigned_to),
          closed_at = CASE WHEN $5 = 'closed' THEN CURRENT_TIMESTAMP ELSE closed_at END,
          closed_by = CASE WHEN $5 = 'closed' THEN $9 ELSE closed_by END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND tenant_id = $11
      RETURNING *
    `, [title, description, type, priority, status, estimated_hours, tags, assigned_to, userId, id, tenantId]);
    
    // Registrar mudança de status se houve
    if (status && status !== oldStatus) {
      await pool.query(`
        INSERT INTO demand_status_history (demand_id, from_status, to_status, changed_by)
        VALUES ($1, $2, $3, $4)
      `, [id, oldStatus, status, userId]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar demanda:', error);
    res.status(500).json({ error: 'Erro ao atualizar demanda' });
  }
});

// Adicionar comentário
router.post('/:id/comments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { content, is_internal, attachments } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Conteúdo é obrigatório' });
    }
    
    // Verificar se demanda existe
    const demandCheck = await pool.query(
      'SELECT id FROM demands WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (demandCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }
    
    const result = await pool.query(`
      INSERT INTO demand_comments (demand_id, content, is_internal, attachments, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, content, is_internal || false, attachments ? JSON.stringify(attachments) : null, userId]);
    
    // Buscar nome do autor
    const authorResult = await pool.query(
      'SELECT full_name FROM users WHERE id = $1',
      [userId]
    );
    
    res.status(201).json({
      ...result.rows[0],
      author_name: authorResult.rows[0]?.full_name
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

// Estatísticas de demandas
router.get('/stats/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    
    // Por status
    const byStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM demands
      WHERE tenant_id = $1
      GROUP BY status
    `, [tenantId]);
    
    // Por tipo
    const byType = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM demands
      WHERE tenant_id = $1
      GROUP BY type
    `, [tenantId]);
    
    // Por prioridade
    const byPriority = await pool.query(`
      SELECT priority, COUNT(*) as count
      FROM demands
      WHERE tenant_id = $1
      GROUP BY priority
    `, [tenantId]);
    
    // SLA compliance
    const slaStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE closed_at <= sla_deadline) as met,
        COUNT(*) FILTER (WHERE closed_at > sla_deadline) as breached,
        COUNT(*) FILTER (WHERE status != 'closed' AND CURRENT_TIMESTAMP > sla_deadline) as at_risk
      FROM demands
      WHERE tenant_id = $1 AND sla_deadline IS NOT NULL
    `, [tenantId]);
    
    // Lead time médio (últimos 30 dias)
    const leadTime = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600) as avg_hours
      FROM demands
      WHERE tenant_id = $1 
        AND status = 'closed' 
        AND closed_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [tenantId]);
    
    res.json({
      by_status: byStatus.rows,
      by_type: byType.rows,
      by_priority: byPriority.rows,
      sla: slaStats.rows[0],
      avg_lead_time_hours: parseFloat(leadTime.rows[0]?.avg_hours || 0).toFixed(2)
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

export default router;
