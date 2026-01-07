import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth';

const router = Router();

// Listar faturas
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { instance_id, status, start_date, end_date, page = 1, limit = 20 } = req.query;
    
    let whereConditions = ['inv.tenant_id = $1'];
    let params: any[] = [tenantId];
    let paramIndex = 2;
    
    if (instance_id) {
      whereConditions.push(`inv.instance_id = $${paramIndex++}`);
      params.push(instance_id);
    }
    if (status) {
      whereConditions.push(`inv.status = $${paramIndex++}`);
      params.push(status);
    }
    if (start_date) {
      whereConditions.push(`inv.period_start >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push(`inv.period_end <= $${paramIndex++}`);
      params.push(end_date);
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM ct_invoices inv WHERE ${whereConditions.join(' AND ')}
    `, params);
    
    const result = await pool.query(`
      SELECT 
        inv.*,
        i.name as instance_name,
        cl.name as client_name,
        p.name as platform_name,
        c.billing_rule
      FROM ct_invoices inv
      JOIN instances i ON i.id = inv.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      JOIN platforms p ON p.id = i.platform_id
      LEFT JOIN contracts c ON c.id = inv.contract_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY inv.due_date DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, [...params, limit, offset]);
    
    // Totais
    const totals = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as paid_amount,
        COALESCE(SUM(total) FILTER (WHERE status = 'sent' OR status = 'overdue'), 0) as pending_amount
      FROM ct_invoices inv
      WHERE ${whereConditions.join(' AND ')}
    `, params);
    
    res.json({
      data: result.rows,
      totals: totals.rows[0],
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar faturas:', error);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
});

// Obter fatura por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    
    const result = await pool.query(`
      SELECT 
        inv.*,
        i.name as instance_name,
        i.url as instance_url,
        cl.name as client_name,
        cl.contact_name,
        cl.contact_email,
        cl.document as client_document,
        cl.address as client_address,
        p.name as platform_name,
        c.billing_rule,
        c.hourly_rate,
        creator.full_name as created_by_name
      FROM ct_invoices inv
      JOIN instances i ON i.id = inv.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      JOIN platforms p ON p.id = i.platform_id
      LEFT JOIN contracts c ON c.id = inv.contract_id
      LEFT JOIN users creator ON creator.id = inv.created_by
      WHERE inv.id = $1 AND inv.tenant_id = $2
    `, [id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Buscar pagamentos
    const payments = await pool.query(`
      SELECT 
        p.*,
        u.full_name as created_by_name
      FROM ct_payments p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.invoice_id = $1
      ORDER BY p.payment_date DESC
    `, [id]);
    
    // Buscar worklogs do período (se faturamento por hora)
    const worklogs = await pool.query(`
      SELECT 
        w.id, w.start_time, w.duration_minutes, w.description, w.activity_type,
        u.full_name as user_name,
        d.demand_number, d.title as demand_title
      FROM worklogs w
      JOIN users u ON u.id = w.user_id
      LEFT JOIN demands d ON d.id = w.demand_id
      WHERE d.instance_id = $1
        AND w.start_time >= $2
        AND w.start_time <= $3
        AND w.is_billable = true
        AND w.is_approved = true
      ORDER BY w.start_time
    `, [result.rows[0].instance_id, result.rows[0].period_start, result.rows[0].period_end]);
    
    res.json({
      ...result.rows[0],
      payments: payments.rows,
      worklogs: worklogs.rows
    });
  } catch (error) {
    console.error('Erro ao obter fatura:', error);
    res.status(500).json({ error: 'Erro ao obter fatura' });
  }
});

// Gerar fatura
router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { 
      instance_id,
      contract_id,
      period_start,
      period_end,
      due_date,
      notes
    } = req.body;
    
    if (!instance_id || !period_start || !period_end || !due_date) {
      return res.status(400).json({ error: 'Instância, período e vencimento são obrigatórios' });
    }
    
    // Buscar contrato e regra de cobrança
    const contractResult = await pool.query(`
      SELECT c.*, i.name as instance_name
      FROM contracts c
      JOIN instances i ON i.id = c.instance_id
      WHERE c.instance_id = $1 AND c.status = 'active'
      ORDER BY c.created_at DESC
      LIMIT 1
    `, [instance_id]);
    
    if (contractResult.rows.length === 0) {
      return res.status(400).json({ error: 'Nenhum contrato ativo encontrado para esta instância' });
    }
    
    const contract = contractResult.rows[0];
    let subtotal = 0;
    let items: any[] = [];
    
    // Calcular valor baseado na regra de cobrança
    switch (contract.billing_rule) {
      case 'mrr':
        subtotal = parseFloat(contract.mrr_value);
        items.push({
          description: `Assinatura mensal - ${contract.instance_name}`,
          quantity: 1,
          unit_price: subtotal,
          total: subtotal
        });
        break;
        
      case 'hourly':
        // Buscar horas aprovadas do período
        const hoursResult = await pool.query(`
          SELECT 
            COALESCE(SUM(w.duration_minutes), 0) as total_minutes
          FROM worklogs w
          JOIN demands d ON d.id = w.demand_id
          WHERE d.instance_id = $1
            AND w.start_time >= $2
            AND w.start_time <= $3
            AND w.is_billable = true
            AND w.is_approved = true
        `, [instance_id, period_start, period_end]);
        
        const totalHours = parseInt(hoursResult.rows[0].total_minutes) / 60;
        subtotal = totalHours * parseFloat(contract.hourly_rate);
        items.push({
          description: `Horas trabalhadas (${totalHours.toFixed(2)}h × R$ ${contract.hourly_rate}/h)`,
          quantity: totalHours,
          unit_price: parseFloat(contract.hourly_rate),
          total: subtotal
        });
        break;
        
      case 'hours_package':
        // Verificar horas excedentes
        const packageHours = await pool.query(`
          SELECT 
            COALESCE(SUM(w.duration_minutes), 0) as total_minutes
          FROM worklogs w
          JOIN demands d ON d.id = w.demand_id
          WHERE d.instance_id = $1
            AND w.start_time >= $2
            AND w.start_time <= $3
            AND w.is_billable = true
            AND w.is_approved = true
        `, [instance_id, period_start, period_end]);
        
        const usedHours = parseInt(packageHours.rows[0].total_minutes) / 60;
        const packageSize = contract.hours_package;
        const excessHours = Math.max(0, usedHours - packageSize);
        
        // Valor base do pacote (proporcional ao MRR)
        subtotal = parseFloat(contract.mrr_value);
        items.push({
          description: `Pacote de ${packageSize} horas`,
          quantity: 1,
          unit_price: subtotal,
          total: subtotal
        });
        
        // Horas excedentes
        if (excessHours > 0) {
          const excessValue = excessHours * parseFloat(contract.hourly_rate);
          subtotal += excessValue;
          items.push({
            description: `Horas excedentes (${excessHours.toFixed(2)}h × R$ ${contract.hourly_rate}/h)`,
            quantity: excessHours,
            unit_price: parseFloat(contract.hourly_rate),
            total: excessValue
          });
        }
        break;
        
      case 'fixed_project':
        // Valor fixo do projeto (pode ser parcelado)
        subtotal = parseFloat(contract.project_value);
        items.push({
          description: `Projeto - ${contract.instance_name}`,
          quantity: 1,
          unit_price: subtotal,
          total: subtotal
        });
        break;
    }
    
    // Gerar número da fatura
    const numberResult = await pool.query(
      'SELECT generate_invoice_number($1) as invoice_number',
      [tenantId]
    );
    const invoiceNumber = numberResult.rows[0].invoice_number;
    
    // Criar fatura
    const result = await pool.query(`
      INSERT INTO ct_invoices (
        tenant_id, instance_id, contract_id, invoice_number,
        period_start, period_end, subtotal, total, due_date, items, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId, instance_id, contract.id, invoiceNumber,
      period_start, period_end, subtotal, subtotal, due_date, 
      JSON.stringify(items), notes, userId
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao gerar fatura:', error);
    res.status(500).json({ error: 'Erro ao gerar fatura' });
  }
});

// Criar fatura manual
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { 
      instance_id,
      contract_id,
      period_start,
      period_end,
      items,
      discount,
      tax,
      due_date,
      notes
    } = req.body;
    
    if (!instance_id || !period_start || !period_end || !due_date || !items) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    
    // Calcular totais
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const total = subtotal - (discount || 0) + (tax || 0);
    
    // Gerar número da fatura
    const numberResult = await pool.query(
      'SELECT generate_invoice_number($1) as invoice_number',
      [tenantId]
    );
    const invoiceNumber = numberResult.rows[0].invoice_number;
    
    const result = await pool.query(`
      INSERT INTO ct_invoices (
        tenant_id, instance_id, contract_id, invoice_number,
        period_start, period_end, subtotal, discount, tax, total, 
        due_date, items, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      tenantId, instance_id, contract_id, invoiceNumber,
      period_start, period_end, subtotal, discount || 0, tax || 0, total,
      due_date, JSON.stringify(items), notes, userId
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar fatura:', error);
    res.status(500).json({ error: 'Erro ao criar fatura' });
  }
});

// Atualizar status da fatura
router.put('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const { status } = req.body;
    
    if (!['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const result = await pool.query(`
      UPDATE ct_invoices 
      SET status = $1,
          paid_at = CASE WHEN $1 = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `, [status, id, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Registrar pagamento
router.post('/:id/payments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    const { amount, payment_date, payment_method, reference, notes } = req.body;
    
    if (!amount || !payment_date) {
      return res.status(400).json({ error: 'Valor e data do pagamento são obrigatórios' });
    }
    
    // Verificar se fatura existe
    const invoiceCheck = await pool.query(
      'SELECT id, total FROM ct_invoices WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Registrar pagamento
    const result = await pool.query(`
      INSERT INTO ct_payments (tenant_id, invoice_id, amount, payment_date, payment_method, reference, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [tenantId, id, amount, payment_date, payment_method, reference, notes, userId]);
    
    // Verificar se fatura foi totalmente paga
    const paymentsTotal = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM ct_payments WHERE invoice_id = $1',
      [id]
    );
    
    if (parseFloat(paymentsTotal.rows[0].total) >= parseFloat(invoiceCheck.rows[0].total)) {
      await pool.query(`
        UPDATE ct_invoices 
        SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({ error: 'Erro ao registrar pagamento' });
  }
});

// Dashboard financeiro
router.get('/stats/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    
    // Resumo geral
    const summary = await pool.query(`
      SELECT 
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as total_received,
        COALESCE(SUM(total) FILTER (WHERE status IN ('sent', 'overdue')), 0) as total_pending,
        COALESCE(SUM(total) FILTER (WHERE status = 'overdue'), 0) as total_overdue,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count
      FROM ct_invoices
      WHERE tenant_id = $1
    `, [tenantId]);
    
    // Receita por mês (últimos 12 meses)
    const revenueByMonth = await pool.query(`
      SELECT 
        DATE_TRUNC('month', paid_at) as month,
        SUM(total) as revenue
      FROM ct_invoices
      WHERE tenant_id = $1 
        AND status = 'paid'
        AND paid_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', paid_at)
      ORDER BY month
    `, [tenantId]);
    
    // Receita por plataforma
    const revenueByPlatform = await pool.query(`
      SELECT 
        p.name as platform_name,
        SUM(inv.total) as revenue,
        COUNT(inv.id) as invoice_count
      FROM ct_invoices inv
      JOIN instances i ON i.id = inv.instance_id
      JOIN platforms p ON p.id = i.platform_id
      WHERE inv.tenant_id = $1 AND inv.status = 'paid'
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
    `, [tenantId]);
    
    // Faturas vencendo em 7 dias
    const dueSoon = await pool.query(`
      SELECT 
        inv.id, inv.invoice_number, inv.total, inv.due_date,
        cl.name as client_name
      FROM ct_invoices inv
      JOIN instances i ON i.id = inv.instance_id
      JOIN ct_clients cl ON cl.id = i.client_id
      WHERE inv.tenant_id = $1 
        AND inv.status = 'sent'
        AND inv.due_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY inv.due_date ASC
    `, [tenantId]);
    
    res.json({
      summary: summary.rows[0],
      revenue_by_month: revenueByMonth.rows,
      revenue_by_platform: revenueByPlatform.rows,
      due_soon: dueSoon.rows
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

export default router;
