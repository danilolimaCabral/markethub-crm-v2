import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import productsRouter from '../routes/products';
import authRouter from '../routes/auth';
import { pool } from '../db';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);

describe('Products Routes', () => {
  let authToken: string;
  let testUserId: string;
  let testProductId: string;
  const testEmail = `producttest${Date.now()}@test.com`;
  const testPassword = 'Test123!@#';
  const testTenantId = `test-tenant-${Date.now()}`;

  beforeAll(async () => {
    // Criar usuário de teste
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        full_name: 'Product Test User',
        tenant_id: testTenantId,
      });

    authToken = registerResponse.body.token;
    testUserId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testProductId) {
      await pool.query('DELETE FROM products WHERE id = $1', [testProductId]);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('POST /api/products', () => {
    it('deve criar um novo produto com sucesso', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Produto Teste',
          sku: `TEST-SKU-${Date.now()}`,
          preco_venda: 99.90,
          preco_custo: 50.00,
          estoque_atual: 100,
          estoque_minimo: 10,
          categoria: 'Teste',
          status: 'ativo',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('Produto Teste');
      expect(response.body.preco_venda).toBe(99.90);
      
      testProductId = response.body.id;
    });

    it('deve retornar erro ao criar produto sem autenticação', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          nome: 'Produto Sem Auth',
          sku: 'TEST-NO-AUTH',
          preco_venda: 99.90,
        });

      expect(response.status).toBe(401);
    });

    it('deve retornar erro ao criar produto sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Produto Incompleto',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/products', () => {
    it('deve listar produtos do tenant', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve retornar erro ao listar produtos sem autenticação', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/products/:id', () => {
    it('deve retornar um produto específico', async () => {
      const response = await request(app)
        .get(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testProductId);
      expect(response.body.nome).toBe('Produto Teste');
    });

    it('deve retornar 404 para produto inexistente', async () => {
      const response = await request(app)
        .get('/api/products/99999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('deve atualizar um produto existente', async () => {
      const response = await request(app)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Produto Teste Atualizado',
          preco_venda: 149.90,
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Produto Teste Atualizado');
      expect(response.body.preco_venda).toBe(149.90);
    });

    it('deve retornar erro ao atualizar produto sem autenticação', async () => {
      const response = await request(app)
        .put(`/api/products/${testProductId}`)
        .send({
          nome: 'Tentativa de Atualização',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('deve deletar um produto (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro ao deletar produto sem autenticação', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProductId}`);

      expect(response.status).toBe(401);
    });
  });
});
