import { Router } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/produtos - Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const { categoria, status, limit = 50, offset = 0, search } = req.query;
    
    let sql = `
      SELECT 
        p.id, p.nome, p.sku, p.categoria, p.preco_venda, p.preco_custo,
        p.estoque_atual, p.estoque_minimo, p.status, p.marketplace,
        p.margem_lucro, p.created_at, p.updated_at
      FROM produtos p
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (categoria) {
      sql += ` AND p.categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }
    
    if (status) {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      sql += ` AND (p.nome ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ` ORDER BY p.nome ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Buscar total de registros
    const countResult = await query('SELECT COUNT(*) FROM produtos');
    
    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// GET /api/produtos/:id - Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM produtos WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// GET /api/produtos/sku/:sku - Buscar produto por SKU
router.get('/sku/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const result = await query(
      'SELECT * FROM produtos WHERE sku = $1',
      [sku]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto por SKU:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// POST /api/produtos - Criar novo produto
router.post('/', async (req, res) => {
  try {
    const {
      nome,
      sku,
      categoria,
      preco_venda,
      preco_custo,
      estoque_atual,
      estoque_minimo,
      status,
      marketplace,
      descricao,
      imagem_url
    } = req.body;
    
    // Validação básica
    if (!nome || !sku || !preco_venda) {
      return res.status(400).json({ 
        error: 'Nome, SKU e preço de venda são obrigatórios' 
      });
    }
    
    // Calcular margem de lucro
    const margem_lucro = preco_custo 
      ? ((preco_venda - preco_custo) / preco_venda * 100).toFixed(2)
      : 0;
    
    const result = await query(`
      INSERT INTO produtos 
        (nome, sku, categoria, preco_venda, preco_custo, estoque_atual, 
         estoque_minimo, status, marketplace, margem_lucro, descricao, imagem_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      nome,
      sku,
      categoria || 'Geral',
      preco_venda,
      preco_custo || 0,
      estoque_atual || 0,
      estoque_minimo || 5,
      status || 'ativo',
      marketplace || 'Mercado Livre',
      margem_lucro,
      descricao || null,
      imagem_url || null
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'SKU já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// PUT /api/produtos/:id - Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      sku,
      categoria,
      preco_venda,
      preco_custo,
      estoque_atual,
      estoque_minimo,
      status,
      marketplace,
      descricao,
      imagem_url
    } = req.body;
    
    // Calcular margem de lucro se preços foram fornecidos
    let margem_lucro = null;
    if (preco_venda && preco_custo) {
      margem_lucro = ((preco_venda - preco_custo) / preco_venda * 100).toFixed(2);
    }
    
    const result = await query(`
      UPDATE produtos
      SET 
        nome = COALESCE($1, nome),
        sku = COALESCE($2, sku),
        categoria = COALESCE($3, categoria),
        preco_venda = COALESCE($4, preco_venda),
        preco_custo = COALESCE($5, preco_custo),
        estoque_atual = COALESCE($6, estoque_atual),
        estoque_minimo = COALESCE($7, estoque_minimo),
        status = COALESCE($8, status),
        marketplace = COALESCE($9, marketplace),
        margem_lucro = COALESCE($10, margem_lucro),
        descricao = COALESCE($11, descricao),
        imagem_url = COALESCE($12, imagem_url),
        updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `, [
      nome,
      sku,
      categoria,
      preco_venda,
      preco_custo,
      estoque_atual,
      estoque_minimo,
      status,
      marketplace,
      margem_lucro,
      descricao,
      imagem_url,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// PATCH /api/produtos/:id/estoque - Atualizar apenas estoque
router.patch('/:id/estoque', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade, operacao } = req.body; // operacao: 'adicionar' ou 'remover'
    
    if (!quantidade || !operacao) {
      return res.status(400).json({ 
        error: 'Quantidade e operação são obrigatórios' 
      });
    }
    
    const sql = operacao === 'adicionar'
      ? 'UPDATE produtos SET estoque_atual = estoque_atual + $1, updated_at = NOW() WHERE id = $2 RETURNING *'
      : 'UPDATE produtos SET estoque_atual = estoque_atual - $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    
    const result = await query(sql, [quantidade, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ error: 'Erro ao atualizar estoque' });
  }
});

// DELETE /api/produtos/:id - Deletar produto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM produtos WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto deletado com sucesso', id: result.rows[0].id });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// GET /api/produtos/stats/geral - Estatísticas de produtos
router.get('/stats/geral', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_produtos,
        COUNT(*) FILTER (WHERE status = 'ativo') as produtos_ativos,
        COUNT(*) FILTER (WHERE estoque_atual <= estoque_minimo) as produtos_estoque_baixo,
        COUNT(*) FILTER (WHERE estoque_atual = 0) as produtos_sem_estoque,
        SUM(estoque_atual * preco_venda) as valor_estoque,
        AVG(margem_lucro) as margem_media
      FROM produtos
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/produtos/stats/categoria - Produtos por categoria
router.get('/stats/categoria', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        categoria,
        COUNT(*) as total_produtos,
        SUM(estoque_atual) as estoque_total,
        AVG(margem_lucro) as margem_media
      FROM produtos
      GROUP BY categoria
      ORDER BY total_produtos DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar estatísticas por categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/produtos/alerta/estoque - Produtos com estoque baixo
router.get('/alerta/estoque', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, nome, sku, estoque_atual, estoque_minimo,
        (estoque_minimo - estoque_atual) as quantidade_repor
      FROM produtos
      WHERE estoque_atual <= estoque_minimo
      ORDER BY quantidade_repor DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar alertas de estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

export default router;
