import { Request, Response, NextFunction } from 'express';
import { SystemLogModel } from '../models/SystemLog';
import { SystemMetricModel } from '../models/SystemMetric';

// Middleware para registrar todas as requisições
export const requestLogger = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capturar informações da requisição
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress,
    user_agent: req.get('user-agent'),
    tenant_id: (req as any).tenant_id, // Se houver tenant no request
    user_id: (req as any).user_id // Se houver user no request
  };

  // Interceptar o response para registrar quando terminar
  const originalSend = res.send;
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;

    // Registrar métrica de performance
    SystemMetricModel.record({
      metric_type: 'request',
      metric_name: `${req.method} ${req.originalUrl}`,
      metric_value: responseTime,
      tenant_id: requestInfo.tenant_id,
      metadata: {
        status_code: res.statusCode,
        method: req.method,
        url: req.originalUrl
      }
    }).catch(err => console.error('Erro ao registrar métrica:', err));

    // Se for erro (status >= 400), registrar log
    if (res.statusCode >= 400) {
      const level = res.statusCode >= 500 ? 'error' : 'warning';
      
      SystemLogModel.create({
        tenant_id: requestInfo.tenant_id,
        level,
        category: 'http',
        message: `${req.method} ${req.originalUrl} - ${res.statusCode}`,
        user_id: requestInfo.user_id,
        ip_address: requestInfo.ip,
        user_agent: requestInfo.user_agent,
        request_url: req.originalUrl,
        request_method: req.method,
        metadata: {
          status_code: res.statusCode,
          response_time: responseTime
        }
      }).catch(err => console.error('Erro ao registrar log:', err));
    }

    return originalSend.call(this, data);
  };

  next();
};

// Middleware para capturar erros não tratados
export const errorLogger = async (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro capturado:', err);

  // Registrar erro no banco
  try {
    await SystemLogModel.create({
      tenant_id: (req as any).tenant_id,
      level: 'error',
      category: 'application',
      message: err.message || 'Erro desconhecido',
      stack_trace: err.stack,
      user_id: (req as any).user_id,
      ip_address: req.ip || req.socket.remoteAddress,
      user_agent: req.get('user-agent'),
      request_url: req.originalUrl,
      request_method: req.method,
      metadata: {
        error_name: err.name,
        error_code: err.code
      }
    });
  } catch (logError) {
    console.error('Erro ao registrar log de erro:', logError);
  }

  // Enviar resposta de erro
  res.status(err.statusCode || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Função helper para registrar logs manualmente
export const logInfo = async (message: string, data?: any) => {
  try {
    await SystemLogModel.create({
      level: 'info',
      category: 'application',
      message,
      metadata: data
    });
  } catch (err) {
    console.error('Erro ao registrar log:', err);
  }
};

export const logWarning = async (message: string, data?: any) => {
  try {
    await SystemLogModel.create({
      level: 'warning',
      category: 'application',
      message,
      metadata: data
    });
  } catch (err) {
    console.error('Erro ao registrar log:', err);
  }
};

export const logError = async (message: string, error?: any, data?: any) => {
  try {
    await SystemLogModel.create({
      level: 'error',
      category: 'application',
      message,
      stack_trace: error?.stack,
      metadata: {
        ...data,
        error_name: error?.name,
        error_message: error?.message
      }
    });
  } catch (err) {
    console.error('Erro ao registrar log:', err);
  }
};

export const logCritical = async (message: string, error?: any, data?: any) => {
  try {
    await SystemLogModel.create({
      level: 'critical',
      category: 'application',
      message,
      stack_trace: error?.stack,
      metadata: {
        ...data,
        error_name: error?.name,
        error_message: error?.message
      }
    });
  } catch (err) {
    console.error('Erro ao registrar log:', err);
  }
};
