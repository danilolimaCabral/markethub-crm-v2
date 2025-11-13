import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Middleware de validação usando Zod
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: errors
        });
      }

      return res.status(500).json({
        error: 'Erro ao validar dados',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Validação de query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          error: 'Parâmetros de query inválidos',
          code: 'VALIDATION_ERROR',
          details: errors
        });
      }

      return res.status(500).json({
        error: 'Erro ao validar parâmetros',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Validação de parâmetros de rota
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          error: 'Parâmetros de rota inválidos',
          code: 'VALIDATION_ERROR',
          details: errors
        });
      }

      return res.status(500).json({
        error: 'Erro ao validar parâmetros',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Schemas de validação comuns
 */
export const commonSchemas = {
  uuid: z.string().uuid('ID deve ser um UUID válido'),
  email: z.string().email('Email inválido'),
  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
};
