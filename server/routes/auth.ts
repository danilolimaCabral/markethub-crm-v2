import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import {
  generateTokens,
  verifyRefreshToken,
  generateAccessToken,
  AuthRequest,
  authenticateToken
} from '../middleware/auth';
import { validate, loginSchema, registerUserSchema } from '../middleware/validation';
import { authLimiter, bruteForcePrevention } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * POST /api/auth/register
 * Registrar novo usuário
 */
router.post('/register', authLimiter, validate(registerUserSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, username, tenant_id } = req.body;

    // Verificar se email já existe
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: 'Email já cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Verificar se username já existe (se fornecido)
    if (username) {
      const existingUsername = await query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUsername.rows.length > 0) {
        return res.status(400).json({
          error: 'Username já cadastrado',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    // Inserir usuário
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, username, role, tenant_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, username, role, tenant_id, created_at`,
      [email, password_hash, full_name, username || email.split('@')[0], 'user', tenant_id, true]
    );

    const user = result.rows[0];

    // Gerar tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      username: user.username
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        tenant_id: user.tenant_id,
        created_at: user.created_at
      },
      ...tokens
    });
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      error: 'Erro ao criar usuário',
      code: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('[LOGIN] Tentativa de login:', { email });

    // Buscar usuário por email OU username
    const result = await query(
      `SELECT id, email, password_hash, 
              full_name, username, role, tenant_id, is_active, two_factor_enabled
       FROM users 
       WHERE email = $1 OR username = $1`,
      [email]
    );
    console.log('[LOGIN] Usuários encontrados:', result.rows.length);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar se usuário está ativo
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Usuário inativo. Entre em contato com o administrador.',
        code: 'USER_INACTIVE'
      });
    }

    // Verificar senha
    console.log('[LOGIN] Verificando senha...');
    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('[LOGIN] Senha válida:', validPassword);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Se 2FA está habilitado, retornar indicação para verificar
    if (user.two_factor_enabled) {
      // Gerar token temporário para 2FA
      const tempToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: 'temp_2fa', // Role temporário
        tenant_id: user.tenant_id
      });

      return res.json({
        requires_2fa: true,
        temp_token: tempToken,
        message: 'Por favor, insira o código do seu aplicativo autenticador'
      });
    }

    // Atualizar último login (comentado temporariamente devido a trigger com erro)
    // await query(
    //   'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    //   [user.id]
    // );

    // Gerar tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      username: user.username
    });

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        tenant_id: user.tenant_id
      },
      ...tokens
    });
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      error: 'Erro ao processar login',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token não fornecido',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(403).json({
        error: 'Refresh token inválido ou expirado',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Buscar usuário atualizado
    const result = await query(
      'SELECT id, email, username, role, tenant_id, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(403).json({
        error: 'Usuário não encontrado ou inativo',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Gerar novo access token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      username: user.username
    });

    res.json({
      accessToken,
      expiresIn: '15m'
    });
  } catch (error: any) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      error: 'Erro ao renovar token',
      code: 'REFRESH_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout do usuário (opcional - pode implementar blacklist de tokens)
 */
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Em um sistema com blacklist de tokens, adicionar token à blacklist aqui
    // Por enquanto, apenas retorna sucesso (cliente deve descartar o token)

    res.json({
      message: 'Logout realizado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({
      error: 'Erro ao processar logout',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * GET /api/auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT id, email, full_name, username, role, tenant_id, is_active, 
              two_factor_enabled, created_at, last_login_at
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        tenant_id: user.tenant_id,
        is_active: user.is_active,
        two_factor_enabled: user.two_factor_enabled,
        created_at: user.created_at,
        last_login_at: user.last_login_at
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro ao buscar dados do usuário',
      code: 'USER_FETCH_ERROR'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Alterar senha do usuário autenticado
 */
router.post('/change-password', authenticateToken, bruteForcePrevention, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Nova senha deve ter no mínimo 8 caracteres',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Buscar senha atual
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar senha atual
    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Senha atual incorreta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      message: 'Senha alterada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro ao alterar senha',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Solicitar recuperação de senha (envia email com token)
 */
router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Buscar usuário
    const result = await query(
      'SELECT id, email, full_name FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    // Por segurança, sempre retornar sucesso mesmo se email não existir
    if (result.rows.length === 0) {
      return res.json({
        message: 'Se o email existir, você receberá instruções para recuperar sua senha'
      });
    }

    // TODO: Implementar envio de email com token de recuperação
    // const resetToken = generatePasswordResetToken(user.id);
    // await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      message: 'Se o email existir, você receberá instruções para recuperar sua senha'
    });
  } catch (error: any) {
    console.error('Erro ao processar recuperação de senha:', error);
    res.status(500).json({
      error: 'Erro ao processar solicitação',
      code: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

export default router;
