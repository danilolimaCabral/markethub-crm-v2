import { Router } from 'express';
import pool, { query } from '../db';
import { notifyNewCustomer, notifyCustomerUpdate } from '../services/controlTowerWebhook';

const router = Router();

// GET /api/clientes - Listar todos os clientes
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, nome, empresa, email, telefone, plano, status,
        faturamento_total, total_pedidos, total_produtos,
        created_at, updated_at
      FROM clientes_master
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// GET /api/clientes/:id - Buscar cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM clientes_master WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// POST /api/clientes - Criar novo cliente
router.post('/', async (req, res) => {
  try {
    const { nome, empresa, email, telefone, plano, status } = req.body;
    
    // Validação básica
    if (!nome || !empresa || !email) {
      return res.status(400).json({ 
        error: 'Nome, empresa e email são obrigatórios' 
      });
    }
    
    const result = await query(`
      INSERT INTO clientes_master 
        (nome, empresa, email, telefone, plano, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [nome, empresa, email, telefone || null, plano || 'starter', status || 'trial']);
    
    // Notificar Control Tower sobre novo cliente
    notifyNewCustomer({
      id: result.rows[0].id,
      name: result.rows[0].nome,
      email: result.rows[0].email,
      phone: result.rows[0].telefone,
      customerType: 'pessoa_juridica',
    }).catch(err => console.error('[ControlTower] Erro ao notificar:', err));

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, empresa, email, telefone, plano, status } = req.body;
    
    const result = await query(`
      UPDATE clientes_master
      SET 
        nome = COALESCE($1, nome),
        empresa = COALESCE($2, empresa),
        email = COALESCE($3, email),
        telefone = COALESCE($4, telefone),
        plano = COALESCE($5, plano),
        status = COALESCE($6, status),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [nome, empresa, email, telefone, plano, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Notificar Control Tower sobre atualização de cliente
    notifyCustomerUpdate({
      id: result.rows[0].id,
      name: result.rows[0].nome,
      email: result.rows[0].email,
      phone: result.rows[0].telefone,
      customerType: 'pessoa_juridica',
    }).catch(err => console.error('[ControlTower] Erro ao notificar:', err));
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// DELETE /api/clientes/:id - Deletar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM clientes_master WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json({ message: 'Cliente deletado com sucesso', id: result.rows[0].id });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

// GET /api/clientes/stats - Estatísticas gerais
router.get('/stats/geral', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_clientes,
        COUNT(*) FILTER (WHERE status = 'ativo') as clientes_ativos,
        SUM(faturamento_total) as faturamento_total,
        SUM(total_pedidos) as pedidos_totais,
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'ativo')::numeric / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as taxa_ativacao
      FROM clientes_master
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
