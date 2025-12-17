import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db';
import format from 'pg-format';
import subscriptionService from '../services/subscription.service';
import { generateTokens } from '../middleware/auth';

const router = express.Router();

// Função para validar CNPJ
function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação dos dígitos verificadores
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

// Função para formatar CNPJ
function formatCNPJ(cnpj: string): string {
  cnpj = cnpj.replace(/[^\d]/g, '');
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Função para gerar slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Função para gerar senha aleatória
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * POST /api/register
 * Registrar nova empresa (tenant) via CNPJ
 * Este é o único ponto de entrada para criação de novos tenants
 */
router.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const {
      cnpj,
      nome_empresa,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      admin_name,
      admin_email,
      admin_password,
      plano = 'free'
    } = req.body;

    // Validações obrigatórias
    if (!cnpj) {
      return res.status(400).json({ 
        error: 'CNPJ é obrigatório para cadastro',
        code: 'CNPJ_REQUIRED'
      });
    }

    if (!nome_empresa || nome_empresa.trim() === '') {
      return res.status(400).json({ 
        error: 'Nome da empresa é obrigatório',
        code: 'COMPANY_NAME_REQUIRED'
      });
    }

    if (!admin_email) {
      return res.status(400).json({ 
        error: 'Email do administrador é obrigatório',
        code: 'ADMIN_EMAIL_REQUIRED'
      });
    }

    // Validar formato do CNPJ
    if (!validateCNPJ(cnpj)) {
      return res.status(400).json({ 
        error: 'CNPJ inválido',
        code: 'INVALID_CNPJ'
      });
    }

    const cnpjFormatted = formatCNPJ(cnpj);
    const cnpjClean = cnpj.replace(/[^\d]/g, '');

    // Iniciar transação
    await client.query('BEGIN');

    // Verificar se CNPJ já existe
    const existingCNPJ = await client.query(
      'SELECT id FROM tenants WHERE REPLACE(REPLACE(REPLACE(cnpj, \'.\', \'\'), \'/\', \'\'), \'-\', \'\') = $1',
      [cnpjClean]
    );

    if (existingCNPJ.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'CNPJ já cadastrado no sistema',
        code: 'CNPJ_EXISTS'
      });
    }

    // Verificar se email já existe
    const existingEmail = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [admin_email]
    );

    if (existingEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Email já cadastrado no sistema',
        code: 'EMAIL_EXISTS'
      });
    }

    // Gerar slug único
    let slug = generateSlug(nome_empresa);
    const slugExists = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [slug]
    );
    if (slugExists.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    // Criar tenant (zerado - sem dados pré-existentes)
    const tenantResult = await client.query(`
      INSERT INTO tenants (
        nome_empresa, slug, cnpj, email_contato, telefone,
        endereco, cidade, estado, cep, plano, status, criado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'trial', NOW())
      RETURNING id, nome_empresa, slug, cnpj, plano
    `, [
      nome_empresa, slug, cnpjFormatted, email || admin_email, telefone,
      endereco, cidade, estado, cep, plano
    ]);

    const tenant = tenantResult.rows[0];
    const tenantId = tenant.id;

    // Criar assinatura trial
    await subscriptionService.createTrialSubscription(tenantId);

    // Criar usuário administrador
    const password = admin_password || generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = `admin_${slug}`;

    const userResult = await client.query(`
      INSERT INTO users (
        tenant_id, username, email, password_hash, full_name, role, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'admin', true, NOW())
      RETURNING id, email, username, full_name, role, tenant_id
    `, [tenantId, username, admin_email, hashedPassword, admin_name || nome_empresa]);

    const user = userResult.rows[0];

    // Criar configurações fiscais padrão (zeradas)
    await client.query(`
      INSERT INTO tax_settings (tenant_id, tax_regime)
      VALUES ($1, 'simples_nacional')
    `, [tenantId]);

    // Commit da transação
    await client.query('COMMIT');

    // Gerar tokens de autenticação
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      username: user.username
    });

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: 'Empresa cadastrada com sucesso!',
      tenant: {
        id: tenant.id,
        nome_empresa: tenant.nome_empresa,
        slug: tenant.slug,
        cnpj: tenant.cnpj,
        plano: tenant.plano
      },
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      },
      credentials: admin_password ? undefined : {
        username: username,
        password: password,
        message: 'Guarde estas credenciais! A senha não será exibida novamente.'
      },
      ...tokens
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar empresa:', error);
    res.status(500).json({ 
      error: 'Erro ao cadastrar empresa',
      code: 'REGISTRATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/register/validate-cnpj
 * Validar CNPJ antes do cadastro
 */
router.post('/validate-cnpj', async (req: Request, res: Response) => {
  try {
    const { cnpj } = req.body;

    if (!cnpj) {
      return res.status(400).json({ 
        valid: false, 
        error: 'CNPJ é obrigatório' 
      });
    }

    // Validar formato
    if (!validateCNPJ(cnpj)) {
      return res.status(400).json({ 
        valid: false, 
        error: 'CNPJ inválido' 
      });
    }

    const cnpjClean = cnpj.replace(/[^\d]/g, '');

    // Verificar se já existe
    const existing = await pool.query(
      'SELECT id FROM tenants WHERE REPLACE(REPLACE(REPLACE(cnpj, \'.\', \'\'), \'/\', \'\'), \'-\', \'\') = $1',
      [cnpjClean]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        valid: false, 
        error: 'CNPJ já cadastrado no sistema' 
      });
    }

    res.json({ 
      valid: true, 
      formatted: formatCNPJ(cnpj),
      message: 'CNPJ válido e disponível para cadastro'
    });

  } catch (error: any) {
    console.error('Erro ao validar CNPJ:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Erro ao validar CNPJ' 
    });
  }
});

/**
 * GET /api/register/plans
 * Listar planos disponíveis para novos cadastros
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await subscriptionService.getAllPlans();
    
    const publicPlans = plans.map(plan => ({
      name: plan.name,
      displayName: plan.display_name,
      description: plan.description,
      priceMonthly: plan.price_monthly,
      priceYearly: plan.price_yearly,
      features: plan.features,
      limits: {
        users: plan.max_users,
        products: plan.max_products,
        ordersPerMonth: plan.max_orders_month,
      },
      recommended: plan.name === 'professional'
    }));

    res.json(publicPlans);
  } catch (error: any) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
});

export default router;
