import { Router } from 'express';
import { db } from '../db';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * ENDPOINT DE EMERGÊNCIA - RESETAR SENHA
 * 
 * Use apenas para resolver problemas críticos de login
 * Remover após resolver o problema
 * 
 * POST /api/emergency/reset-password
 * Body: { email: string, newPassword: string, secretKey: string }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, secretKey } = req.body;

    // Chave secreta para evitar uso indevido
    // Altere para uma chave segura em produção
    const EMERGENCY_SECRET = process.env.EMERGENCY_SECRET || 'MARKTHUB_EMERGENCY_2024';

    if (secretKey !== EMERGENCY_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Chave secreta inválida'
      });
    }

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email e nova senha são obrigatórios'
      });
    }

    // Validar formato de senha
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter no mínimo 8 caracteres'
      });
    }

    // Verificar se usuário existe
    const userCheck = await db.query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const user = userCheck.rows[0];

    // Gerar hash da nova senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha no banco
    const updateResult = await db.query(
      `UPDATE users 
       SET password_hash = $1, 
           password = NULL,
           is_active = true,
           updated_at = NOW()
       WHERE email = $2
       RETURNING id, username, email, is_active`,
      [passwordHash, email]
    );

    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar senha'
      });
    }

    const updatedUser = updateResult.rows[0];

    // Log da operação (para auditoria)
    console.log(`[EMERGENCY RESET] Senha resetada para usuário: ${email} (ID: ${user.id})`);

    return res.json({
      success: true,
      message: 'Senha resetada com sucesso',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isActive: updatedUser.is_active
      },
      passwordHash: passwordHash // Retornar hash para referência
    });

  } catch (error) {
    console.error('Erro no reset de emergência:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao resetar senha',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * ENDPOINT DE DIAGNÓSTICO
 * 
 * GET /api/emergency/check-user/:email
 * Verifica status do usuário sem expor dados sensíveis
 */
router.get('/check-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { secretKey } = req.query;

    const EMERGENCY_SECRET = process.env.EMERGENCY_SECRET || 'MARKTHUB_EMERGENCY_2024';

    if (secretKey !== EMERGENCY_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Chave secreta inválida'
      });
    }

    const result = await db.query(
      `SELECT 
        id,
        username,
        email,
        tenant_id,
        role,
        is_active,
        CASE 
          WHEN password_hash IS NOT NULL THEN 'password_hash'
          WHEN password IS NOT NULL THEN 'password'
          ELSE 'none'
        END as password_field,
        created_at,
        updated_at
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const user = result.rows[0];

    // Buscar informações do tenant
    const tenantResult = await db.query(
      'SELECT id, name FROM tenants WHERE id = $1',
      [user.tenant_id]
    );

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tenantId: user.tenant_id,
        tenantName: tenantResult.rows[0]?.name || 'N/A',
        role: user.role,
        isActive: user.is_active,
        passwordField: user.password_field,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
