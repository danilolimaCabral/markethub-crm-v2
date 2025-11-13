import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter geral para API
 * 100 requisições por 15 minutos por IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por windowMs
  message: {
    error: 'Muitas requisições deste IP, por favor tente novamente mais tarde.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Limite de requisições excedido',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

/**
 * Rate Limiter estrito para rotas de autenticação
 * 5 tentativas por 15 minutos
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite de 5 tentativas
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
  message: {
    error: 'Muitas tentativas de login. Por favor, aguarde 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Muitas tentativas de autenticação. Aguarde antes de tentar novamente.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

/**
 * Rate Limiter para criação de recursos
 * 30 criações por hora
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30,
  message: {
    error: 'Limite de criação de recursos excedido',
    code: 'CREATE_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Rate Limiter para exportação de dados
 * 10 exportações por hora (operação mais pesada)
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: {
    error: 'Limite de exportações excedido. Aguarde antes de exportar novamente.',
    code: 'EXPORT_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Rate Limiter para integrações de marketplace
 * 60 requisições por minuto (respeitar limites das APIs externas)
 */
export const marketplaceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  message: {
    error: 'Limite de requisições para marketplace excedido',
    code: 'MARKETPLACE_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Rate Limiter dinâmico baseado no plano do tenant
 */
export const dynamicLimiter = (getLimit: (req: Request) => number) => {
  const limiters = new Map<string, any>();

  return (req: Request, res: Response, next: NextFunction) => {
    const limit = getLimit(req);
    const key = `${req.ip}-${limit}`;

    let limiter = limiters.get(key);

    if (!limiter) {
      limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: limit,
        skipFailedRequests: false,
        handler: (req: Request, res: Response) => {
          res.status(429).json({
            error: 'Limite de requisições excedido para seu plano',
            code: 'PLAN_RATE_LIMIT_EXCEEDED',
            retryAfter: res.getHeader('Retry-After')
          });
        }
      });

      limiters.set(key, limiter);
    }

    limiter(req, res, next);
  };
};

/**
 * Rate Limiter por tenant (para sistema multi-tenant)
 * Cada tenant tem seu próprio limite
 */
export const tenantLimiter = dynamicLimiter((req: any) => {
  const tenantId = req.tenant_id || req.user?.tenant_id;

  if (!tenantId) {
    return 50; // Limite padrão baixo para requisições sem tenant
  }

  // Aqui você pode buscar o plano do tenant do banco e retornar limite apropriado
  // Por enquanto, retorna um limite padrão
  const plans: Record<string, number> = {
    'starter': 100,
    'professional': 300,
    'business': 1000,
    'enterprise': 5000
  };

  // Em produção, buscar o plano do banco
  // const tenant = await getTenantById(tenantId);
  // return plans[tenant.plan] || 100;

  return 300; // Default para professional
});

/**
 * Middleware para prevenir brute force em endpoints específicos
 */
export const bruteForcePrevention = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Apenas 3 tentativas por hora
  skipSuccessfulRequests: true,
  message: {
    error: 'Muitas tentativas falhadas. Sua conta foi temporariamente bloqueada.',
    code: 'BRUTE_FORCE_DETECTED'
  },
  handler: (req: Request, res: Response) => {
    // Log de segurança
    console.warn(`Possível brute force detectado: ${req.ip} - ${req.originalUrl}`);

    res.status(429).json({
      error: 'Muitas tentativas falhadas. Aguarde 1 hora ou entre em contato com o suporte.',
      code: 'BRUTE_FORCE_DETECTED',
      retryAfter: '3600'
    });
  }
});

/**
 * Middleware customizado para rate limiting com Redis (melhor para produção)
 * Requer Redis configurado
 */
class RedisRateLimiter {
  private redis: any; // Redis client
  private prefix: string;

  constructor(redisClient?: any) {
    this.redis = redisClient;
    this.prefix = 'ratelimit:';
  }

  /**
   * Verifica se o limite foi excedido
   */
  async isRateLimited(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ limited: boolean; remaining: number; resetAt: Date }> {
    if (!this.redis) {
      // Se Redis não está disponível, permite requisição
      return {
        limited: false,
        remaining: maxRequests,
        resetAt: new Date(Date.now() + windowSeconds * 1000)
      };
    }

    const redisKey = `${this.prefix}${key}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const clearBefore = now - windowMs;

    try {
      // Remove entradas antigas
      await this.redis.zremrangebyscore(redisKey, 0, clearBefore);

      // Conta requisições no window
      const count = await this.redis.zcard(redisKey);

      if (count >= maxRequests) {
        const oldestEntry = await this.redis.zrange(redisKey, 0, 0, 'WITHSCORES');
        const resetAt = new Date(parseInt(oldestEntry[1]) + windowMs);

        return {
          limited: true,
          remaining: 0,
          resetAt
        };
      }

      // Adiciona nova entrada
      await this.redis.zadd(redisKey, now, `${now}`);
      await this.redis.expire(redisKey, windowSeconds);

      return {
        limited: false,
        remaining: maxRequests - count - 1,
        resetAt: new Date(now + windowMs)
      };
    } catch (error) {
      console.error('Erro no rate limiter Redis:', error);
      // Em caso de erro, permite requisição
      return {
        limited: false,
        remaining: maxRequests,
        resetAt: new Date(Date.now() + windowSeconds * 1000)
      };
    }
  }

  /**
   * Middleware para usar com Express
   */
  middleware(maxRequests: number, windowSeconds: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const result = await this.isRateLimited(key, maxRequests, windowSeconds);

      // Adiciona headers de rate limit
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

      if (result.limited) {
        return res.status(429).json({
          error: 'Limite de requisições excedido',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
        });
      }

      next();
    };
  }
}

// Exportar instância para uso
export const redisRateLimiter = new RedisRateLimiter();

/**
 * Helper para criar rate limiter customizado
 */
export const createRateLimiter = (config: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: config.message || 'Limite de requisições excedido',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: res.getHeader('Retry-After')
      });
    }
  });
};
