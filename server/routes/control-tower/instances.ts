import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

// Listar instâncias
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { platform_id, client_id, status } = req.query;
    
    let whereConditions = ['i.tenant_id = $1'];
    let params: any[] = [tenantId];
    let paramIndex = 2;
    
    if (platform_id) {
      whereConditions.push(`i.platform_id = $${paramIndex++}`);
      params.push(platform_id);
    }
    if (client_id) {
      whereConditions.push(`i.client_id = $${paramIndex++}`);
      params.push(client_id);
    }
    if (status) {
      whereConditions.push(`i.status = $${paramIndex++}`);
      params.push(status);
    }
    
    const result = await pool.query(`
      SELECT 
        i.*,
        p.name as platform_name,
        p.stack as platform_stack,
        cl.name as client_name,
        ct.status as contract_status,
        ct.mrr_value,
        ct.billing_rule,
        COUNT(DISTINCT d.id) FILTER (WHERE d.status NOT IN ('closed', 'cancelled')) as open_demands
      FROM instances i
      JOIN platforms p ON p.id = i.platform_id
      JOIN ct_clients cl ON cl.id = i.client_id
      LEFT JOIN contracts ct ON ct.instance_id = i.id AND ct.status = 'active'
      LEFT JOIN demands d ON d.instance_id = i.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY i.id, p.name, p.stack, cl.name, ct.status, ct.mrr_value, ct.billing_rule
      ORDER BY cl.name, i.name
    `, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar instâncias:', error);
    res.status(500).json({ error: 'Erro ao listar instâncias' });
  }
});

// Obter instância por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    
    const result = await pool.query(`
      SELECT 
        i.*,
        p.name as platform_name,
        p.stack as platform_stack,
        p.version as platform_version,
        p.sla_hours as platform_sla,
        cl.name as client_name,
        cl.contact_email as client_email
      FROM instances i
      JOIN platforms p ON p.id = i.platform_id
      JOIN ct_clients cl ON cl.id = i.client_id
      WHERE i.id = $1 AND i.tenant_id = $2
    `, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    // Buscar contrato ativo
    const contract = await pool.query(`
      SELECT * FROM contracts 
      WHERE instance_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `, [id]);
    
    // Buscar demandas recentes
    const demands = await pool.query(`
      SELECT id, demand_number, title, type, status, priority, created_at
      FROM demands
      WHERE instance_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);
    
    // Estatísticas
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status NOT IN ('closed', 'cancelled')) as open_demands,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_demands,
        COALESCE(SUM(actual_hours), 0) as total_hours
      FROM demands
      WHERE instance_id = $1
    `, [id]);
    
    res.json({
      ...result.rows[0],
      contract: contract.rows[0] || null,
      recent_demands: demands.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter instância:', error);
    res.status(500).json({ error: 'Erro ao obter instância' });
  }
});

// Criar instância
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { platform_id, client_id, name, url, environment, configurations } = req.body;
    
    if (!platform_id || !client_id || !name) {
      return res.status(400).json({ error: 'Plataforma, cliente e nome são obrigatórios' });
    }
    
    const result = await pool.query(`
      INSERT INTO instances (tenant_id, platform_id, client_id, name, url, environment, configurations)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [tenantId, platform_id, client_id, name, url, environment || 'production', configurations ? JSON.stringify(configurations) : null]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    res.status(500).json({ error: 'Erro ao criar instância' });
  }
});

// Atualizar instância
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const { name, url, environment, configurations, status } = req.body;
    
    const result = await pool.query(`
      UPDATE instances 
      SET name = COALESCE($1, name),
          url = COALESCE($2, url),
          environment = COALESCE($3, environment),
          configurations = COALESCE($4, configurations),
          status = COALESCE($5, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND tenant_id = $7
      RETURNING *
    `, [name, url, environment, configurations ? JSON.stringify(configurations) : null, status, id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar instância:', error);
    res.status(500).json({ error: 'Erro ao atualizar instância' });
  }
});

// Excluir instância
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    
    // Verificar se há demandas ou contratos vinculados
    const demandsCheck = await pool.query(
      'SELECT COUNT(*) FROM demands WHERE instance_id = $1',
      [id]
    );
    
    if (parseInt(demandsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir instância com demandas vinculadas' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM instances WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    res.json({ message: 'Instância excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir instância:', error);
    res.status(500).json({ error: 'Erro ao excluir instância' });
  }
});

export default router;
