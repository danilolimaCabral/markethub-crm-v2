import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { logError, logWarning } from './logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenant_id?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware de autenticação JWT completo
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar e decodificar JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      }
      throw error;
    }

    // Buscar usuário no banco para validar se ainda existe e está ativo
    const userResult = await query(
      'SELECT id, email, role, tenant_id, is_active FROM users WHERE id = $1',
      [decoded.user_id || decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
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

    // Adicionar informações do usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id
    };

    // Atualizar último login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    ).catch(err => {
      // Não falhar a requisição se o update falhar
      logWarning('Erro ao atualizar last_login_at', err);
    });

    next();
  } catch (error) {
    logError('Erro na autenticação', error);
    return res.status(500).json({ 
      error: 'Erro ao processar autenticação',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware para verificar se usuário tem role específica
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado: permissão insuficiente',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se é admin
 */
export const requireAdmin = requireRole('admin', 'superadmin');

export const authenticateSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const credentials = authHeader && authHeader.split(' ')[1];

  if (!credentials) {
    return res.status(401).json({ error: 'Credenciais não fornecidas' });
  }

  // Decodificar Basic Auth
  const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
  const [username, password] = decoded.split(':');

  // Verificar credenciais do super admin
  if (username === 'superadmin' && password === 'SuperAdmin@2024!') {
    req.user = {
      id: 'superadmin',
      email: 'superadmin@markthubcrm.com.br',
      role: 'superadmin'
    };
    next();
  } else {
    res.status(403).json({ error: 'Credenciais inválidas' });
  }
};
