import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Por enquanto, autenticação simples
  // TODO: Implementar JWT real
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  // Simulação de validação de token
  // Em produção, usar JWT
  if (token === 'valid-token') {
    req.user = {
      id: '1',
      email: 'admin@markethub.com',
      role: 'admin'
    };
    next();
  } else {
    res.status(403).json({ error: 'Token inválido' });
  }
};

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
      email: 'superadmin@markethub.com',
      role: 'superadmin'
    };
    next();
  } else {
    res.status(403).json({ error: 'Credenciais inválidas' });
  }
};
