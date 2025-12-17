import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { pool } from '../db';
import subscriptionService from '../services/subscription.service';

const router = express.Router();

// Middleware para verificar acesso ao módulo
const checkTeamAccess = async (req: AuthRequest, res: Response, next: Function) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant não identificado' });
  }

  const hasAccess = await subscriptionService.hasModuleAccess(tenantId, 'team_management');
  if (!hasAccess) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Seu plano não inclui o módulo de Gestão de Equipe. Faça upgrade para ter acesso.',
      code: 'MODULE_ACCESS_DENIED'
    });
  }

  next();
};

// =====================================================
// TAREFAS
// =====================================================

/**
 * GET /api/tasks
 * Listar tarefas
 */
router.get('/', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { 
      status, priority, assigned_to, category,
      startDate, endDate, myTasks,
      limit = 50, offset = 0 
    } = req.query;

    let whereClause = 'WHERE t.tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (myTasks === 'true') {
      whereClause += ` AND t.assigned_to = $${paramIndex++}`;
      params.push(userId);
    } else if (assigned_to) {
      whereClause += ` AND t.assigned_to = $${paramIndex++}`;
      params.push(assigned_to);
    }

    if (status) {
      whereClause += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }

    if (priority) {
      whereClause += ` AND t.priority = $${paramIndex++}`;
      params.push(priority);
    }

    if (category) {
      whereClause += ` AND t.category = $${paramIndex++}`;
      params.push(category);
    }

    if (startDate) {
      whereClause += ` AND t.due_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND t.due_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    params.push(limit, offset);

    const result = await pool.query(`
      SELECT t.*, 
             u_assigned.full_name as assigned_to_name,
             u_created.full_name as created_by_name,
             (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      ${whereClause}
      ORDER BY 
        CASE t.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, params);

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM tasks t ${whereClause}
    `, params.slice(0, -2));

    res.json({
      tasks: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error: any) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({ error: 'Erro ao listar tarefas' });
  }
});

/**
 * GET /api/tasks/:id
 * Obter detalhes de uma tarefa
 */
router.get('/:id', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;

    const result = await pool.query(`
      SELECT t.*, 
             u_assigned.full_name as assigned_to_name,
             u_created.full_name as created_by_name
      FROM tasks t
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      WHERE t.id = $1 AND t.tenant_id = $2
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Buscar comentários
    const commentsResult = await pool.query(`
      SELECT tc.*, u.full_name as user_name
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at ASC
    `, [id]);

    res.json({
      ...result.rows[0],
      comments: commentsResult.rows,
    });
  } catch (error: any) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefa' });
  }
});

/**
 * POST /api/tasks
 * Criar nova tarefa
 */
router.post('/', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const {
      title, description, status = 'pending', priority = 'medium',
      assigned_to, due_date, category, tags, estimated_hours,
      is_recurring, recurrence_rule, parent_task_id
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const result = await pool.query(`
      INSERT INTO tasks (
        tenant_id, title, description, status, priority,
        assigned_to, created_by, due_date, category, tags,
        estimated_hours, is_recurring, recurrence_rule, parent_task_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      tenantId, title, description, status, priority,
      assigned_to, userId, due_date, category, JSON.stringify(tags || []),
      estimated_hours, is_recurring, recurrence_rule, parent_task_id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

/**
 * PUT /api/tasks/:id
 * Atualizar tarefa
 */
router.put('/:id', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;
    const updates = req.body;

    // Verificar se tarefa existe
    const checkResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const task = checkResult.rows[0];

    // Se status mudou para completed, registrar data
    if (updates.status === 'completed' && task.status !== 'completed') {
      updates.completed_at = new Date();
    }

    const allowedFields = [
      'title', 'description', 'status', 'priority', 'assigned_to',
      'due_date', 'completed_at', 'category', 'tags', 'estimated_hours', 'actual_hours'
    ];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'tags') {
          setClause.push(`${field} = $${paramIndex++}`);
          values.push(JSON.stringify(updates[field]));
        } else {
          setClause.push(`${field} = $${paramIndex++}`);
          values.push(updates[field]);
        }
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id, tenantId);
    const result = await pool.query(`
      UPDATE tasks SET ${setClause.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
      RETURNING *
    `, values);

    // Se tarefa foi concluída, adicionar pontos ao usuário
    if (updates.status === 'completed' && task.status !== 'completed' && task.assigned_to) {
      const points = task.priority === 'urgent' ? 20 : task.priority === 'high' ? 15 : 10;
      await pool.query(`
        INSERT INTO user_achievements (tenant_id, user_id, achievement_type, achievement_name, points)
        VALUES ($1, $2, 'points', 'Tarefa concluída', $3)
      `, [tenantId, task.assigned_to, points]);
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Excluir tarefa
 */
router.delete('/:id', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;

    await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    res.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ error: 'Erro ao excluir tarefa' });
  }
});

/**
 * POST /api/tasks/:id/comments
 * Adicionar comentário à tarefa
 */
router.post('/:id/comments', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { id } = req.params;
    const { content, attachments } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Conteúdo é obrigatório' });
    }

    // Verificar se tarefa existe
    const checkResult = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const result = await pool.query(`
      INSERT INTO task_comments (task_id, user_id, content, attachments)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, userId, content, JSON.stringify(attachments || [])]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

// =====================================================
// DASHBOARD DE TAREFAS
// =====================================================

/**
 * GET /api/tasks/dashboard/summary
 * Resumo das tarefas
 */
router.get('/dashboard/summary', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'canceled') as canceled,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'canceled')) as overdue,
        COUNT(*) FILTER (WHERE due_date = CURRENT_DATE AND status NOT IN ('completed', 'canceled')) as due_today
      FROM tasks
      WHERE tenant_id = $1
    `, [tenantId]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({ error: 'Erro ao gerar resumo de tarefas' });
  }
});

/**
 * GET /api/tasks/dashboard/by-user
 * Tarefas por usuário
 */
router.get('/dashboard/by-user', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.full_name,
        COUNT(*) FILTER (WHERE t.status = 'pending') as pending,
        COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE t.status = 'completed') as completed,
        COUNT(*) as total
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.id AND t.tenant_id = $1
      WHERE u.tenant_id = $1
      GROUP BY u.id, u.full_name
      ORDER BY total DESC
    `, [tenantId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao gerar relatório por usuário:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório por usuário' });
  }
});

// =====================================================
// GAMIFICAÇÃO
// =====================================================

/**
 * GET /api/tasks/leaderboard
 * Ranking de pontos
 */
router.get('/leaderboard', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND ua.earned_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND ua.earned_at >= DATE_TRUNC('month', CURRENT_DATE)";
        break;
      case 'year':
        dateFilter = "AND ua.earned_at >= DATE_TRUNC('year', CURRENT_DATE)";
        break;
    }

    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.full_name,
        COALESCE(SUM(ua.points), 0) as total_points,
        COUNT(DISTINCT ua.id) as achievements_count
      FROM users u
      LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.tenant_id = $1 ${dateFilter}
      WHERE u.tenant_id = $1
      GROUP BY u.id, u.full_name
      ORDER BY total_points DESC
      LIMIT 20
    `, [tenantId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao gerar leaderboard:', error);
    res.status(500).json({ error: 'Erro ao gerar ranking' });
  }
});

/**
 * GET /api/tasks/achievements/:userId
 * Conquistas de um usuário
 */
router.get('/achievements/:userId', authenticateToken, checkTeamAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { userId } = req.params;

    const result = await pool.query(`
      SELECT * FROM user_achievements
      WHERE tenant_id = $1 AND user_id = $2
      ORDER BY earned_at DESC
    `, [tenantId, userId]);

    const totalPoints = result.rows.reduce((sum, a) => sum + (a.points || 0), 0);

    res.json({
      achievements: result.rows,
      totalPoints,
    });
  } catch (error: any) {
    console.error('Erro ao buscar conquistas:', error);
    res.status(500).json({ error: 'Erro ao buscar conquistas' });
  }
});

export default router;
