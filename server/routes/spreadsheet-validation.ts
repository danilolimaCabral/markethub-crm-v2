/**
 * Rotas de Validação de Planilhas
 * 
 * Endpoints para upload, validação e importação de planilhas
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { SpreadsheetValidationService } from '../services/SpreadsheetValidationService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configurar multer para upload de arquivos em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas arquivos Excel e CSV
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use .xlsx, .xls ou .csv'));
    }
  },
});

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

/**
 * POST /api/spreadsheet-validation/validate
 * Valida planilha sem importar dados
 */
router.post('/validate', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum arquivo foi enviado',
      });
    }

    const { entityType } = req.body;

    if (!entityType || !['produtos', 'pedidos', 'clientes'].includes(entityType)) {
      return res.status(400).json({
        error: 'Tipo de entidade inválido. Use: produtos, pedidos ou clientes',
      });
    }

    console.log(`📊 Validando planilha: ${req.file.originalname} (${entityType})`);

    const result = await SpreadsheetValidationService.processSpreadsheet(
      req.file.buffer,
      req.file.originalname,
      entityType as any,
      {
        validateOnly: true,
        tenant_id: req.user?.tenant_id,
        user_id: req.user?.id,
      }
    );

    console.log(`✅ Validação concluída: ${result.validRows}/${result.totalRows} linhas válidas`);

    return res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('❌ Erro ao validar planilha:', error);
    return res.status(500).json({
      error: 'Erro ao processar planilha',
      message: error.message,
    });
  }
});

/**
 * GET /api/spreadsheet-validation/example/:entityType
 * Baixa planilha de exemplo
 */
router.get('/example/:entityType', (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;

    if (!['produtos', 'pedidos', 'clientes'].includes(entityType)) {
      return res.status(400).json({
        error: 'Tipo de entidade inválido. Use: produtos, pedidos ou clientes',
      });
    }

    console.log(`📥 Gerando planilha de exemplo: ${entityType}`);

    const buffer = SpreadsheetValidationService.generateExampleSpreadsheet(
      entityType as any
    );

    const fileName = `exemplo_${entityType}_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('❌ Erro ao gerar planilha de exemplo:', error);
    return res.status(500).json({
      error: 'Erro ao gerar planilha de exemplo',
      message: error.message,
    });
  }
});

/**
 * GET /api/spreadsheet-validation/templates
 * Lista templates disponíveis
 */
router.get('/templates', (req: Request, res: Response) => {
  return res.json({
    success: true,
    templates: [
      {
        entityType: 'produtos',
        name: 'Produtos',
        description: 'Importar produtos com preços, estoque e categorias',
        requiredFields: ['nome', 'sku', 'preco_venda'],
        optionalFields: ['categoria', 'preco_custo', 'estoque_atual', 'estoque_minimo', 'status', 'marketplace', 'descricao', 'imagem_url'],
        exampleUrl: '/api/spreadsheet-validation/example/produtos',
      },
      {
        entityType: 'pedidos',
        name: 'Pedidos',
        description: 'Importar pedidos de marketplaces',
        requiredFields: ['numero_pedido', 'cliente_nome', 'valor_total'],
        optionalFields: ['marketplace', 'status', 'data_pedido', 'rastreio', 'observacoes'],
        exampleUrl: '/api/spreadsheet-validation/example/pedidos',
      },
      {
        entityType: 'clientes',
        name: 'Clientes',
        description: 'Importar cadastro de clientes',
        requiredFields: ['nome'],
        optionalFields: ['email', 'telefone', 'cpf_cnpj', 'endereco', 'cidade', 'estado', 'cep'],
        exampleUrl: '/api/spreadsheet-validation/example/clientes',
      },
    ],
  });
});

/**
 * POST /api/spreadsheet-validation/import
 * Importa dados validados para o banco de dados
 */
router.post('/import', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum arquivo foi enviado',
      });
    }

    const { entityType } = req.body;

    if (!entityType || !['produtos', 'pedidos', 'clientes'].includes(entityType)) {
      return res.status(400).json({
        error: 'Tipo de entidade inválido',
      });
    }

    console.log(`📥 Importando planilha: ${req.file.originalname} (${entityType})`);

    // Primeiro, validar
    const validationResult = await SpreadsheetValidationService.processSpreadsheet(
      req.file.buffer,
      req.file.originalname,
      entityType as any,
      {
        validateOnly: false,
        tenant_id: req.user?.tenant_id,
        user_id: req.user?.id,
      }
    );

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Planilha contém erros. Corrija os erros antes de importar.',
        result: validationResult,
      });
    }

    // TODO: Implementar importação real no banco de dados
    // Por enquanto, apenas retorna os dados validados
    console.log(`⚠️  Importação não implementada ainda. ${validationResult.validRows} linhas prontas para importar.`);

    return res.json({
      success: true,
      message: 'Validação concluída com sucesso. Importação será implementada em breve.',
      result: validationResult,
    });
  } catch (error: any) {
    console.error('❌ Erro ao importar planilha:', error);
    return res.status(500).json({
      error: 'Erro ao importar planilha',
      message: error.message,
    });
  }
});

export default router;
