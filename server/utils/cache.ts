/**
 * Sistema de Cache com Redis (opcional)
 * Se Redis não estiver disponível, usa cache em memória
 */

interface CacheEntry {
  value: any;
  expiresAt: number;
}

class CacheManager {
  private redis: any = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeRedis();
    this.startCleanupTask();
  }

  /**
   * Inicializa conexão Redis se disponível
   */
  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (redisUrl) {
        // Importar Redis dinamicamente
        const { createClient } = await import('redis');
        
        this.redis = createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                console.error('Redis: Máximo de tentativas de reconexão atingido');
                return new Error('Máximo de tentativas atingido');
              }
              return retries * 1000;
            }
          }
        });

        this.redis.on('error', (err: Error) => {
          console.error('Redis Error:', err.message);
          // Fallback para cache em memória
          this.redis = null;
        });

        this.redis.on('connect', () => {
          console.log('✅ Redis conectado');
        });

        await this.redis.connect();
      } else {
        console.log('ℹ️  Redis não configurado, usando cache em memória');
      }
    } catch (error) {
      console.warn('⚠️  Redis não disponível, usando cache em memória:', error);
      this.redis = null;
    }
  }

  /**
   * Task de limpeza para cache em memória
   */
  private startCleanupTask() {
    // Limpar cache expirado a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt < now) {
          this.memoryCache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Armazena valor no cache
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      if (this.redis) {
        // Usar Redis
        await this.redis.setEx(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Usar cache em memória
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.memoryCache.set(key, { value, expiresAt });
      }
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }

  /**
   * Recupera valor do cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        // Buscar no Redis
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // Buscar em memória
        const entry = this.memoryCache.get(key);
        if (!entry) return null;
        
        if (entry.expiresAt < Date.now()) {
          this.memoryCache.delete(key);
          return null;
        }
        
        return entry.value;
      }
    } catch (error) {
      console.error('Erro ao buscar no cache:', error);
      return null;
    }
  }

  /**
   * Remove valor do cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Erro ao deletar do cache:', error);
    }
  }

  /**
   * Remove múltiplas chaves com padrão
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      } else {
        // Em memória, deletar chaves que correspondem ao padrão
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao deletar pattern do cache:', error);
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushDb();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  /**
   * Verifica se uma chave existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.redis) {
        return (await this.redis.exists(key)) === 1;
      } else {
        const entry = this.memoryCache.get(key);
        if (!entry) return false;
        if (entry.expiresAt < Date.now()) {
          this.memoryCache.delete(key);
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Erro ao verificar existência no cache:', error);
      return false;
    }
  }

  /**
   * Incrementa um contador
   */
  async increment(key: string, ttlSeconds: number = 300): Promise<number> {
    try {
      if (this.redis) {
        const value = await this.redis.incr(key);
        await this.redis.expire(key, ttlSeconds);
        return value;
      } else {
        const entry = this.memoryCache.get(key);
        const newValue = (entry?.value || 0) + 1;
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.memoryCache.set(key, { value: newValue, expiresAt });
        return newValue;
      }
    } catch (error) {
      console.error('Erro ao incrementar no cache:', error);
      return 0;
    }
  }

  /**
   * Obtém ou define valor com função de fallback
   */
  async getOrSet<T = any>(
    key: string,
    fallback: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Tentar obter do cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Se não existe, executar fallback e cachear
    const value = await fallback();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Fecha conexão Redis
   */
  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Instância singleton
export const cache = new CacheManager();

/**
 * Middleware Express para cache de respostas
 */
export function cacheMiddleware(ttlSeconds: number = 300) {
  return async (req: any, res: any, next: any) => {
    // Apenas cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Gerar chave baseada na URL e query params
    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      // Verificar se existe no cache
      const cachedResponse = await cache.get(cacheKey);
      
      if (cachedResponse) {
        // Adicionar header indicando cache hit
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedResponse);
      }

      // Interceptar res.json para cachear resposta
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Cachear resposta
        cache.set(cacheKey, body, ttlSeconds).catch(err => 
          console.error('Erro ao cachear resposta:', err)
        );
        
        // Adicionar header indicando cache miss
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Erro no middleware de cache:', error);
      next();
    }
  };
}

/**
 * Helpers para chaves de cache específicas
 */
export const CacheKeys = {
  // Produtos
  products: (tenantId: string) => `products:${tenantId}`,
  product: (tenantId: string, productId: string) => `product:${tenantId}:${productId}`,
  
  // Pedidos
  orders: (tenantId: string) => `orders:${tenantId}`,
  order: (tenantId: string, orderId: string) => `order:${tenantId}:${orderId}`,
  
  // Clientes
  customers: (tenantId: string) => `customers:${tenantId}`,
  customer: (tenantId: string, customerId: string) => `customer:${tenantId}:${customerId}`,
  
  // Métricas (cache mais longo)
  metrics: (tenantId: string) => `metrics:${tenantId}`,
  dashboard: (tenantId: string) => `dashboard:${tenantId}`,
  
  // Usuário
  user: (userId: string) => `user:${userId}`,
  userPermissions: (userId: string) => `permissions:${userId}`,
  
  // Tenant
  tenant: (tenantId: string) => `tenant:${tenantId}`,
};

/**
 * Exemplo de uso em rotas:
 * 
 * // Cache automático de resposta
 * router.get('/produtos', 
 *   cacheMiddleware(300), // 5 minutos
 *   async (req, res) => {
 *     const produtos = await getProdutos();
 *     res.json(produtos);
 *   }
 * );
 * 
 * // Cache manual com fallback
 * const produtos = await cache.getOrSet(
 *   CacheKeys.products(tenantId),
 *   async () => {
 *     return await query('SELECT * FROM products WHERE tenant_id = $1', [tenantId]);
 *   },
 *   300
 * );
 * 
 * // Invalidar cache ao criar/atualizar
 * router.post('/produtos', async (req, res) => {
 *   await createProduct(req.body);
 *   await cache.deletePattern(`products:${tenantId}*`);
 *   res.json({ success: true });
 * });
 */

export default cache;
