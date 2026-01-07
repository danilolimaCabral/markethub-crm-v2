import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

// Listar clientes
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { search, is_active } = req.query;
    
    let whereConditions = ['c.tenant_id = $1'];
    let params: any[] = [tenantId];
    let paramIndex = 2;
    
    if (search) {
      whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.contact_email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (is_active !== undefined) {
      whereConditions.push(`c.is_active = $${paramIndex++}`);
      params.push(is_active === 'true');
    }
    
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT i.id) as instances_count,
        COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'active') as active_contracts,
        COALESCE(SUM(ct.mrr_value) FILTER (WHERE ct.status = 'active'), 0) as total_mrr
      FROM ct_clients c
      LEFT JOIN instances i ON i.client_id = c.id
      LEFT JOIN contracts ct ON ct.instance_id = i.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY c.id
      ORDER BY c.name
    `, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// Obter cliente por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    
    const result = await pool.query(`
      SELECT c.*
      FROM ct_clients c
      WHERE c.id = $1 AND c.tenant_id = $2
    `, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Buscar instâncias
    const instances = await pool.query(`
      SELECT 
        i.*,
        p.name as platform_name,
        ct.status as contract_status,
        ct.mrr_value
      FROM instances i
      JOIN platforms p ON p.id = i.platform_id
      LEFT JOIN contracts ct ON ct.instance_id = i.id AND ct.status = 'active'
      WHERE i.client_id = $1
      ORDER BY i.name
    `, [id]);
    
    // Buscar faturas recentes
    const invoices = await pool.query(`
      SELECT inv.id, inv.invoice_number, inv.total, inv.status, inv.due_date
      FROM ct_invoices inv
      JOIN instances i ON i.id = inv.instance_id
      WHERE i.client_id = $1
      ORDER BY inv.created_at DESC
      LIMIT 10
    `, [id]);
    
    res.json({
      ...result.rows[0],
      instances: instances.rows,
      recent_invoices: invoices.rows
    });
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro ao obter cliente' });
  }
});

// Criar cliente
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { name, contact_name, contact_email, contact_phone, document, address, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    const result = await pool.query(`
      INSERT INTO ct_clients (tenant_id, name, contact_name, contact_email, contact_phone, document, address, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [tenantId, name, contact_name, contact_email, contact_phone, document, address ? JSON.stringify(address) : null, notes]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// Atualizar cliente
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const { name, contact_name, contact_email, contact_phone, document, address, notes, is_active } = req.body;
    
    const result = await pool.query(`
      UPDATE ct_clients 
      SET name = COALESCE($1, name),
          contact_name = COALESCE($2, contact_name),
          contact_email = COALESCE($3, contact_email),
          contact_phone = COALESCE($4, contact_phone),
          document = COALESCE($5, document),
          address = COALESCE($6, address),
          notes = COALESCE($7, notes),
          is_active = COALESCE($8, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND tenant_id = $10
      RETURNING *
    `, [name, contact_name, contact_email, contact_phone, document, address ? JSON.stringify(address) : null, notes, is_active, id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// Excluir cliente
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    
    // Verificar se há instâncias vinculadas
    const instancesCheck = await pool.query(
      'SELECT COUNT(*) FROM instances WHERE client_id = $1',
      [id]
    );
    
    if (parseInt(instancesCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir cliente com instâncias vinculadas' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM ct_clients WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ error: 'Erro ao excluir cliente' });
  }
});

export default router;
