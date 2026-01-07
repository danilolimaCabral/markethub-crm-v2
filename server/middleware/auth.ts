import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

// Secrets para JWT (em produção, usar variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'markethub-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'markethub-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Access token expira em 15 minutos
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Refresh token expira em 7 dias

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenant_id?: string;
    username?: string;
  };
  tenant_id?: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  tenant_id?: string;
  username?: string;
  type: 'access' | 'refresh';
}

/**
 * Gera um Access Token JWT
 */
export function generateAccessToken(user: {
  id: string;
  email: string;
  role: string;
  tenant_id?: string;
  username?: string;
}): string {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,
    username: user.username,
    type: 'access'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'markethub-crm',
    audience: 'markethub-api'
  }) as string;
}

/**
 * Gera um Refresh Token JWT
 */
export function generateRefreshToken(user: {
  id: string;
  email: string;
  role: string;
  tenant_id?: string;
}): string {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'markethub-crm',
    audience: 'markethub-api'
  }) as string;
}

/**
 * Gera ambos os tokens (access + refresh)
 */
export function generateTokens(user: {
  id: string;
  email: string;
  role: string;
  tenant_id?: string;
  username?: string;
}) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: JWT_EXPIRES_IN
  };
}

/**
 * Verifica e decodifica um Access Token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'markethub-crm',
      audience: 'markethub-api'
    }) as TokenPayload;

    if (decoded.type !== 'access') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica e decodifica um Refresh Token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'markethub-crm',
      audience: 'markethub-api'
    }) as TokenPayload;

    if (decoded.type !== 'refresh') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware de autenticação JWT
 * Verifica o token e adiciona o usuário ao request
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de autenticação não fornecido',
        code: 'TOKEN_MISSING'
      });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(403).json({
        error: 'Token inválido ou expirado',
        code: 'TOKEN_INVALID'
      });
    }

    // Verificar se o usuário ainda existe no banco
    const userResult = await query(
      'SELECT id, email, username, role, tenant_id, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Usuário inativo',
        code: 'USER_INACTIVE'
      });
    }

    // Adicionar usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      tenant_id: user.tenant_id
    };

    req.tenant_id = user.tenant_id;

    // Atualizar último acesso
    query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id])
      .catch(err => console.error('Erro ao atualizar last_login:', err));

    next();
  } catch (error: any) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      error: 'Erro ao processar autenticação',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware para verificar se o usuário é Admin
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores podem acessar este recurso.',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Middleware para verificar permissão específica de módulo
 */
export const requirePermission = (moduleName: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Admins têm acesso a tudo
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }

    try {
      // Verificar permissão no banco
      const permissionResult = await query(
        `SELECT can_view, can_create, can_edit, can_delete 
         FROM user_permissions 
         WHERE user_id = $1 AND module_name = $2`,
        [req.user.id, moduleName]
      );

      if (permissionResult.rows.length === 0) {
        return res.status(403).json({
          error: `Sem permissão para acessar o módulo ${moduleName}`,
          code: 'PERMISSION_DENIED'
        });
      }

      const permission = permissionResult.rows[0];
      let hasPermission = false;

      switch (action) {
        case 'view':
          hasPermission = permission.can_view;
          break;
        case 'create':
          hasPermission = permission.can_create;
          break;
        case 'edit':
          hasPermission = permission.can_edit;
          break;
        case 'delete':
          hasPermission = permission.can_delete;
          break;
      }

      if (!hasPermission) {
        return res.status(403).json({
          error: `Sem permissão para ${action} no módulo ${moduleName}`,
          code: 'ACTION_NOT_PERMITTED'
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return res.status(500).json({
        error: 'Erro ao verificar permissões',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware para Super Admin (acesso total ao sistema)
 */
export const authenticateSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Credenciais não fornecidas',
      code: 'CREDENTIALS_MISSING'
    });
  }

  // Suporta tanto Basic Auth quanto Bearer Token
  if (authHeader.startsWith('Basic ')) {
    const credentials = authHeader.split(' ')[1];
    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    // Em produção, usar hash bcrypt e buscar do banco
    const SUPER_ADMIN_USER = process.env.SUPER_ADMIN_USER || 'superadmin';
    const SUPER_ADMIN_PASS = process.env.SUPER_ADMIN_PASS || 'SuperAdmin@2024!';

    if (username === SUPER_ADMIN_USER && password === SUPER_ADMIN_PASS) {
      req.user = {
        id: 'superadmin',
        email: 'superadmin@markethubcrm.com.br',
        role: 'superadmin'
      };
      return next();
    }

    return res.status(403).json({
      error: 'Credenciais inválidas',
      code: 'INVALID_CREDENTIALS'
    });
  }

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.role !== 'superadmin') {
      return res.status(403).json({
        error: 'Token inválido ou sem permissão de superadmin',
        code: 'SUPERADMIN_REQUIRED'
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenant_id: decoded.tenant_id
    };
    return next();
  }

  return res.status(401).json({
    error: 'Formato de autenticação inválido',
    code: 'INVALID_AUTH_FORMAT'
  });
};

/**
 * Middleware para garantir isolamento de tenant
 * Verifica se o recurso pertence ao tenant do usuário
 */
export const enforceTenantIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Superadmins podem acessar qualquer tenant
  if (req.user?.role === 'superadmin') {
    return next();
  }

  if (!req.user?.tenant_id) {
    return res.status(403).json({
      error: 'Tenant não identificado',
      code: 'TENANT_MISSING'
    });
  }

  // O tenant_id já foi adicionado ao request pelo authenticateToken
  // Aqui apenas garantimos que ele existe
  next();
};

/**
 * Lista de emails de admin master protegidos
 * Estes usuários não podem ser acessados, modificados ou visualizados por outros usuários
 */
const PROTECTED_ADMIN_EMAILS = [
  'admin@markethubcrm.com.br'
];

/**
 * Verifica se um email pertence a um admin master protegido
 */
export function isProtectedAdmin(email: string): boolean {
  return PROTECTED_ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Verifica se um user_id pertence a um admin master protegido
 */
export async function isProtectedAdminById(userId: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return isProtectedAdmin(result.rows[0].email);
  } catch (error) {
    console.error('Erro ao verificar admin protegido:', error);
    return false;
  }
}

/**
 * Middleware para bloquear acesso a dados do admin master
 * Impede que usuários comuns visualizem, editem ou excluam dados do admin master
 */
export const protectMasterAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Superadmin pode acessar tudo
  if (req.user?.role === 'superadmin') {
    return next();
  }

  // Se o próprio usuário é um admin master, pode acessar seus próprios dados
  if (req.user?.email && isProtectedAdmin(req.user.email)) {
    return next();
  }

  // Verificar se está tentando acessar dados de um admin master
  const targetUserId = req.params.id || req.params.userId || req.body.user_id || req.query.user_id;
  const targetEmail = req.body.email || req.query.email;

  // Bloquear acesso por email
  if (targetEmail && isProtectedAdmin(targetEmail as string)) {
    return res.status(403).json({
      error: 'Acesso negado. Você não tem permissão para acessar dados do administrador master.',
      code: 'MASTER_ADMIN_PROTECTED'
    });
  }

  // Bloquear acesso por ID
  if (targetUserId) {
    const isProtected = await isProtectedAdminById(targetUserId as string);
    if (isProtected) {
      return res.status(403).json({
        error: 'Acesso negado. Você não tem permissão para acessar dados do administrador master.',
        code: 'MASTER_ADMIN_PROTECTED'
      });
    }
  }

  next();
};

/**
 * Middleware para filtrar admin master de listagens
 * Remove automaticamente admin master de resultados de queries
 */
export const filterMasterAdminFromResults = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Superadmin pode ver tudo
  if (req.user?.role === 'superadmin') {
    return next();
  }

  // Se o próprio usuário é um admin master, pode ver seus próprios dados
  if (req.user?.email && isProtectedAdmin(req.user.email)) {
    return next();
  }

  // Interceptar o res.json para filtrar resultados
  const originalJson = res.json.bind(res);
  
  res.json = function(data: any) {
    if (Array.isArray(data)) {
      // Filtrar array de usuários
      const filtered = data.filter(item => {
        if (item.email && isProtectedAdmin(item.email)) {
          return false;
        }
        return true;
      });
      return originalJson(filtered);
    } else if (data && typeof data === 'object') {
      // Filtrar objeto único
      if (data.email && isProtectedAdmin(data.email)) {
        return originalJson(null);
      }
      
      // Filtrar arrays dentro do objeto
      if (data.users && Array.isArray(data.users)) {
        data.users = data.users.filter((user: any) => {
          if (user.email && isProtectedAdmin(user.email)) {
            return false;
          }
          return true;
        });
      }
    }
    
    return originalJson(data);
  };

  next();
};

/**
 * Middleware opcional - permite acesso sem autenticação
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continua sem autenticação
  }

  const decoded = verifyAccessToken(token);

  if (decoded) {
    try {
      const userResult = await query(
        'SELECT id, email, username, role, tenant_id, is_active FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
        const user = userResult.rows[0];
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          tenant_id: user.tenant_id
        };
        req.tenant_id = user.tenant_id;
      }
    } catch (error) {
      console.error('Erro ao verificar token opcional:', error);
    }
  }

  next();
};
