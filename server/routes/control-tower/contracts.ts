import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

// ==================== TEMPLATES ====================

// Listar templates de contratos
router.get('/templates', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    
    const result = await pool.query(`
      SELECT 
        ct.*,
        u.full_name as created_by_name,
        COUNT(c.id) as contracts_count
      FROM contract_templates ct
      LEFT JOIN users u ON u.id = ct.created_by
      LEFT JOIN contracts c ON c.template_id = ct.id
      WHERE ct.tenant_id = $1
      GROUP BY ct.id, u.full_name
      ORDER BY ct.name
    `, [tenantId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({ error: 'Erro ao listar templates' });
  }
});

// Criar template
router.post('/templates', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { name, description, content, variables } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Nome e conteúdo são obrigatórios' });
    }
    
    const result = await pool.query(`
      INSERT INTO contract_templates (tenant_id, name, description, content, variables, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [tenantId, name, description, content, variables ? JSON.stringify(variables) : null, userId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar template:', error);
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// Atualizar template
router.put('/templates/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const { name, description, content, variables, is_active } = req.body;
    
    const result = await pool.query(`
      UPDATE contract_templates 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          content = COALESCE($3, content),
          variables = COALESCE($4, variables),
          is_active = COALESCE($5, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND tenant_id = $7
      RETURNING *
    `, [name, description, content, variables ? JSON.stringify(variables) : null, is_active, id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// ==================== CONTRATOS ====================

// Listar contratos
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { instance_id, status, expiring_soon } = req.query;
    
    let whereConditions = ['c.tenant_id = $1'];
    let params: any[] = [tenantId];
    let paramIndex = 2;
    
    if (instance_id) {
      whereConditions.push(`c.instance_id = $${paramIndex++}`);
      params.push(instance_id);
    }
    if (status) {
      whereConditions.push(`c.status = $${paramIndex++}`);
      params.push(status);
    }
    if (expiring_soon === 'true') {
      whereConditions.push(`c.end_date <= CURRENT_DATE + INTERVAL '30 days' AND c.status = 'active'`);
    }
    
    const result = await pool.query(`
      SELECT 
        c.*,
        i.name as instance_name,
        cl.name as client_name,
        p.name as platform_name,
        ct.name as template_name
      FROM contracts c
      JOIN instances i ON i.id = c.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      JOIN platforms p ON p.id = i.platform_id
      LEFT JOIN contract_templates ct ON ct.id = c.template_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY c.end_date ASC NULLS LAST, c.created_at DESC
    `, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    res.status(500).json({ error: 'Erro ao listar contratos' });
  }
});

// Obter contrato por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        i.name as instance_name,
        i.url as instance_url,
        cl.name as client_name,
        cl.contact_name,
        cl.contact_email,
        p.name as platform_name,
        ct.name as template_name,
        creator.full_name as created_by_name
      FROM contracts c
      JOIN instances i ON i.id = c.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      JOIN platforms p ON p.id = i.platform_id
      LEFT JOIN contract_templates ct ON ct.id = c.template_id
      LEFT JOIN users creator ON creator.id = c.created_by
      WHERE c.id = $1 AND c.tenant_id = $2
    `, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    // Buscar versões
    const versions = await pool.query(`
      SELECT 
        cv.*,
        u.full_name as created_by_name
      FROM contract_versions cv
      LEFT JOIN users u ON u.id = cv.created_by
      WHERE cv.contract_id = $1
      ORDER BY cv.version DESC
    `, [id]);
    
    // Buscar faturas relacionadas
    const invoices = await pool.query(`
      SELECT id, invoice_number, period_start, period_end, total, status, due_date
      FROM ct_invoices
      WHERE contract_id = $1
      ORDER BY period_start DESC
      LIMIT 12
    `, [id]);
    
    res.json({
      ...result.rows[0],
      versions: versions.rows,
      invoices: invoices.rows
    });
  } catch (error) {
    console.error('Erro ao obter contrato:', error);
    res.status(500).json({ error: 'Erro ao obter contrato' });
  }
});

// Criar contrato
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { 
      instance_id,
      template_id,
      title,
      content,
      terms,
      start_date,
      end_date,
      renewal_date,
      billing_rule,
      mrr_value,
      hourly_rate,
      hours_package,
      project_value
    } = req.body;
    
    if (!instance_id || !title || !start_date || !billing_rule) {
      return res.status(400).json({ error: 'Instância, título, data de início e regra de cobrança são obrigatórios' });
    }
    
    // Gerar número do contrato
    const numberResult = await pool.query(
      'SELECT generate_contract_number($1) as contract_number',
      [tenantId]
    );
    const contractNumber = numberResult.rows[0].contract_number;
    
    // Se template_id foi fornecido, buscar conteúdo do template
    let finalContent = content;
    if (template_id && !content) {
      const templateResult = await pool.query(
        'SELECT content FROM contract_templates WHERE id = $1 AND tenant_id = $2',
        [template_id, tenantId]
      );
      if (templateResult.rows.length > 0) {
        finalContent = templateResult.rows[0].content;
      }
    }
    
    const result = await pool.query(`
      INSERT INTO contracts (
        tenant_id, instance_id, template_id, contract_number, title, content, terms,
        start_date, end_date, renewal_date, billing_rule,
        mrr_value, hourly_rate, hours_package, project_value, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      tenantId, instance_id, template_id, contractNumber, title, finalContent, terms,
      start_date, end_date, renewal_date, billing_rule,
      mrr_value || 0, hourly_rate || 0, hours_package || 0, project_value || 0, userId
    ]);
    
    // Criar versão inicial
    await pool.query(`
      INSERT INTO contract_versions (contract_id, version, content, changes_description, created_by)
      VALUES ($1, 1, $2, 'Versão inicial', $3)
    `, [result.rows[0].id, finalContent, userId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    res.status(500).json({ error: 'Erro ao criar contrato' });
  }
});

// Atualizar contrato
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { 
      title,
      content,
      terms,
      end_date,
      renewal_date,
      billing_rule,
      mrr_value,
      hourly_rate,
      hours_package,
      project_value,
      status,
      changes_description
    } = req.body;
    
    // Verificar se contrato existe e não está assinado
    const contractCheck = await pool.query(
      'SELECT status, content FROM contracts WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (contractCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    const currentContract = contractCheck.rows[0];
    
    // Se o conteúdo mudou, criar nova versão
    if (content && content !== currentContract.content) {
      const versionResult = await pool.query(
        'SELECT MAX(version) as max_version FROM contract_versions WHERE contract_id = $1',
        [id]
      );
      const newVersion = (versionResult.rows[0].max_version || 0) + 1;
      
      await pool.query(`
        INSERT INTO contract_versions (contract_id, version, content, changes_description, created_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, newVersion, content, changes_description || 'Atualização do contrato', userId]);
    }
    
    const result = await pool.query(`
      UPDATE contracts 
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          terms = COALESCE($3, terms),
          end_date = COALESCE($4, end_date),
          renewal_date = COALESCE($5, renewal_date),
          billing_rule = COALESCE($6, billing_rule),
          mrr_value = COALESCE($7, mrr_value),
          hourly_rate = COALESCE($8, hourly_rate),
          hours_package = COALESCE($9, hours_package),
          project_value = COALESCE($10, project_value),
          status = COALESCE($11, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 AND tenant_id = $13
      RETURNING *
    `, [title, content, terms, end_date, renewal_date, billing_rule, mrr_value, hourly_rate, hours_package, project_value, status, id, tenantId]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    res.status(500).json({ error: 'Erro ao atualizar contrato' });
  }
});

// Assinar contrato (simular assinatura digital)
router.post('/:id/sign', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const { signed_by_client, signed_by_company } = req.body;
    
    const result = await pool.query(`
      UPDATE contracts 
      SET status = 'active',
          signed_at = CURRENT_TIMESTAMP,
          signed_by_client = $1,
          signed_by_company = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND tenant_id = $4 AND status IN ('draft', 'pending_approval', 'approved')
      RETURNING *
    `, [signed_by_client, signed_by_company, id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Contrato não pode ser assinado no status atual' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao assinar contrato:', error);
    res.status(500).json({ error: 'Erro ao assinar contrato' });
  }
});

// Renovar contrato
router.post('/:id/renew', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { new_end_date, new_mrr_value, notes } = req.body;
    
    if (!new_end_date) {
      return res.status(400).json({ error: 'Nova data de término é obrigatória' });
    }
    
    // Buscar contrato atual
    const contractResult = await pool.query(
      'SELECT * FROM contracts WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (contractResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    const contract = contractResult.rows[0];
    
    // Atualizar contrato com nova data e valor
    const result = await pool.query(`
      UPDATE contracts 
      SET end_date = $1,
          renewal_date = CURRENT_DATE,
          mrr_value = COALESCE($2, mrr_value),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `, [new_end_date, new_mrr_value, id, tenantId]);
    
    // Registrar renovação nas versões
    const versionResult = await pool.query(
      'SELECT MAX(version) as max_version FROM contract_versions WHERE contract_id = $1',
      [id]
    );
    const newVersion = (versionResult.rows[0].max_version || 0) + 1;
    
    await pool.query(`
      INSERT INTO contract_versions (contract_id, version, content, changes_description, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, newVersion, contract.content, `Renovação do contrato até ${new_end_date}. ${notes || ''}`, userId]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao renovar contrato:', error);
    res.status(500).json({ error: 'Erro ao renovar contrato' });
  }
});

// Dashboard de contratos
router.get('/stats/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    
    // Total MRR
    const mrrResult = await pool.query(`
      SELECT 
        COALESCE(SUM(mrr_value), 0) as total_mrr,
        COUNT(*) as active_contracts
      FROM contracts
      WHERE tenant_id = $1 AND status = 'active'
    `, [tenantId]);
    
    // Por status
    const byStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM contracts
      WHERE tenant_id = $1
      GROUP BY status
    `, [tenantId]);
    
    // Contratos expirando em 30 dias
    const expiring = await pool.query(`
      SELECT 
        c.id, c.contract_number, c.title, c.end_date, c.mrr_value,
        cl.name as client_name
      FROM contracts c
      JOIN instances i ON i.id = c.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      WHERE c.tenant_id = $1 
        AND c.status = 'active'
        AND c.end_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY c.end_date ASC
    `, [tenantId]);
    
    // Evolução MRR últimos 6 meses
    const mrrHistory = await pool.query(`
      SELECT 
        DATE_TRUNC('month', signed_at) as month,
        SUM(mrr_value) as mrr
      FROM contracts
      WHERE tenant_id = $1 
        AND status = 'active'
        AND signed_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', signed_at)
      ORDER BY month
    `, [tenantId]);
    
    res.json({
      summary: mrrResult.rows[0],
      by_status: byStatus.rows,
      expiring_soon: expiring.rows,
      mrr_history: mrrHistory.rows
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

export default router;
