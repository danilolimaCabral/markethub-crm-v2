import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

// Listar worklogs com filtros
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { 
      demand_id, 
      user_id,
      start_date,
      end_date,
      is_approved,
      is_billable,
      page = 1, 
      limit = 50 
    } = req.query;
    
    let whereConditions = ['w.tenant_id = $1'];
    let params: any[] = [tenantId];
    let paramIndex = 2;
    
    if (demand_id) {
      whereConditions.push(`w.demand_id = $${paramIndex++}`);
      params.push(demand_id);
    }
    if (user_id) {
      whereConditions.push(`w.user_id = $${paramIndex++}`);
      params.push(user_id);
    }
    if (start_date) {
      whereConditions.push(`w.start_time >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push(`w.start_time <= $${paramIndex++}`);
      params.push(end_date);
    }
    if (is_approved !== undefined) {
      whereConditions.push(`w.is_approved = $${paramIndex++}`);
      params.push(is_approved === 'true');
    }
    if (is_billable !== undefined) {
      whereConditions.push(`w.is_billable = $${paramIndex++}`);
      params.push(is_billable === 'true');
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await pool.query(`
      SELECT 
        w.*,
        u.full_name as user_name,
        d.demand_number,
        d.title as demand_title,
        i.name as instance_name,
        p.name as platform_name,
        approver.full_name as approved_by_name
      FROM worklogs w
      JOIN users u ON u.id = w.user_id
      LEFT JOIN demands d ON d.id = w.demand_id
      LEFT JOIN instances i ON i.id = d.instance_id
      LEFT JOIN platforms p ON p.id = i.platform_id
      LEFT JOIN users approver ON approver.id = w.approved_by
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY w.start_time DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, [...params, limit, offset]);
    
    // Totais
    const totals = await pool.query(`
      SELECT 
        COALESCE(SUM(duration_minutes), 0) as total_minutes,
        COALESCE(SUM(duration_minutes) FILTER (WHERE is_billable = true), 0) as billable_minutes,
        COALESCE(SUM(duration_minutes) FILTER (WHERE is_approved = true), 0) as approved_minutes
      FROM worklogs w
      WHERE ${whereConditions.join(' AND ')}
    `, params);
    
    res.json({
      data: result.rows,
      totals: {
        total_hours: (parseInt(totals.rows[0].total_minutes) / 60).toFixed(2),
        billable_hours: (parseInt(totals.rows[0].billable_minutes) / 60).toFixed(2),
        approved_hours: (parseInt(totals.rows[0].approved_minutes) / 60).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Erro ao listar worklogs:', error);
    res.status(500).json({ error: 'Erro ao listar worklogs' });
  }
});

// Obter timer ativo do usuário
router.get('/timer/active', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const result = await pool.query(`
      SELECT 
        at.*,
        d.demand_number,
        d.title as demand_title
      FROM active_timers at
      LEFT JOIN demands d ON d.id = at.demand_id
      WHERE at.user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ active: false });
    }
    
    const timer = result.rows[0];
    const elapsedMinutes = Math.floor(
      (new Date().getTime() - new Date(timer.start_time).getTime()) / 60000
    );
    
    res.json({
      active: true,
      timer: {
        ...timer,
        elapsed_minutes: elapsedMinutes
      }
    });
  } catch (error) {
    console.error('Erro ao obter timer ativo:', error);
    res.status(500).json({ error: 'Erro ao obter timer ativo' });
  }
});

// Iniciar timer
router.post('/timer/start', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { demand_id, activity_type, description } = req.body;
    
    // Verificar se já existe timer ativo
    const existingTimer = await pool.query(
      'SELECT id FROM active_timers WHERE user_id = $1',
      [userId]
    );
    
    if (existingTimer.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe um timer ativo. Pare o timer atual antes de iniciar um novo.' });
    }
    
    const result = await pool.query(`
      INSERT INTO active_timers (tenant_id, user_id, demand_id, activity_type, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [tenantId, userId, demand_id, activity_type || 'development', description]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao iniciar timer:', error);
    res.status(500).json({ error: 'Erro ao iniciar timer' });
  }
});

// Parar timer e criar worklog
router.post('/timer/stop', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { notes } = req.body;
    
    // Buscar timer ativo
    const timerResult = await pool.query(
      'SELECT * FROM active_timers WHERE user_id = $1',
      [userId]
    );
    
    if (timerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Nenhum timer ativo encontrado' });
    }
    
    const timer = timerResult.rows[0];
    const endTime = new Date();
    const durationMinutes = Math.floor(
      (endTime.getTime() - new Date(timer.start_time).getTime()) / 60000
    );
    
    // Criar worklog
    const worklogResult = await pool.query(`
      INSERT INTO worklogs (
        tenant_id, demand_id, user_id, start_time, end_time, 
        duration_minutes, activity_type, description, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      tenantId, timer.demand_id, userId, timer.start_time, endTime,
      durationMinutes, timer.activity_type, timer.description, notes
    ]);
    
    // Remover timer ativo
    await pool.query('DELETE FROM active_timers WHERE user_id = $1', [userId]);
    
    res.json({
      worklog: worklogResult.rows[0],
      duration_minutes: durationMinutes
    });
  } catch (error) {
    console.error('Erro ao parar timer:', error);
    res.status(500).json({ error: 'Erro ao parar timer' });
  }
});

// Cancelar timer sem criar worklog
router.delete('/timer/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    await pool.query('DELETE FROM active_timers WHERE user_id = $1', [userId]);
    
    res.json({ message: 'Timer cancelado' });
  } catch (error) {
    console.error('Erro ao cancelar timer:', error);
    res.status(500).json({ error: 'Erro ao cancelar timer' });
  }
});

// Criar worklog manual
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { 
      demand_id, 
      start_time, 
      end_time, 
      duration_minutes,
      activity_type,
      description,
      notes,
      is_billable
    } = req.body;
    
    if (!start_time || (!end_time && !duration_minutes)) {
      return res.status(400).json({ error: 'Horário de início e duração/fim são obrigatórios' });
    }
    
    let finalDuration = duration_minutes;
    let finalEndTime = end_time;
    
    if (!duration_minutes && end_time) {
      finalDuration = Math.floor(
        (new Date(end_time).getTime() - new Date(start_time).getTime()) / 60000
      );
    } else if (duration_minutes && !end_time) {
      finalEndTime = new Date(new Date(start_time).getTime() + duration_minutes * 60000);
    }
    
    const result = await pool.query(`
      INSERT INTO worklogs (
        tenant_id, demand_id, user_id, start_time, end_time, 
        duration_minutes, activity_type, description, notes, is_billable
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      tenantId, demand_id, userId, start_time, finalEndTime,
      finalDuration, activity_type || 'development', description, notes, is_billable !== false
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar worklog:', error);
    res.status(500).json({ error: 'Erro ao criar worklog' });
  }
});

// Atualizar worklog
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const { 
      start_time, 
      end_time, 
      duration_minutes,
      activity_type,
      description,
      notes,
      is_billable
    } = req.body;
    
    // Verificar se worklog não está aprovado
    const worklogCheck = await pool.query(
      'SELECT is_approved FROM worklogs WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (worklogCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Worklog não encontrado' });
    }
    
    if (worklogCheck.rows[0].is_approved) {
      return res.status(400).json({ error: 'Não é possível editar worklog já aprovado' });
    }
    
    const result = await pool.query(`
      UPDATE worklogs 
      SET start_time = COALESCE($1, start_time),
          end_time = COALESCE($2, end_time),
          duration_minutes = COALESCE($3, duration_minutes),
          activity_type = COALESCE($4, activity_type),
          description = COALESCE($5, description),
          notes = COALESCE($6, notes),
          is_billable = COALESCE($7, is_billable),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND tenant_id = $9
      RETURNING *
    `, [start_time, end_time, duration_minutes, activity_type, description, notes, is_billable, id, tenantId]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar worklog:', error);
    res.status(500).json({ error: 'Erro ao atualizar worklog' });
  }
});

// Aprovar worklogs (em lote)
router.post('/approve', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { worklog_ids } = req.body;
    
    if (!worklog_ids || !Array.isArray(worklog_ids) || worklog_ids.length === 0) {
      return res.status(400).json({ error: 'IDs de worklogs são obrigatórios' });
    }
    
    const result = await pool.query(`
      UPDATE worklogs 
      SET is_approved = true,
          approved_by = $1,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($2) AND tenant_id = $3 AND is_approved = false
      RETURNING id
    `, [userId, worklog_ids, tenantId]);
    
    res.json({ 
      approved_count: result.rows.length,
      approved_ids: result.rows.map(r => r.id)
    });
  } catch (error) {
    console.error('Erro ao aprovar worklogs:', error);
    res.status(500).json({ error: 'Erro ao aprovar worklogs' });
  }
});

// Excluir worklog
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    // Verificar se worklog não está aprovado
    const worklogCheck = await pool.query(
      'SELECT is_approved FROM worklogs WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (worklogCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Worklog não encontrado' });
    }
    
    if (worklogCheck.rows[0].is_approved) {
      return res.status(400).json({ error: 'Não é possível excluir worklog já aprovado' });
    }
    
    await pool.query('DELETE FROM worklogs WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    
    res.json({ message: 'Worklog excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir worklog:', error);
    res.status(500).json({ error: 'Erro ao excluir worklog' });
  }
});

// Relatório de horas por usuário
router.get('/report/by-user', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { start_date, end_date } = req.query;
    
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.full_name,
        u.cost_per_hour,
        COALESCE(SUM(w.duration_minutes), 0) as total_minutes,
        COALESCE(SUM(w.duration_minutes) FILTER (WHERE w.is_billable = true), 0) as billable_minutes,
        COALESCE(SUM(w.duration_minutes) FILTER (WHERE w.is_approved = true), 0) as approved_minutes,
        COALESCE(SUM(w.duration_minutes * u.cost_per_hour / 60), 0) as total_cost
      FROM users u
      LEFT JOIN worklogs w ON w.user_id = u.id 
        AND w.tenant_id = $1
        AND ($2::date IS NULL OR w.start_time >= $2::date)
        AND ($3::date IS NULL OR w.start_time <= $3::date + INTERVAL '1 day')
      WHERE u.is_active = true
      GROUP BY u.id, u.full_name, u.cost_per_hour
      ORDER BY total_minutes DESC
    `, [tenantId, start_date || null, end_date || null]);
    
    res.json(result.rows.map(row => ({
      ...row,
      total_hours: (parseInt(row.total_minutes) / 60).toFixed(2),
      billable_hours: (parseInt(row.billable_minutes) / 60).toFixed(2),
      approved_hours: (parseInt(row.approved_minutes) / 60).toFixed(2)
    })));
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

export default router;
