import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

// Listar documentos
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { owner_type, owner_id, search, parent_id } = req.query;
    
    let whereConditions = ['d.tenant_id = $1'];
    let params: any[] = [tenantId];
    let paramIndex = 2;
    
    if (owner_type) {
      whereConditions.push(`d.owner_type = $${paramIndex++}`);
      params.push(owner_type);
    }
    if (owner_id) {
      whereConditions.push(`d.owner_id = $${paramIndex++}`);
      params.push(owner_id);
    }
    if (search) {
      whereConditions.push(`(d.title ILIKE $${paramIndex} OR d.content ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (parent_id) {
      whereConditions.push(`d.parent_id = $${paramIndex++}`);
      params.push(parent_id);
    } else if (!owner_id) {
      whereConditions.push('d.parent_id IS NULL');
    }
    
    const result = await pool.query(`
      SELECT 
        d.*,
        u.full_name as created_by_name,
        (SELECT COUNT(*) FROM documents WHERE parent_id = d.id) as children_count
      FROM documents d
      LEFT JOIN users u ON u.id = d.created_by
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY d.title
    `, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ error: 'Erro ao listar documentos' });
  }
});

// Obter documento por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    const result = await pool.query(`
      SELECT 
        d.*,
        u.full_name as created_by_name,
        parent.title as parent_title
      FROM documents d
      LEFT JOIN users u ON u.id = d.created_by
      LEFT JOIN documents parent ON parent.id = d.parent_id
      WHERE d.id = $1 AND d.tenant_id = $2
    `, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    // Buscar versões
    const versions = await pool.query(`
      SELECT 
        dv.*,
        u.full_name as created_by_name
      FROM document_versions dv
      LEFT JOIN users u ON u.id = dv.created_by
      WHERE dv.document_id = $1
      ORDER BY dv.version DESC
    `, [id]);
    
    // Buscar documentos filhos
    const children = await pool.query(`
      SELECT id, title, slug, created_at
      FROM documents
      WHERE parent_id = $1
      ORDER BY title
    `, [id]);
    
    // Buscar anexos
    const attachments = await pool.query(`
      SELECT id, filename, original_filename, mime_type, file_size, created_at
      FROM document_attachments
      WHERE document_id = $1
      ORDER BY created_at DESC
    `, [id]);
    
    res.json({
      ...result.rows[0],
      versions: versions.rows,
      children: children.rows,
      attachments: attachments.rows
    });
  } catch (error) {
    console.error('Erro ao obter documento:', error);
    res.status(500).json({ error: 'Erro ao obter documento' });
  }
});

// Criar documento
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { owner_type, owner_id, title, slug, content, content_type, tags, is_public, parent_id } = req.body;
    
    if (!owner_type || !owner_id || !title) {
      return res.status(400).json({ error: 'Tipo de proprietário, ID do proprietário e título são obrigatórios' });
    }
    
    // Gerar slug se não fornecido
    const finalSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const result = await pool.query(`
      INSERT INTO documents (
        tenant_id, owner_type, owner_id, title, slug, content, 
        content_type, tags, is_public, parent_id, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      tenantId, owner_type, owner_id, title, finalSlug, content,
      content_type || 'markdown', tags, is_public || false, parent_id, userId
    ]);
    
    // Criar versão inicial
    await pool.query(`
      INSERT INTO document_versions (document_id, version, content, changes_description, created_by)
      VALUES ($1, 1, $2, 'Versão inicial', $3)
    `, [result.rows[0].id, content, userId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    res.status(500).json({ error: 'Erro ao criar documento' });
  }
});

// Atualizar documento
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { title, slug, content, tags, is_public, changes_description } = req.body;
    
    // Buscar documento atual
    const currentDoc = await pool.query(
      'SELECT content, version FROM documents WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (currentDoc.rows.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    const currentVersion = currentDoc.rows[0].version;
    const newVersion = currentVersion + 1;
    
    // Se o conteúdo mudou, criar nova versão
    if (content && content !== currentDoc.rows[0].content) {
      await pool.query(`
        INSERT INTO document_versions (document_id, version, content, changes_description, created_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, newVersion, content, changes_description || 'Atualização do documento', userId]);
    }
    
    const result = await pool.query(`
      UPDATE documents 
      SET title = COALESCE($1, title),
          slug = COALESCE($2, slug),
          content = COALESCE($3, content),
          tags = COALESCE($4, tags),
          is_public = COALESCE($5, is_public),
          version = CASE WHEN $3 IS NOT NULL AND $3 != content THEN $6 ELSE version END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND tenant_id = $8
      RETURNING *
    `, [title, slug, content, tags, is_public, newVersion, id, tenantId]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ error: 'Erro ao atualizar documento' });
  }
});

// Excluir documento
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    // Verificar se há documentos filhos
    const childrenCheck = await pool.query(
      'SELECT COUNT(*) FROM documents WHERE parent_id = $1',
      [id]
    );
    
    if (parseInt(childrenCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir documento com sub-documentos' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    res.json({ message: 'Documento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    res.status(500).json({ error: 'Erro ao excluir documento' });
  }
});

// Obter versão específica
router.get('/:id/versions/:version', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, version } = req.params;
    const tenantId = req.user?.tenantId;
    
    // Verificar se documento pertence ao tenant
    const docCheck = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }
    
    const result = await pool.query(`
      SELECT 
        dv.*,
        u.full_name as created_by_name
      FROM document_versions dv
      LEFT JOIN users u ON u.id = dv.created_by
      WHERE dv.document_id = $1 AND dv.version = $2
    `, [id, version]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Versão não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter versão:', error);
    res.status(500).json({ error: 'Erro ao obter versão' });
  }
});

// Busca full-text em documentos
router.get('/search/fulltext', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { q, owner_type } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }
    
    let whereConditions = ['d.tenant_id = $1', `(d.title ILIKE $2 OR d.content ILIKE $2)`];
    let params: any[] = [tenantId, `%${q}%`];
    let paramIndex = 3;
    
    if (owner_type) {
      whereConditions.push(`d.owner_type = $${paramIndex++}`);
      params.push(owner_type);
    }
    
    const result = await pool.query(`
      SELECT 
        d.id, d.title, d.slug, d.owner_type, d.owner_id, d.tags, d.created_at,
        CASE 
          WHEN d.owner_type = 'platform' THEN p.name
          WHEN d.owner_type = 'instance' THEN i.name
          ELSE NULL
        END as owner_name,
        substring(d.content, 1, 200) as excerpt
      FROM documents d
      LEFT JOIN platforms p ON d.owner_type = 'platform' AND d.owner_id = p.id
      LEFT JOIN instances i ON d.owner_type = 'instance' AND d.owner_id = i.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY d.updated_at DESC
      LIMIT 50
    `, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({ error: 'Erro na busca' });
  }
});

export default router;
