import { Router } from 'express';
import { consultarCNPJ, validarCNPJ, formatarCNPJ } from '../services/cnpjService';

const router = Router();

/**
 * GET /api/cnpj/:cnpj
 * Consulta dados de uma empresa pelo CNPJ
 * 
 * @param cnpj CNPJ da empresa (com ou sem formatação)
 * @returns Dados da empresa ou erro
 * 
 * @example
 * GET /api/cnpj/00000000000191
 * GET /api/cnpj/00.000.000/0001-91
 */
router.get('/:cnpj', async (req, res) => {
  try {
    const { cnpj } = req.params;
    
    // Remove formatação
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    // Valida formato básico
    if (cnpjLimpo.length !== 14) {
      return res.status(400).json({
        success: false,
        error: 'CNPJ deve conter 14 dígitos'
      });
    }
    
    // Valida CNPJ com algoritmo da Receita Federal
    if (!validarCNPJ(cnpjLimpo)) {
      return res.status(400).json({
        success: false,
        error: 'CNPJ inválido'
      });
    }
    
    // Consulta dados do CNPJ
    const resultado = await consultarCNPJ(cnpjLimpo);
    
    if (!resultado.success) {
      return res.status(404).json(resultado);
    }
    
    return res.json(resultado);
    
  } catch (error) {
    console.error('Erro na rota de consulta CNPJ:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao consultar CNPJ'
    });
  }
});

/**
 * POST /api/cnpj/validar
 * Valida se um CNPJ é válido (sem consultar a Receita)
 * 
 * @body cnpj CNPJ para validar
 * @returns { valid: boolean, formatted: string }
 * 
 * @example
 * POST /api/cnpj/validar
 * { "cnpj": "00000000000191" }
 */
router.post('/validar', async (req, res) => {
  try {
    const { cnpj } = req.body;
    
    if (!cnpj) {
      return res.status(400).json({
        valid: false,
        error: 'CNPJ não fornecido'
      });
    }
    
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    const isValid = validarCNPJ(cnpjLimpo);
    
    return res.json({
      valid: isValid,
      formatted: isValid ? formatarCNPJ(cnpjLimpo) : null,
      message: isValid ? 'CNPJ válido' : 'CNPJ inválido'
    });
    
  } catch (error) {
    console.error('Erro na validação de CNPJ:', error);
    return res.status(500).json({
      valid: false,
      error: 'Erro interno ao validar CNPJ'
    });
  }
});

export default router;
