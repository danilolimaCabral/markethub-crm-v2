import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import SpreadsheetImportService from '../services/SpreadsheetImportService';

const router = express.Router();

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/spreadsheets');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel (.xlsx, .xls) e CSV são permitidos'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const importService = new SpreadsheetImportService();

/**
 * POST /api/spreadsheet-import/produtos
 * Importar produtos de planilha
 */
router.post('/produtos', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const tenantId = req.user!.tenant_id!;
    const result = await importService.importProdutos(req.file.path, tenantId);

    // Remover arquivo após processamento
    fs.unlinkSync(req.file.path);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao importar produtos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/spreadsheet-import/vendas-ml
 * Importar vendas do Mercado Livre de planilha
 */
router.post('/vendas-ml', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const tenantId = req.user!.tenant_id!;
    const result = await importService.importVendasML(req.file.path, tenantId);

    // Remover arquivo após processamento
    fs.unlinkSync(req.file.path);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao importar vendas ML:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/spreadsheet-import/analise-financeira
 * Importar análise financeira de planilha
 */
router.post('/analise-financeira', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const tenantId = req.user!.tenant_id!;
    const result = await importService.importAnaliseFinanceira(req.file.path, tenantId);

    // Remover arquivo após processamento
    fs.unlinkSync(req.file.path);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao importar análise financeira:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/spreadsheet-import/clientes
 * Importar clientes de planilha
 */
router.post('/clientes', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const tenantId = req.user!.tenant_id!;
    const result = await importService.importClientes(req.file.path, tenantId);

    // Remover arquivo após processamento
    fs.unlinkSync(req.file.path);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao importar clientes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/spreadsheet-import/templates/:tipo
 * Baixar template de planilha
 */
router.get('/templates/:tipo', authenticateToken, (req: Request, res: Response) => {
  const { tipo } = req.params;
  
  const templates: Record<string, string> = {
    'produtos': path.join(__dirname, '../../templates/template_produtos.xlsx'),
    'vendas-ml': path.join(__dirname, '../../templates/template_vendas_ml.xlsx'),
    'analise-financeira': path.join(__dirname, '../../templates/template_analise_financeira.xlsx'),
    'clientes': path.join(__dirname, '../../templates/template_clientes.xlsx')
  };

  const templatePath = templates[tipo];

  if (!templatePath || !fs.existsSync(templatePath)) {
    return res.status(404).json({ error: 'Template não encontrado' });
  }

  res.download(templatePath);
});

export default router;
