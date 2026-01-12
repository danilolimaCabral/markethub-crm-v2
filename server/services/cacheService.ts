/**
 * Serviço de Cache com Redis
 * Markthub CRM - Otimização de performance
 */

import Redis from 'ioredis';

// Configuração do Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
};

// Cliente Redis
let redisClient: Redis | null = null;

/**
 * Inicializa conexão com Redis
 */
export function initRedis(): Redis {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      console.log('✅ Redis conectado com sucesso');
    });

    redisClient.on('error', (error) => {
      console.error('❌ Erro no Redis:', error);
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis pronto para uso');
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Erro ao inicializar Redis:', error);
    throw error;
  }
}

/**
 * Obtém cliente Redis
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Fecha conexão com Redis
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis desconectado');
  }
}

/**
 * Define um valor no cache
 * @param key Chave do cache
 * @param value Valor a ser armazenado
 * @param ttl Tempo de vida em segundos (padrão: 3600 = 1 hora)
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number = 3600
): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) {
      console.warn('⚠️ Redis não disponível, cache não será usado');
      return false;
    }

    const serialized = JSON.stringify(value);
    await client.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error('❌ Erro ao definir cache:', error);
    return false;
  }
}

/**
 * Obtém um valor do cache
 * @param key Chave do cache
 * @returns Valor armazenado ou null se não encontrado
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    if (!client) {
      return null;
    }

    const cached = await client.get(key);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error('❌ Erro ao obter cache:', error);
    return null;
  }
}

/**
 * Remove um valor do cache
 * @param key Chave do cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    await client.del(key);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar cache:', error);
    return false;
  }
}

/**
 * Remove múltiplos valores do cache por padrão
 * @param pattern Padrão de chaves (ex: "cnpj:*")
 */
export async function deleteCacheByPattern(pattern: string): Promise<number> {
  try {
    const client = getRedisClient();
    if (!client) {
      return 0;
    }

    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('❌ Erro ao deletar cache por padrão:', error);
    return 0;
  }
}

/**
 * Verifica se uma chave existe no cache
 * @param key Chave do cache
 */
export async function existsCache(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('❌ Erro ao verificar existência no cache:', error);
    return false;
  }
}

/**
 * Define tempo de expiração para uma chave
 * @param key Chave do cache
 * @param ttl Tempo de vida em segundos
 */
export async function expireCache(key: string, ttl: number): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    await client.expire(key, ttl);
    return true;
  } catch (error) {
    console.error('❌ Erro ao definir expiração do cache:', error);
    return false;
  }
}

/**
 * Obtém tempo de vida restante de uma chave
 * @param key Chave do cache
 * @returns Tempo em segundos ou -1 se não existe, -2 se não tem expiração
 */
export async function getTTL(key: string): Promise<number> {
  try {
    const client = getRedisClient();
    if (!client) {
      return -1;
    }

    return await client.ttl(key);
  } catch (error) {
    console.error('❌ Erro ao obter TTL do cache:', error);
    return -1;
  }
}

/**
 * Limpa todo o cache
 */
export async function clearCache(): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    await client.flushdb();
    console.log('✅ Cache limpo com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    return false;
  }
}

/**
 * Obtém informações do Redis
 */
export async function getRedisInfo(): Promise<any> {
  try {
    const client = getRedisClient();
    if (!client) {
      return null;
    }

    const info = await client.info();
    return info;
  } catch (error) {
    console.error('❌ Erro ao obter informações do Redis:', error);
    return null;
  }
}

/**
 * Middleware de cache para Express
 * @param ttl Tempo de vida em segundos
 */
export function cacheMiddleware(ttl: number = 3600) {
  return async (req: any, res: any, next: any) => {
    // Apenas cachear requisições GET
    if (req.method !== 'GET') {
      return next();
    }

    // Gerar chave do cache baseada na URL
    const cacheKey = `route:${req.originalUrl}`;

    try {
      // Tentar obter do cache
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit: ${cacheKey}`);
        return res.json(cached);
      }

      // Se não estiver no cache, interceptar resposta
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Salvar no cache
        setCache(cacheKey, body, ttl).catch((error) => {
          console.error('❌ Erro ao salvar no cache:', error);
        });
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('❌ Erro no middleware de cache:', error);
      next();
    }
  };
}

/**
 * Decorator para cachear resultados de funções
 * @param ttl Tempo de vida em segundos
 */
export function cacheable(ttl: number = 3600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Gerar chave do cache baseada no nome da função e argumentos
      const cacheKey = `func:${propertyKey}:${JSON.stringify(args)}`;

      // Tentar obter do cache
      const cached = await getCache(cacheKey);
      if (cached !== null) {
        console.log(`✅ Cache hit: ${cacheKey}`);
        return cached;
      }

      // Executar função original
      const result = await originalMethod.apply(this, args);

      // Salvar no cache
      await setCache(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

export default {
  initRedis,
  getRedisClient,
  closeRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
  existsCache,
  expireCache,
  getTTL,
  clearCache,
  getRedisInfo,
  cacheMiddleware,
  cacheable,
};
