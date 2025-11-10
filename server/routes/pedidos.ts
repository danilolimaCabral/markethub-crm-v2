import { Router } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/pedidos - Listar todos os pedidos
router.get('/', async (req, res) => {
  try {
    const { status, marketplace, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        p.id, p.numero_pedido, p.cliente_nome, p.marketplace,
        p.valor_total, p.status, p.data_pedido, p.data_entrega,
        p.rastreio, p.observacoes, p.created_at
      FROM pedidos p
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (marketplace) {
      sql += ` AND p.marketplace = $${paramIndex}`;
      params.push(marketplace);
      paramIndex++;
    }
    
    sql += ` ORDER BY p.data_pedido DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Buscar total de registros
    const countResult = await query('SELECT COUNT(*) FROM pedidos');
    
    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// GET /api/pedidos/:id - Buscar pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM pedidos WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

// POST /api/pedidos - Criar novo pedido
router.post('/', async (req, res) => {
  try {
    const {
      numero_pedido,
      cliente_nome,
      marketplace,
      valor_total,
      status,
      data_pedido,
      data_entrega,
      rastreio,
      observacoes
    } = req.body;
    
    // Validação básica
    if (!numero_pedido || !cliente_nome || !marketplace || !valor_total) {
      return res.status(400).json({ 
        error: 'Número do pedido, cliente, marketplace e valor são obrigatórios' 
      });
    }
    
    const result = await query(`
      INSERT INTO pedidos 
        (numero_pedido, cliente_nome, marketplace, valor_total, status, 
         data_pedido, data_entrega, rastreio, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      numero_pedido,
      cliente_nome,
      marketplace,
      valor_total,
      status || 'pendente',
      data_pedido || new Date(),
      data_entrega || null,
      rastreio || null,
      observacoes || null
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// PUT /api/pedidos/:id - Atualizar pedido
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero_pedido,
      cliente_nome,
      marketplace,
      valor_total,
      status,
      data_pedido,
      data_entrega,
      rastreio,
      observacoes
    } = req.body;
    
    const result = await query(`
      UPDATE pedidos
      SET 
        numero_pedido = COALESCE($1, numero_pedido),
        cliente_nome = COALESCE($2, cliente_nome),
        marketplace = COALESCE($3, marketplace),
        valor_total = COALESCE($4, valor_total),
        status = COALESCE($5, status),
        data_pedido = COALESCE($6, data_pedido),
        data_entrega = COALESCE($7, data_entrega),
        rastreio = COALESCE($8, rastreio),
        observacoes = COALESCE($9, observacoes),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `, [
      numero_pedido,
      cliente_nome,
      marketplace,
      valor_total,
      status,
      data_pedido,
      data_entrega,
      rastreio,
      observacoes,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// DELETE /api/pedidos/:id - Deletar pedido
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM pedidos WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json({ message: 'Pedido deletado com sucesso', id: result.rows[0].id });
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({ error: 'Erro ao deletar pedido' });
  }
});

// GET /api/pedidos/stats/geral - Estatísticas de pedidos
router.get('/stats/geral', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(*) FILTER (WHERE status = 'pendente') as pedidos_pendentes,
        COUNT(*) FILTER (WHERE status = 'conferido') as pedidos_conferidos,
        COUNT(*) FILTER (WHERE status = 'enviado') as pedidos_enviados,
        COUNT(*) FILTER (WHERE status = 'entregue') as pedidos_entregues,
        SUM(valor_total) as valor_total,
        AVG(valor_total) as ticket_medio,
        COUNT(DISTINCT marketplace) as marketplaces_ativos
      FROM pedidos
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/pedidos/stats/marketplace - Pedidos por marketplace
router.get('/stats/marketplace', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        marketplace,
        COUNT(*) as total_pedidos,
        SUM(valor_total) as valor_total,
        AVG(valor_total) as ticket_medio
      FROM pedidos
      GROUP BY marketplace
      ORDER BY total_pedidos DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar estatísticas por marketplace:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
