import { Request, Response } from 'express';
import { query } from '../db';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  version: string;
}

/**
 * Health check completo do sistema
 */
export const healthCheck = async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: 'down'
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      }
    },
    version: process.env.npm_package_version || '1.0.0'
  };

  // Verificar banco de dados
  try {
    const dbStart = Date.now();
    await query('SELECT 1 as health');
    const dbTime = Date.now() - dbStart;
    
    health.services.database = {
      status: 'up',
      responseTime: dbTime
    };
  } catch (error: any) {
    health.status = 'unhealthy';
    health.services.database = {
      status: 'down',
      error: error.message
    };
  }

  // Verificar memória
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memPercentage = (usedMem / totalMem) * 100;

  health.services.memory = {
    used: Math.round(usedMem / 1024 / 1024), // MB
    total: Math.round(totalMem / 1024 / 1024), // MB
    percentage: Math.round(memPercentage * 100) / 100
  };

  // Se memória > 90%, marcar como degraded
  if (memPercentage > 90) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
};

/**
 * Health check simples (apenas status)
 */
export const simpleHealthCheck = (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};
