import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { pool } from '../db';
import subscriptionService from '../services/subscription.service';

const router = express.Router();

// Middleware para verificar acesso ao módulo
const checkCashflowAccess = async (req: AuthRequest, res: Response, next: Function) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant não identificado' });
  }

  const hasAccess = await subscriptionService.hasModuleAccess(tenantId, 'cashflow');
  if (!hasAccess) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Seu plano não inclui o módulo de Fluxo de Caixa. Faça upgrade para ter acesso.',
      code: 'MODULE_ACCESS_DENIED'
    });
  }

  next();
};

// =====================================================
// CONTAS BANCÁRIAS
// =====================================================

/**
 * GET /api/cashflow/accounts
 * Listar contas bancárias do tenant
 */
router.get('/accounts', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    const result = await pool.query(`
      SELECT * FROM bank_accounts 
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY is_default DESC, name ASC
    `, [tenantId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar contas:', error);
    res.status(500).json({ error: 'Erro ao listar contas bancárias' });
  }
});

/**
 * POST /api/cashflow/accounts
 * Criar nova conta bancária
 */
router.post('/accounts', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { 
      name, bank_code, bank_name, agency, account_number, 
      account_type = 'checking', current_balance = 0, is_default = false 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da conta é obrigatório' });
    }

    // Se for default, remover default das outras
    if (is_default) {
      await pool.query(
        'UPDATE bank_accounts SET is_default = false WHERE tenant_id = $1',
        [tenantId]
      );
    }

    const result = await pool.query(`
      INSERT INTO bank_accounts (
        tenant_id, name, bank_code, bank_name, agency, 
        account_number, account_type, current_balance, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [tenantId, name, bank_code, bank_name, agency, account_number, account_type, current_balance, is_default]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar conta:', error);
    res.status(500).json({ error: 'Erro ao criar conta bancária' });
  }
});

/**
 * PUT /api/cashflow/accounts/:id
 * Atualizar conta bancária
 */
router.put('/accounts/:id', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;
    const updates = req.body;

    // Verificar se conta pertence ao tenant
    const checkResult = await pool.query(
      'SELECT id FROM bank_accounts WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    // Se for default, remover default das outras
    if (updates.is_default) {
      await pool.query(
        'UPDATE bank_accounts SET is_default = false WHERE tenant_id = $1 AND id != $2',
        [tenantId, id]
      );
    }

    const allowedFields = ['name', 'bank_code', 'bank_name', 'agency', 'account_number', 'account_type', 'current_balance', 'is_default'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = $${paramIndex++}`);
        values.push(updates[field]);
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id, tenantId);
    const result = await pool.query(`
      UPDATE bank_accounts SET ${setClause.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
      RETURNING *
    `, values);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar conta:', error);
    res.status(500).json({ error: 'Erro ao atualizar conta bancária' });
  }
});

/**
 * DELETE /api/cashflow/accounts/:id
 * Desativar conta bancária
 */
router.delete('/accounts/:id', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;

    await pool.query(
      'UPDATE bank_accounts SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    res.json({ message: 'Conta desativada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar conta:', error);
    res.status(500).json({ error: 'Erro ao desativar conta bancária' });
  }
});

// =====================================================
// TRANSAÇÕES FINANCEIRAS
// =====================================================

/**
 * GET /api/cashflow/transactions
 * Listar transações financeiras
 */
router.get('/transactions', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { 
      type, status, category, 
      startDate, endDate, 
      bankAccountId,
      limit = 50, offset = 0 
    } = req.query;

    let whereClause = 'WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (category) {
      whereClause += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (bankAccountId) {
      whereClause += ` AND bank_account_id = $${paramIndex++}`;
      params.push(bankAccountId);
    }

    if (startDate) {
      whereClause += ` AND transaction_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND transaction_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    params.push(limit, offset);

    const result = await pool.query(`
      SELECT t.*, ba.name as bank_account_name
      FROM financial_transactions t
      LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
      ${whereClause}
      ORDER BY transaction_date DESC, created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, params);

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM financial_transactions ${whereClause}
    `, params.slice(0, -2));

    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error: any) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

/**
 * POST /api/cashflow/transactions
 * Criar nova transação
 */
router.post('/transactions', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const {
      type, category, subcategory, description, amount,
      transaction_date, due_date, payment_date, status = 'pending',
      bank_account_id, is_recurring, recurrence_type, recurrence_end_date,
      reference_type, reference_id, notes
    } = req.body;

    if (!type || !description || !amount || !transaction_date) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: type, description, amount, transaction_date' 
      });
    }

    const result = await pool.query(`
      INSERT INTO financial_transactions (
        tenant_id, type, category, subcategory, description, amount,
        transaction_date, due_date, payment_date, status, bank_account_id,
        is_recurring, recurrence_type, recurrence_end_date,
        reference_type, reference_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      tenantId, type, category, subcategory, description, amount,
      transaction_date, due_date, payment_date, status, bank_account_id,
      is_recurring, recurrence_type, recurrence_end_date,
      reference_type, reference_id, notes
    ]);

    // Atualizar saldo da conta se transação paga
    if (status === 'paid' && bank_account_id) {
      const balanceChange = type === 'income' ? amount : -amount;
      await pool.query(`
        UPDATE bank_accounts SET current_balance = current_balance + $1
        WHERE id = $2 AND tenant_id = $3
      `, [balanceChange, bank_account_id, tenantId]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

/**
 * PUT /api/cashflow/transactions/:id/pay
 * Marcar transação como paga
 */
router.put('/transactions/:id/pay', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { id } = req.params;
    const { payment_date = new Date(), bank_account_id } = req.body;

    // Buscar transação
    const txResult = await pool.query(
      'SELECT * FROM financial_transactions WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (txResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const transaction = txResult.rows[0];

    if (transaction.status === 'paid') {
      return res.status(400).json({ error: 'Transação já está paga' });
    }

    const accountId = bank_account_id || transaction.bank_account_id;

    // Atualizar transação
    await pool.query(`
      UPDATE financial_transactions SET 
        status = 'paid', 
        payment_date = $1, 
        bank_account_id = $2,
        updated_at = NOW()
      WHERE id = $3
    `, [payment_date, accountId, id]);

    // Atualizar saldo da conta
    if (accountId) {
      const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      await pool.query(`
        UPDATE bank_accounts SET current_balance = current_balance + $1
        WHERE id = $2 AND tenant_id = $3
      `, [balanceChange, accountId, tenantId]);
    }

    res.json({ message: 'Transação marcada como paga' });
  } catch (error: any) {
    console.error('Erro ao pagar transação:', error);
    res.status(500).json({ error: 'Erro ao marcar transação como paga' });
  }
});

// =====================================================
// CATEGORIAS
// =====================================================

/**
 * GET /api/cashflow/categories
 * Listar categorias de transações
 */
router.get('/categories', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { type } = req.query;

    let whereClause = 'WHERE (tenant_id = $1 OR is_system = true) AND is_active = true';
    const params: any[] = [tenantId];

    if (type) {
      whereClause += ' AND type = $2';
      params.push(type);
    }

    const result = await pool.query(`
      SELECT * FROM transaction_categories 
      ${whereClause}
      ORDER BY is_system DESC, name ASC
    `, params);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

/**
 * POST /api/cashflow/categories
 * Criar categoria personalizada
 */
router.post('/categories', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { name, type, parent_id, color, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }

    const result = await pool.query(`
      INSERT INTO transaction_categories (tenant_id, name, type, parent_id, color, icon)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [tenantId, name, type, parent_id, color, icon]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// =====================================================
// DASHBOARD E RELATÓRIOS
// =====================================================

/**
 * GET /api/cashflow/summary
 * Resumo do fluxo de caixa
 */
router.get('/summary', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)";
        break;
      case 'year':
        dateFilter = "AND transaction_date >= DATE_TRUNC('year', CURRENT_DATE)";
        break;
    }

    // Totais
    const totalsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' AND status = 'pending' THEN amount ELSE 0 END), 0) as pending_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'pending' THEN amount ELSE 0 END), 0) as pending_expense
      FROM financial_transactions
      WHERE tenant_id = $1 ${dateFilter}
    `, [tenantId]);

    // Saldo total das contas
    const balanceResult = await pool.query(`
      SELECT COALESCE(SUM(current_balance), 0) as total_balance
      FROM bank_accounts
      WHERE tenant_id = $1 AND is_active = true
    `, [tenantId]);

    // Transações por categoria
    const byCategoryResult = await pool.query(`
      SELECT 
        type, category, 
        SUM(amount) as total,
        COUNT(*) as count
      FROM financial_transactions
      WHERE tenant_id = $1 AND status = 'paid' ${dateFilter}
      GROUP BY type, category
      ORDER BY total DESC
    `, [tenantId]);

    // Transações próximas do vencimento
    const upcomingResult = await pool.query(`
      SELECT * FROM financial_transactions
      WHERE tenant_id = $1 
        AND status = 'pending' 
        AND due_date IS NOT NULL
        AND due_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY due_date ASC
      LIMIT 10
    `, [tenantId]);

    const totals = totalsResult.rows[0];

    res.json({
      balance: parseFloat(balanceResult.rows[0].total_balance),
      income: {
        paid: parseFloat(totals.total_income),
        pending: parseFloat(totals.pending_income),
      },
      expense: {
        paid: parseFloat(totals.total_expense),
        pending: parseFloat(totals.pending_expense),
      },
      netCashflow: parseFloat(totals.total_income) - parseFloat(totals.total_expense),
      byCategory: byCategoryResult.rows,
      upcoming: upcomingResult.rows,
    });
  } catch (error: any) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({ error: 'Erro ao gerar resumo do fluxo de caixa' });
  }
});

/**
 * GET /api/cashflow/chart
 * Dados para gráfico de fluxo de caixa
 */
router.get('/chart', authenticateToken, checkCashflowAccess, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { period = 'month', groupBy = 'day' } = req.query;

    let dateFilter = '';
    let dateGroup = '';

    switch (period) {
      case 'week':
        dateFilter = "AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'";
        dateGroup = "DATE(transaction_date)";
        break;
      case 'month':
        dateFilter = "AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'";
        dateGroup = groupBy === 'week' ? "DATE_TRUNC('week', transaction_date)" : "DATE(transaction_date)";
        break;
      case 'year':
        dateFilter = "AND transaction_date >= CURRENT_DATE - INTERVAL '12 months'";
        dateGroup = "DATE_TRUNC('month', transaction_date)";
        break;
    }

    const result = await pool.query(`
      SELECT 
        ${dateGroup} as date,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM financial_transactions
      WHERE tenant_id = $1 AND status = 'paid' ${dateFilter}
      GROUP BY ${dateGroup}
      ORDER BY date ASC
    `, [tenantId]);

    // Calcular saldo acumulado
    let runningBalance = 0;
    const chartData = result.rows.map(row => {
      runningBalance += parseFloat(row.income) - parseFloat(row.expense);
      return {
        date: row.date,
        income: parseFloat(row.income),
        expense: parseFloat(row.expense),
        balance: runningBalance,
      };
    });

    res.json(chartData);
  } catch (error: any) {
    console.error('Erro ao gerar dados do gráfico:', error);
    res.status(500).json({ error: 'Erro ao gerar dados do gráfico' });
  }
});

export default router;
