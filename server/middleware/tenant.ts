import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { logError } from './logger';

export interface TenantRequest extends Request {
  tenant_id?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    tenant_id: string;
  };
}

/**
 * Middleware para extrair e validar tenant_id do JWT ou header
 */
export const extractTenant = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Tentar extrair do JWT (se autenticado)
    if (req.user?.tenant_id) {
      req.tenant_id = req.user.tenant_id;
      return next();
    }

    // Tentar extrair do header X-Tenant-ID (para desenvolvimento/testes)
    const tenantIdFromHeader = req.headers['x-tenant-id'] as string;
    if (tenantIdFromHeader) {
      // Validar se tenant existe e está ativo
      const tenantResult = await query(
        'SELECT id, status FROM tenants WHERE id = $1 AND status = $2',
        [tenantIdFromHeader, 'active']
      );

      if (tenantResult.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Tenant não encontrado ou inativo' 
        });
      }

      req.tenant_id = tenantIdFromHeader;
      return next();
    }

    // Se não encontrou tenant, retornar erro
    return res.status(403).json({ 
      error: 'Tenant não identificado. Faça login ou forneça X-Tenant-ID header' 
    });
  } catch (error) {
    logError('Erro ao extrair tenant', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  }
};

/**
 * Middleware para validar se o usuário pertence ao tenant
 */
export const validateTenantAccess = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id || !req.tenant_id) {
      return res.status(403).json({ 
        error: 'Acesso negado: usuário ou tenant não identificado' 
      });
    }

    // Verificar se usuário pertence ao tenant
    const userResult = await query(
      'SELECT id, tenant_id FROM users WHERE id = $1 AND tenant_id = $2',
      [req.user.id, req.tenant_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Acesso negado: usuário não pertence a este tenant' 
      });
    }

    next();
  } catch (error) {
    logError('Erro ao validar acesso ao tenant', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  }
};

/**
 * Helper para adicionar filtro tenant_id em queries SQL
 */
export const addTenantFilter = (
  sql: string,
  params: any[],
  tenantId: string,
  tableAlias: string = ''
): { sql: string; params: any[] } => {
  const alias = tableAlias ? `${tableAlias}.` : '';
  const paramIndex = params.length + 1;
  
  // Verificar se já existe filtro WHERE
  const hasWhere = sql.toUpperCase().includes('WHERE');
  
  if (hasWhere) {
    sql += ` AND ${alias}tenant_id = $${paramIndex}`;
  } else {
    sql += ` WHERE ${alias}tenant_id = $${paramIndex}`;
  }
  
  params.push(tenantId);
  
  return { sql, params };
};

/**
 * Middleware combinado: autenticação + tenant
 */
export const requireAuthAndTenant = [
  extractTenant,
  validateTenantAccess
];
