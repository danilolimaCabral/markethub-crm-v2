import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Middleware genérico para validação de dados usando Zod
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida o body da requisição
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({
        error: 'Erro na validação dos dados',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Middleware para validar query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parâmetros de consulta inválidos',
          code: 'QUERY_VALIDATION_ERROR',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({
        error: 'Erro na validação dos parâmetros',
        code: 'QUERY_VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Middleware para validar params da URL
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parâmetros da URL inválidos',
          code: 'PARAMS_VALIDATION_ERROR',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({
        error: 'Erro na validação dos parâmetros',
        code: 'PARAMS_VALIDATION_ERROR'
      });
    }
  };
};

// ========================================
// SCHEMAS DE VALIDAÇÃO COMUNS
// ========================================

/**
 * Schema para validar UUID
 */
export const uuidSchema = z.string().uuid({ message: 'UUID inválido' });

/**
 * Schema para validar email
 */
export const emailSchema = z.string().email({ message: 'Email inválido' });

/**
 * Schema para paginação
 */
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Schema para filtros de data
 */
export const dateFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// ========================================
// SCHEMAS ESPECÍFICOS DO SISTEMA
// ========================================

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Usuário ou email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

/**
 * Schema para registro de usuário
 */
export const registerUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres').optional(),
  tenant_id: z.string().uuid().optional()
});

/**
 * Schema para atualizar usuário
 */
export const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  full_name: z.string().min(3).optional(),
  username: z.string().min(3).optional(),
  role: z.enum(['admin', 'user', 'viewer']).optional(),
  is_active: z.boolean().optional()
});

/**
 * Schema para produto
 */
export const productSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  cost_price: z.number().min(0, 'Preço de custo deve ser positivo'),
  sale_price: z.number().min(0, 'Preço de venda deve ser positivo'),
  stock_quantity: z.number().int().min(0, 'Quantidade em estoque deve ser positiva'),
  min_stock: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    width: z.number().min(0),
    height: z.number().min(0),
    depth: z.number().min(0)
  }).optional(),
  images: z.array(z.string().url()).optional(),
  is_active: z.boolean().optional()
});

/**
 * Schema para atualizar produto
 */
export const updateProductSchema = productSchema.partial();

/**
 * Schema para cliente
 */
export const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  document: z.string().optional(),
  type: z.enum(['pessoa_fisica', 'pessoa_juridica']),
  addresses: z.array(z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
    zipcode: z.string(),
    country: z.string().default('Brasil')
  })).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

/**
 * Schema para pedido
 */
export const orderSchema = z.object({
  customer_id: z.string().uuid('ID de cliente inválido'),
  marketplace: z.string().optional(),
  marketplace_order_id: z.string().optional(),
  payment_method: z.string().optional(),
  shipping_cost: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  shipping_address: z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
    zipcode: z.string(),
    country: z.string().default('Brasil')
  }),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0)
  })).min(1, 'Pedido deve ter pelo menos um item'),
  notes: z.string().optional()
});

/**
 * Schema para atualizar status do pedido
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().optional(),
  tracking_code: z.string().optional()
});

/**
 * Schema para transação financeira
 */
export const financialTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  order_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  payment_method: z.string().optional(),
  due_date: z.string().datetime().optional(),
  notes: z.string().optional()
});

/**
 * Schema para integração de marketplace
 */
export const marketplaceIntegrationSchema = z.object({
  marketplace: z.string().min(1, 'Nome do marketplace é obrigatório'),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  is_active: z.boolean().optional(),
  sync_frequency: z.number().int().min(5).optional(),
  config: z.record(z.string(), z.any()).optional()
});

/**
 * Middleware para sanitizar dados (remover espaços, etc)
 */
export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj: any) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove espaços extras
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Middleware para prevenir SQL Injection
 */
export const preventSqlInjection = (req: Request, res: Response, next: NextFunction) => {
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      // Padrões suspeitos de SQL injection
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /(--|;|\/\*|\*\/)/g,
        /(\bOR\b.*=.*)/gi,
        /(\bAND\b.*=.*)/gi,
        /(UNION.*SELECT)/gi
      ];

      return sqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      if (checkValue(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      error: 'Entrada inválida detectada',
      code: 'INVALID_INPUT'
    });
  }

  next();
};

/**
 * Middleware para limitar tamanho de upload
 */
export const limitFileSize = (maxSizeInMB: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({
          error: `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`,
          code: 'FILE_TOO_LARGE'
        });
      }
    }
    next();
  };
};
