import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../server/middleware/auth';

// Mock do banco de dados
vi.mock('../../../server/db', () => ({
  query: vi.fn()
}));

describe('Middleware de Autenticação', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    nextFunction = vi.fn();
  });

  it('deve retornar 401 se token não for fornecido', async () => {
    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Token não fornecido',
      code: 'NO_TOKEN'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se token for inválido', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token'
    };

    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
