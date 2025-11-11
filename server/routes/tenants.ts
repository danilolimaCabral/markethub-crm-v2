import express from 'express';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

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

// Listar todos os tenants
router.get('/', async (req, res) => {
  try {
    const [tenants] = await sequelize.query(`
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
    
    res.json(tenants);
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
});

// Obter detalhes de um tenant específico
router.get('/:id', async (req, res) => {
  try {
    const [tenants] = await sequelize.query(`
      SELECT * FROM tenants WHERE id = $1
    `, [req.params.id]);
    
    if (!Array.isArray(tenants) || tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const tenant = tenants[0];
    
    // Buscar estatísticas
    const [stats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as user_count,
        (SELECT COUNT(*) FROM products WHERE tenant_id = $2) as product_count,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $3) as order_count,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $4 AND DATE(criado_em) = CURRENT_DATE) as orders_today
    `, [req.params.id, req.params.id, req.params.id, req.params.id]);
    
    res.json({ ...tenant, stats: Array.isArray(stats) ? stats[0] : {} });
  } catch (error) {
    console.error('Erro ao buscar tenant:', error);
    res.status(500).json({ error: 'Erro ao buscar tenant' });
  }
});

// Criar novo tenant
router.post('/', async (req, res) => {
  try {
    const {
      company_name,
      cnpj,
      email,
      phone,
      plan = 'starter',
      integrations = []
    } = req.body;
    
    // Validações
    if (!company_name || !cnpj || !email) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }
    
    // Verificar se CNPJ já existe
    const [existing] = await sequelize.query('SELECT id FROM tenants WHERE cnpj = $1', [cnpj]);
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }
    
    // Gerar slug único
    let slug = generateSlug(company_name);
    const [slugExists] = await sequelize.query('SELECT id FROM tenants WHERE slug = $1', [slug]);
    if (Array.isArray(slugExists) && slugExists.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }
    
    // Definir limites baseados no plano
    const limits = {
      starter: { users: 3, products: 100, orders: 500 },
      professional: { users: 10, products: 1000, orders: 5000 },
      business: { users: 25, products: 2000, orders: 10000 },
      enterprise: { users: -1, products: -1, orders: -1 }
    };
    
    const planLimits = limits[plan as keyof typeof limits] || limits.starter;
    
    // Criar tenant
    const [result] = await sequelize.query(`
      INSERT INTO tenants (
        nome_empresa, slug, cnpj, email_contato, telefone, plano,
        limite_usuarios, limite_produtos, limite_pedidos_mes, status,
        criado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW())
      RETURNING id
    `, [
      company_name, slug, cnpj, email, phone, plan,
      planLimits.users, planLimits.products, planLimits.orders
    ]);
    
    const tenantId = Array.isArray(result) && result.length > 0 ? (result[0] as any).id : null;
    
    if (!tenantId) {
      throw new Error('Falha ao obter ID do tenant criado');
    }
    
    // Criar usuário admin para o tenant
    const adminUsername = `admin_${slug}`;
    const adminPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await sequelize.query(`
      INSERT INTO users (
        tenant_id, username, email, password_hash, full_name, role, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'admin', NOW())
    `, [tenantId, adminUsername, email, hashedPassword, company_name]);
    
    // Salvar integrações configuradas
    if (integrations.length > 0) {
      for (const integration of integrations) {
        await sequelize.query(`
          INSERT INTO tenant_integrations (tenant_id, integration_name, enabled, criado_em)
          VALUES ($1, $2, 1, NOW())
        `, [tenantId, integration]);
      }
    }
    
    res.status(201).json({
      success: true,
      tenant_id: tenantId,
      slug,
      admin_credentials: {
        username: adminUsername,
        password: adminPassword,
        email: email
      },
      message: 'Tenant criado com sucesso! Guarde as credenciais do admin.'
    });
  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    res.status(500).json({ error: 'Erro ao criar tenant' });
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
    
    await sequelize.query(`
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
    await sequelize.query(`
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
    const [stats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
        (SELECT COUNT(*) FROM products WHERE tenant_id = $2) as total_products,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $3) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = $4 AND status = 'pending') as pending_orders,
        (SELECT SUM(total_amount) FROM orders WHERE tenant_id = $5 AND DATE(criado_em) >= CURRENT_DATE - INTERVAL '30 days') as revenue_30d,
        (SELECT criado_em FROM users WHERE tenant_id = $6 ORDER BY criado_em DESC LIMIT 1) as last_activity
    `, [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id]);
    
    res.json(Array.isArray(stats) && stats.length > 0 ? stats[0] : {});
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
