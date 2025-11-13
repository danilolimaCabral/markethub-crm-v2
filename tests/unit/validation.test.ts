import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test validation schemas
describe('Validation Schemas', () => {
  describe('Email Validation', () => {
    const emailSchema = z.string().email();

    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.com',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'test@',
        'test @example.com',
        'test..double@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('UUID Validation', () => {
    const uuidSchema = z.string().uuid();

    it('should validate correct UUID formats', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
      ];

      validUUIDs.forEach(uuid => {
        expect(() => uuidSchema.parse(uuid)).not.toThrow();
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        '123',
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
      ];

      invalidUUIDs.forEach(uuid => {
        expect(() => uuidSchema.parse(uuid)).toThrow();
      });
    });
  });

  describe('Login Schema Validation', () => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    it('should validate correct login data', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      expect(() => loginSchema.parse(validLogin)).not.toThrow();
    });

    it('should reject invalid email in login', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'Test123!@#',
      };

      expect(() => loginSchema.parse(invalidLogin)).toThrow();
    });

    it('should reject short password in login', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: '12345',
      };

      expect(() => loginSchema.parse(invalidLogin)).toThrow();
    });

    it('should reject missing fields', () => {
      const missingEmail = { password: 'Test123!@#' };
      const missingPassword = { email: 'test@example.com' };

      expect(() => loginSchema.parse(missingEmail)).toThrow();
      expect(() => loginSchema.parse(missingPassword)).toThrow();
    });
  });

  describe('User Registration Schema Validation', () => {
    const registerSchema = z.object({
      email: z.string().email(),
      username: z.string().min(3).max(30),
      password: z.string().min(6),
      tenant_id: z.string().uuid().optional(),
    });

    it('should validate correct registration data', () => {
      const validRegistration = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123!@#',
        tenant_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      expect(() => registerSchema.parse(validRegistration)).not.toThrow();
    });

    it('should validate registration without optional tenant_id', () => {
      const validRegistration = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123!@#',
      };

      expect(() => registerSchema.parse(validRegistration)).not.toThrow();
    });

    it('should reject short username', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'ab',
        password: 'Test123!@#',
      };

      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should reject long username', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'a'.repeat(31),
        password: 'Test123!@#',
      };

      expect(() => registerSchema.parse(invalidData)).toThrow();
    });
  });

  describe('Pagination Schema Validation', () => {
    const paginationSchema = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      sortBy: z.string().optional(),
      order: z.enum(['asc', 'desc']).default('asc'),
    });

    it('should validate correct pagination params', () => {
      const validPagination = {
        page: 1,
        limit: 20,
        sortBy: 'created_at',
        order: 'desc' as const,
      };

      expect(() => paginationSchema.parse(validPagination)).not.toThrow();
    });

    it('should apply defaults for missing fields', () => {
      const result = paginationSchema.parse({});
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.order).toBe('asc');
    });

    it('should reject negative page number', () => {
      expect(() => paginationSchema.parse({ page: -1 })).toThrow();
    });

    it('should reject limit over 100', () => {
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
    });

    it('should coerce string numbers to integers', () => {
      const result = paginationSchema.parse({ page: '5', limit: '25' });
      
      expect(result.page).toBe(5);
      expect(result.limit).toBe(25);
      expect(typeof result.page).toBe('number');
      expect(typeof result.limit).toBe('number');
    });
  });

  describe('Product Schema Validation', () => {
    const productSchema = z.object({
      nome: z.string().min(1).max(255),
      descricao: z.string().optional(),
      preco_venda: z.number().positive(),
      preco_custo: z.number().positive().optional(),
      estoque_atual: z.number().int().min(0).default(0),
      sku: z.string().optional(),
      categoria: z.string().optional(),
    });

    it('should validate correct product data', () => {
      const validProduct = {
        nome: 'Produto Teste',
        descricao: 'Descrição do produto',
        preco_venda: 99.99,
        preco_custo: 50.00,
        estoque_atual: 100,
        sku: 'PROD-001',
        categoria: 'Eletrônicos',
      };

      expect(() => productSchema.parse(validProduct)).not.toThrow();
    });

    it('should apply defaults', () => {
      const minimalProduct = {
        nome: 'Produto Mínimo',
        preco_venda: 10.00,
      };

      const result = productSchema.parse(minimalProduct);
      expect(result.estoque_atual).toBe(0);
    });

    it('should reject empty product name', () => {
      const invalidProduct = {
        nome: '',
        preco_venda: 10.00,
      };

      expect(() => productSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject negative price', () => {
      const invalidProduct = {
        nome: 'Produto',
        preco_venda: -10.00,
      };

      expect(() => productSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject negative stock', () => {
      const invalidProduct = {
        nome: 'Produto',
        preco_venda: 10.00,
        estoque_atual: -5,
      };

      expect(() => productSchema.parse(invalidProduct)).toThrow();
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should detect common SQL injection patterns', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1; DELETE FROM products",
        "' UNION SELECT * FROM users--",
      ];

      const sqlInjectionPattern = /('|--|;|UNION|SELECT|DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC)/i;

      maliciousInputs.forEach(input => {
        expect(sqlInjectionPattern.test(input)).toBe(true);
      });
    });

    it('should allow safe inputs', () => {
      const safeInputs = [
        'regular text',
        'user@example.com',
        'Product Name 123',
        'Description with normal punctuation.',
      ];

      const sqlInjectionPattern = /('|--|;|UNION|SELECT|DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC)/i;

      safeInputs.forEach(input => {
        expect(sqlInjectionPattern.test(input)).toBe(false);
      });
    });
  });
});
