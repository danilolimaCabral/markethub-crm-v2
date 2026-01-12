import express from 'express';
import { pool } from '../db';
import bcrypt from 'bcryptjs';
import format from 'pg-format';
import { authenticateToken } from '../middleware/auth';
import { validarCNPJ } from '../services/cnpjService';
import { validarEmail, validarTelefone } from '../services/validationService';

const router = express.Router();

// Função auxiliar para gerar senha aleatória
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Função auxiliar para gerar slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Função para validar email (importada do serviço)
function isValidEmail(email: string): boolean {
  return validarEmail(email);
}

// Função para validar CNPJ (importada do serviço)
function isValidCNPJ(cnpj: string): boolean {
  return validarCNPJ(cnpj);
}

// Listar todos os tenants
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(DISTINCT o.id) as order_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN products p ON p.tenant_id = t.id
      LEFT JOIN orders o ON o.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.criado_em DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
});

// GET /api/tenants/me - Buscar dados do tenant do usuário logado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    // Buscar tenant_id do usuário
    const userResult = await pool.query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const tenantId = userResult.rows[0].tenant_id;
    
    // Buscar dados do tenant
    const tenantResult = await pool.query(
      `SELECT 
        id,
        nome_empresa,
        slug,
        cnpj,
        email_contato,
        telefone,
        endereco,
        cidade,
        estado,
        cep,
        plano,
        status,
        logo_url,
        cor_primaria
      FROM tenants 
      WHERE id = $1`,
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant não encontrado' });
    }
    
    res.json(tenantResult.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar dados do tenant:', error);
    res.status(500).json({ message: 'Erro ao buscar dados do tenant' });
  }
});

// Obter detalhes de um tenant específico
router.get('/:id', async (req, res) => {
  try {
    const tenantsResult = await pool.query(`
      SELECT * FROM tenants WHERE id = $1
    `, [req.params.id]);
    
    if (!tenantsResult.rows || tenantsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const tenant = tenantsResult.rows[0];
    
    // Buscar estatísticas
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as user_count,
        (SELECT COUNT(*) FROM products WHERE tenant_id = $2) as product_count,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $3) as order_count,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $4 AND DATE(criado_em) = CURRENT_DATE) as orders_today
    `, [req.params.id, req.params.id, req.params.id, req.params.id]);
    
    res.json({ ...tenant, stats: statsResult.rows[0] || {} });
  } catch (error) {
    console.error('Erro ao buscar tenant:', error);
    res.status(500).json({ error: 'Erro ao buscar tenant' });
  }
});

// Criar novo tenant - VERSÃO CORRIGIDA
router.post('/', async (req, res) => {
  try {
    const {
      nome_empresa,
      cnpj,
      email_contato,
      telefone,
      plano = 'starter',
      integrations = []
    } = req.body;
    
    // ===== VALIDAÇÕES OBRIGATÓRIAS - CORRIGIDO =====
    
    // 1. Nome da empresa é obrigatório
    if (!nome_empresa || nome_empresa.trim() === '') {
      return res.status(400).json({ error: 'Nome da empresa é obrigatório' });
    }
    
    // 2. CNPJ é obrigatório e deve ser válido
    if (!cnpj || cnpj.trim() === '') {
      return res.status(400).json({ error: 'CNPJ é obrigatório' });
    }
    
    if (!isValidCNPJ(cnpj)) {
      return res.status(400).json({ error: 'CNPJ inválido. Deve conter 14 dígitos numéricos.' });
    }
    
    // 3. Email de contato é obrigatório e deve ser válido
    if (!email_contato || email_contato.trim() === '') {
      return res.status(400).json({ error: 'Email de contato é obrigatório' });
    }
    
    if (!isValidEmail(email_contato)) {
      return res.status(400).json({ error: 'Email de contato inválido' });
    }
    
    // 4. Pelo menos uma integração deve ser especificada
    if (!integrations || integrations.length === 0) {
      return res.status(400).json({ 
        error: 'É necessário especificar pelo menos uma integração (ex: MercadoLivre, Shopee, Amazon, Bling, Omie, Tiny)' 
      });
    }
    
    // ===== FIM DAS VALIDAÇÕES =====
    
    // Verificar se CNPJ já existe
    const checkQuery = format('SELECT id FROM tenants WHERE cnpj = %L', cnpj);
    const existingResult = await pool.query(checkQuery);
    if (existingResult.rows && existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }
    
    // Gerar slug único
    let slug = generateSlug(nome_empresa);
    const slugQuery = format('SELECT id FROM tenants WHERE slug = %L', slug);
    const slugExistsResult = await pool.query(slugQuery);
    if (slugExistsResult.rows && slugExistsResult.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }
    
    // Definir limites baseados no plano
    const limits = {
      starter: { users: 3, products: 100, orders: 500 },
      professional: { users: 10, products: 1000, orders: 5000 },
      business: { users: 25, products: 2000, orders: 10000 },
      enterprise: { users: -1, products: -1, orders: -1 }
    };
    
    const planLimits = limits[plano as keyof typeof limits] || limits.starter;
    
    // Log para debug
    const insertParams = [
      nome_empresa, slug, cnpj, email_contato, telefone || null, plano,
      planLimits.users, planLimits.products, planLimits.orders
    ];
    console.log('=== CRIAÇÃO DE TENANT - VERSÃO CORRIGIDA ===');
    console.log('Parâmetros:', JSON.stringify(insertParams, null, 2));
    console.log('Integrações solicitadas:', integrations);
    
    // Criar tenant usando pg-format para escape seguro
    const insertQuery = format(
      `INSERT INTO tenants (
        nome_empresa, slug, cnpj, email_contato, telefone, plano,
        limite_usuarios, limite_produtos, limite_pedidos_mes, status,
        criado_em
      ) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, 'trial', NOW())
      RETURNING id`,
      ...insertParams
    );
    
    const insertResult = await pool.query(insertQuery);
    
    const tenantId = insertResult.rows && insertResult.rows.length > 0 ? (insertResult.rows[0] as any).id : null;
    
    if (!tenantId) {
      throw new Error('Falha ao obter ID do tenant criado');
    }
    
    // Criar usuário admin para o tenant
    const adminUsername = `admin_${slug}`;
    const adminPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const userQuery = format(
      `INSERT INTO users (
        tenant_id, username, email, password_hash, full_name, role, created_at
      ) VALUES (%L, %L, %L, %L, %L, 'admin', NOW())`,
      tenantId, adminUsername, email_contato, hashedPassword, nome_empresa
    );
    
    await pool.query(userQuery);
    
    // Salvar integrações configuradas
    for (const integration of integrations) {
      const integrationQuery = format(
        `INSERT INTO tenant_integrations (tenant_id, integration_name, enabled, criado_em)
        VALUES (%L, %L, 1, NOW())`,
        tenantId, integration
      );
      
      await pool.query(integrationQuery);
    }
    
    res.status(201).json({
      success: true,
      tenant_id: tenantId,
      slug,
      admin_credentials: {
        username: adminUsername,
        password: adminPassword,
        email: email_contato
      },
      integrations: integrations,
      message: 'Tenant criado com sucesso! Guarde as credenciais do admin e configure as integrações especificadas.',
      next_step: 'Acesse o painel de integrações para configurar as APIs: ' + integrations.join(', ')
    });
  } catch (error: any) {
    console.error('Erro ao criar tenant:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Erro ao criar tenant',
      details: error.message,
      code: error.code 
    });
  }
});

// Atualizar tenant
router.put('/:id', async (req, res) => {
  try {
    const { company_name, email, phone, plan, status } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (company_name) {
      updates.push(`nome_empresa = $${paramIndex++}`);
      values.push(company_name);
    }
    if (email) {
      updates.push(`email_contato = $${paramIndex++}`);
      values.push(email);
    }
    if (phone) {
      updates.push(`telefone = $${paramIndex++}`);
      values.push(phone);
    }
    if (plan) {
      updates.push(`plano = $${paramIndex++}`);
      values.push(plan);
      
      // Atualizar limites baseados no novo plano
      const limits = {
        basic: { users: 3, products: 100, orders: 500, storage_mb: 500 },
        pro: { users: 10, products: 1000, orders: 5000, storage_mb: 5000 },
        enterprise: { users: -1, products: -1, orders: -1, storage_mb: -1 }
      };
      
      const planLimits = limits[plan as keyof typeof limits];
      if (planLimits) {
        updates.push(`limite_usuarios = $${paramIndex++}, limite_produtos = $${paramIndex++}, limite_pedidos_mes = $${paramIndex++}`);
        values.push(planLimits.users, planLimits.products, planLimits.orders);
      }
    }
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    updates.push('atualizado_em = NOW()');
    values.push(req.params.id);
    
    await pool.query(`
      UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex}
    `, values);
    
    res.json({ success: true, message: 'Tenant atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error);
    res.status(500).json({ error: 'Erro ao atualizar tenant' });
  }
});

// Desativar tenant
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`
      UPDATE tenants SET status = 'suspended', atualizado_em = NOW() WHERE id = $1
    `, [req.params.id]);
    
    res.json({ success: true, message: 'Tenant desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar tenant:', error);
    res.status(500).json({ error: 'Erro ao desativar tenant' });
  }
});

// Obter estatísticas de um tenant
router.get('/:id/stats', async (req, res) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
        (SELECT COUNT(*) FROM products WHERE tenant_id = $2) as total_products,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $3) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $4 AND status = 'pending') as pending_orders,
        (SELECT SUM(total_amount) FROM orders WHERE tenant_id = $5 AND DATE(criado_em) >= CURRENT_DATE - INTERVAL '30 days') as revenue_30d,
        (SELECT criado_em FROM users WHERE tenant_id = $6 ORDER BY criado_em DESC LIMIT 1) as last_activity
    `, [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id]);
    
    res.json(statsResult.rows[0] || {});
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
