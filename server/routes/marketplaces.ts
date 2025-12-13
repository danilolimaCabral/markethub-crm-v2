/**
 * Rotas de API para serviços de marketplaces e pagamento
 * Shopee, Amazon, Magalu e PagBank
 */

import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import ShopeeService from '../services/shopee';
import AmazonService from '../services/amazon';
import MagaluService from '../services/magalu';
import PagBankService from '../services/pagbank';

const router = Router();

// ==================== SHOPEE ====================

router.get('/shopee/auth-url', authenticateToken, requirePermission('integracoes', 'edit'), async (req, res) => {
  try {
    const { redirectUrl } = req.query;

    const shopeeService = new ShopeeService({
      partnerId: parseInt(process.env.SHOPEE_PARTNER_ID || '0'),
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '',
      shopId: parseInt(process.env.SHOPEE_SHOP_ID || '0'),
    }, process.env.NODE_ENV !== 'production');

    const authUrl = shopeeService.getAuthUrl(redirectUrl as string);
    res.json({ authUrl });
  } catch (error: any) {
    console.error('Erro ao gerar URL de autorização Shopee:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/shopee/testar', authenticateToken, requirePermission('integracoes', 'view'), async (req, res) => {
  try {
    const shopeeService = new ShopeeService({
      partnerId: parseInt(process.env.SHOPEE_PARTNER_ID || '0'),
      partnerKey: process.env.SHOPEE_PARTNER_KEY || '',
      shopId: parseInt(process.env.SHOPEE_SHOP_ID || '0'),
      accessToken: process.env.SHOPEE_ACCESS_TOKEN,
    }, process.env.NODE_ENV !== 'production');

    const conectado = await shopeeService.testarConexao();
    res.json({ 
      status: conectado ? 'online' : 'offline',
      message: conectado ? 'Conexão com Shopee estabelecida' : 'Falha ao conectar com Shopee'
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão Shopee:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AMAZON ====================

router.get('/amazon/testar', authenticateToken, requirePermission('integracoes', 'view'), async (req, res) => {
  try {
    const amazonService = new AmazonService({
      clientId: process.env.AMAZON_CLIENT_ID || '',
      clientSecret: process.env.AMAZON_CLIENT_SECRET || '',
      refreshToken: process.env.AMAZON_REFRESH_TOKEN || '',
      accessKeyId: process.env.AMAZON_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY || '',
      region: (process.env.AMAZON_REGION as any) || 'us-east-1',
      marketplaceId: process.env.AMAZON_MARKETPLACE_ID || '',
      sellerId: process.env.AMAZON_SELLER_ID || '',
    });

    const conectado = await amazonService.testarConexao();
    res.json({ 
      status: conectado ? 'online' : 'offline',
      message: conectado ? 'Conexão com Amazon estabelecida' : 'Falha ao conectar com Amazon'
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão Amazon:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== MAGALU ====================

router.get('/magalu/testar', authenticateToken, requirePermission('integracoes', 'view'), async (req, res) => {
  try {
    const magaluService = new MagaluService({
      clientId: process.env.MAGALU_CLIENT_ID || '',
      clientSecret: process.env.MAGALU_CLIENT_SECRET || '',
      sellerId: process.env.MAGALU_SELLER_ID || '',
    });

    const conectado = await magaluService.testarConexao();
    res.json({ 
      status: conectado ? 'online' : 'offline',
      message: conectado ? 'Conexão com Magalu estabelecida' : 'Falha ao conectar com Magalu'
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão Magalu:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAGBANK ====================

router.post('/pagbank/criar-cobranca', authenticateToken, requirePermission('financeiro', 'create'), async (req, res) => {
  try {
    const pagbankService = new PagBankService({
      token: process.env.PAGBANK_TOKEN || '',
      sandbox: process.env.NODE_ENV !== 'production',
    });

    const cobranca = await pagbankService.criarCobranca(req.body);
    res.json(cobranca);
  } catch (error: any) {
    console.error('Erro ao criar cobrança PagBank:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/pagbank/consultar-cobranca/:id', authenticateToken, requirePermission('financeiro', 'view'), async (req, res) => {
  try {
    const { id } = req.params;

    const pagbankService = new PagBankService({
      token: process.env.PAGBANK_TOKEN || '',
      sandbox: process.env.NODE_ENV !== 'production',
    });

    const cobranca = await pagbankService.consultarCobranca(id);
    res.json(cobranca);
  } catch (error: any) {
    console.error('Erro ao consultar cobrança PagBank:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/pagbank/gerar-pix', authenticateToken, requirePermission('financeiro', 'create'), async (req, res) => {
  try {
    const { amount, description } = req.body;

    const pagbankService = new PagBankService({
      token: process.env.PAGBANK_TOKEN || '',
      sandbox: process.env.NODE_ENV !== 'production',
    });

    const qrcode = await pagbankService.gerarQRCodePix(amount, description);
    res.json(qrcode);
  } catch (error: any) {
    console.error('Erro ao gerar QR Code PIX:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/pagbank/testar', authenticateToken, requirePermission('financeiro', 'view'), async (req, res) => {
  try {
    const pagbankService = new PagBankService({
      token: process.env.PAGBANK_TOKEN || '',
      sandbox: process.env.NODE_ENV !== 'production',
    });

    const conectado = await pagbankService.testarConexao();
    res.json({ 
      status: conectado ? 'online' : 'offline',
      message: conectado ? 'Conexão com PagBank estabelecida' : 'Falha ao conectar com PagBank'
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão PagBank:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
