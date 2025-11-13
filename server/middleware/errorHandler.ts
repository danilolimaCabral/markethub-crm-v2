import { Request, Response, NextFunction } from 'express';
import { logError, logCritical } from './logger';
import { QueryResult } from 'pg';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Classe de erro customizada
 */
export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handler centralizado de erros
 */
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Se já foi enviada resposta, passar para o próximo handler
  if (res.headersSent) {
    return next(err);
  }

  // Erro customizado
  if (err instanceof CustomError) {
    logError(err.message, err, { 
      code: err.code, 
      details: err.details,
      url: req.originalUrl,
      method: req.method
    });

    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Erro de validação do PostgreSQL
  if (err.name === 'ValidationError' || (err as any).code === '23505') {
    const message = (err as any).code === '23505' 
      ? 'Registro duplicado' 
      : err.message;

    return res.status(400).json({
      error: message,
      code: 'VALIDATION_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }

  // Erro de foreign key
  if ((err as any).code === '23503') {
    return res.status(400).json({
      error: 'Registro referenciado não existe',
      code: 'FOREIGN_KEY_ERROR'
    });
  }

  // Erro de query do PostgreSQL
  if ((err as any).code && (err as any).code.startsWith('23')) {
    logError('Erro de banco de dados', err, {
      code: (err as any).code,
      url: req.originalUrl,
      method: req.method
    });

    return res.status(400).json({
      error: 'Erro ao processar dados',
      code: 'DATABASE_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        message: err.message 
      })
    });
  }

  // Erro de conexão com banco
  if ((err as any).code === 'ECONNREFUSED' || (err as any).code === 'ENOTFOUND') {
    logCritical('Erro de conexão com banco de dados', err, {
      url: req.originalUrl,
      method: req.method
    });

    return res.status(503).json({
      error: 'Serviço temporariamente indisponível',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  // Erro genérico
  logError('Erro não tratado', err, {
    url: req.originalUrl,
    method: req.method,
    name: err.name
  });

  return res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      name: err.name
    })
  });
};

/**
 * Wrapper para async handlers (evita try/catch repetitivo)
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Helper para criar erros customizados
 */
export const createError = (
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): CustomError => {
  return new CustomError(message, statusCode, code, details);
};

/**
 * Erros comuns pré-definidos
 */
export const errors = {
  notFound: (resource: string = 'Recurso') => 
    createError(`${resource} não encontrado`, 404, 'NOT_FOUND'),
  
  unauthorized: (message: string = 'Não autorizado') =>
    createError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message: string = 'Acesso negado') =>
    createError(message, 403, 'FORBIDDEN'),
  
  badRequest: (message: string = 'Requisição inválida') =>
    createError(message, 400, 'BAD_REQUEST'),
  
  conflict: (message: string = 'Conflito de dados') =>
    createError(message, 409, 'CONFLICT'),
  
  validation: (message: string = 'Dados inválidos', details?: any) =>
    createError(message, 400, 'VALIDATION_ERROR', details)
};
