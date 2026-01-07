import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../routes/auth';
import { pool } from '../db';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Authentication Routes', () => {
  let testUserId: string;
  const testEmail = `test${Date.now()}@test.com`;
  const testPassword = 'Test123!@#';

  afterAll(async () => {
    // Limpar dados de teste
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          full_name: 'Test User',
          tenant_id: 'test-tenant',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);
      
      testUserId = response.body.user.id;
    });

    it('deve retornar erro ao tentar registrar com email duplicado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          full_name: 'Test User 2',
          tenant_id: 'test-tenant',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro ao tentar registrar sem email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: testPassword,
          full_name: 'Test User',
          tenant_id: 'test-tenant',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);
    });

    it('deve retornar erro com senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro com email não existente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testPassword,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });
      
      authToken = loginResponse.body.token;
    });

    it('deve retornar dados do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);
    });

    it('deve retornar erro sem token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('deve retornar erro com token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
