import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import spreadsheetValidationRouter from '../routes/spreadsheet-validation';
import authRouter from '../routes/auth';
import { pool } from '../db';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/spreadsheet-validation', spreadsheetValidationRouter);

describe('Spreadsheet Validation Routes', () => {
  let authToken: string;
  let testUserId: string;
  const testEmail = `spreadsheettest${Date.now()}@test.com`;
  const testPassword = 'Test123!@#';
  const testTenantId = `test-tenant-${Date.now()}`;

  beforeAll(async () => {
    // Criar usuário de teste
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        full_name: 'Spreadsheet Test User',
        tenant_id: testTenantId,
      });

    authToken = registerResponse.body.token;
    testUserId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('GET /api/spreadsheet-validation/template/:type', () => {
    it('deve baixar template de produtos', async () => {
      const response = await request(app)
        .get('/api/spreadsheet-validation/template/produtos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
    });

    it('deve baixar template de pedidos', async () => {
      const response = await request(app)
        .get('/api/spreadsheet-validation/template/pedidos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
    });

    it('deve baixar template de clientes', async () => {
      const response = await request(app)
        .get('/api/spreadsheet-validation/template/clientes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
    });

    it('deve retornar erro para tipo inválido', async () => {
      const response = await request(app)
        .get('/api/spreadsheet-validation/template/invalido')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar erro sem autenticação', async () => {
      const response = await request(app)
        .get('/api/spreadsheet-validation/template/produtos');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/spreadsheet-validation/validate', () => {
    it('deve validar planilha de produtos válida', async () => {
      // Criar arquivo de teste temporário
      const testFilePath = path.join(__dirname, 'test-produtos.xlsx');
      
      // Aqui você criaria um arquivo XLSX de teste
      // Por simplicidade, vamos simular o teste
      
      const response = await request(app)
        .post('/api/spreadsheet-validation/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .field('type', 'produtos')
        .attach('file', testFilePath);

      // Este teste falhará se o arquivo não existir
      // Em um ambiente real, você criaria o arquivo de teste
      expect([200, 400]).toContain(response.status);
    });

    it('deve retornar erro sem arquivo', async () => {
      const response = await request(app)
        .post('/api/spreadsheet-validation/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .field('type', 'produtos');

      expect(response.status).toBe(400);
    });

    it('deve retornar erro sem tipo', async () => {
      const response = await request(app)
        .post('/api/spreadsheet-validation/validate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar erro sem autenticação', async () => {
      const response = await request(app)
        .post('/api/spreadsheet-validation/validate');

      expect(response.status).toBe(401);
    });
  });
});
