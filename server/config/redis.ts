/**
 * Configuração do Redis
 * Markthub CRM - Cache e sessões
 */

export const redisConfig = {
  // Conexão
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),

  // Retry strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  // Configurações de conexão
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  lazyConnect: false,

  // Configurações de performance
  keepAlive: 30000,
  noDelay: true,

  // Configurações de reconexão
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconectar apenas em erros READONLY
      return true;
    }
    return false;
  },
};

/**
 * TTLs padrão para diferentes tipos de cache (em segundos)
 */
export const cacheTTL = {
  // Dados de CNPJ (7 dias)
  cnpj: 7 * 24 * 60 * 60,

  // Dados de clientes (1 hora)
  clientes: 60 * 60,

  // Relatórios (30 minutos)
  relatorios: 30 * 60,

  // Estatísticas (15 minutos)
  estatisticas: 15 * 60,

  // Sessões de usuário (24 horas)
  sessoes: 24 * 60 * 60,

  // Dados de integrações (5 minutos)
  integracoes: 5 * 60,

  // Dados de produtos (1 hora)
  produtos: 60 * 60,

  // Dados de pedidos (30 minutos)
  pedidos: 30 * 60,

  // Dados de notas fiscais (1 hora)
  notasFiscais: 60 * 60,

  // Dados de APIs externas (10 minutos)
  apisExternas: 10 * 60,
};

/**
 * Prefixos de chaves para organização do cache
 */
export const cacheKeys = {
  cnpj: (cnpj: string) => `cnpj:${cnpj}`,
  cliente: (id: string) => `cliente:${id}`,
  clientes: (tenantId: string) => `clientes:tenant:${tenantId}`,
  relatorio: (tipo: string, tenantId: string) => `relatorio:${tipo}:${tenantId}`,
  estatisticas: (tenantId: string) => `stats:${tenantId}`,
  sessao: (sessionId: string) => `session:${sessionId}`,
  integracao: (tipo: string, tenantId: string) => `integracao:${tipo}:${tenantId}`,
  produto: (id: string) => `produto:${id}`,
  pedido: (id: string) => `pedido:${id}`,
  notaFiscal: (id: string) => `nf:${id}`,
  apiExterna: (endpoint: string) => `api:${endpoint}`,
};

export default {
  redisConfig,
  cacheTTL,
  cacheKeys,
};
