import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { TenantRequest } from './tenant';
import { query } from '../db';

/**
 * Limites por plano de assinatura
 */
const PLAN_LIMITS: Record<string, { requests: number; window: number }> = {
  starter: { requests: 100, window: 60 * 1000 }, // 100 req/min
  professional: { requests: 500, window: 60 * 1000 }, // 500 req/min
  business: { requests: 2000, window: 60 * 1000 }, // 2000 req/min
  enterprise: { requests: 10000, window: 60 * 1000 } // 10000 req/min
};

/**
 * Rate limiter dinâmico baseado no plano do tenant
 */
export const tenantRateLimit = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.tenant_id;

    if (!tenantId) {
      // Se não tem tenant, usar limite padrão
      return rateLimit({
        windowMs: 60 * 1000,
        max: 50,
        message: 'Muitas requisições. Tente novamente em alguns instantes.',
        standardHeaders: true,
        legacyHeaders: false
      })(req, res, next);
    }

    // Buscar plano do tenant
    const tenantResult = await query(
      'SELECT plano FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(403).json({ error: 'Tenant não encontrado' });
    }

    const plano = tenantResult.rows[0].plano || 'starter';
    const limits = PLAN_LIMITS[plano] || PLAN_LIMITS.starter;

    // Criar rate limiter específico para este tenant
    const limiter = rateLimit({
      windowMs: limits.window,
      max: limits.requests,
      keyGenerator: (req) => {
        return `tenant:${tenantId}:${req.ip}`;
      },
      message: {
        error: 'Limite de requisições excedido',
        code: 'RATE_LIMIT_EXCEEDED',
        plan: plano,
        limit: limits.requests,
        window: limits.window / 1000
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Pular rate limit para superadmin
        return (req as TenantRequest).user?.role === 'superadmin';
      }
    });

    return limiter(req, res, next);
  } catch (error) {
    console.error('Erro no rate limiter:', error);
    // Em caso de erro, permitir requisição mas logar
    next();
  }
};

/**
 * Rate limiter global para rotas públicas
 */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: {
    error: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para autenticação (mais restritivo)
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});
