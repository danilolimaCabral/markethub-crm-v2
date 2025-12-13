/**
 * Rotas de API para serviços de logística
 * Correios, Melhor Envio e Jadlog
 */

import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import CorreiosService from '../services/correios';
import { MelhorEnvioService } from '../services/melhorenvio';
import JadlogService from '../services/jadlog';

const router = Router();

// ==================== CORREIOS ====================

/**
 * Calcular frete pelos Correios
 */
router.post('/correios/calcular-frete', authenticateToken, requirePermission('entregas', 'view'), async (req, res) => {
  try {
    const { cepOrigem, cepDestino, peso, formato, comprimento, altura, largura } = req.body;

    // Buscar configuração dos Correios do banco de dados
    // Por enquanto, usar configuração de exemplo
    const correiosService = new CorreiosService({
      usuario: process.env.CORREIOS_USUARIO || '',
      senha: process.env.CORREIOS_SENHA || '',
      cartaoPostagem: process.env.CORREIOS_CARTAO || '',
      cnpj: process.env.CORREIOS_CNPJ || '',
    });

    const resultado = await correiosService.calcularFrete({
      cepOrigem,
      cepDestino,
      peso,
      formato,
      comprimento,
      altura,
      largura,
    });

    res.json(resultado);
  } catch (error: any) {
    console.error('Erro ao calcular frete Correios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Rastrear objeto pelos Correios
 */
router.get('/correios/rastrear/:codigo', authenticateToken, requirePermission('entregas', 'view'), async (req, res) => {
  try {
    const { codigo } = req.params;

    const correiosService = new CorreiosService({
      usuario: process.env.CORREIOS_USUARIO || '',
      senha: process.env.CORREIOS_SENHA || '',
      cartaoPostagem: process.env.CORREIOS_CARTAO || '',
      cnpj: process.env.CORREIOS_CNPJ || '',
    });

    const rastreamento = await correiosService.rastrearObjeto(codigo);

    res.json(rastreamento);
  } catch (error: any) {
    console.error('Erro ao rastrear objeto Correios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Testar conexão com Correios
 */
router.get('/correios/testar', authenticateToken, requirePermission('entregas', 'view'), async (req, res) => {
  try {
    const correiosService = new CorreiosService({
      usuario: process.env.CORREIOS_USUARIO || '',
      senha: process.env.CORREIOS_SENHA || '',
      cartaoPostagem: process.env.CORREIOS_CARTAO || '',
      cnpj: process.env.CORREIOS_CNPJ || '',
    });

    const conectado = await correiosService.testarConexao();

    res.json({ 
      status: conectado ? 'online' : 'offline',
      message: conectado ? 'Conexão com Correios estabelecida' : 'Falha ao conectar com Correios'
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão Correios:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== MELHOR ENVIO ====================

/**
 * Calcular frete pelo Melhor Envio
 */
router.post('/melhorenvio/calcular-frete', authenticateToken, requirePermission('entregas', 'view'), async (req, res) => {
  try {
    const { from, to, package: packageData } = req.body;

    const melhorEnvioService = new MelhorEnvioService({
      clientId: process.env.MELHOR_ENVIO_CLIENT_ID || '',
      clientSecret: process.env.MELHOR_ENVIO_CLIENT_SECRET || '',
      accessToken: process.env.MELHOR_ENVIO_ACCESS_TOKEN || '',
      refreshToken: process.env.MELHOR_ENVIO_REFRESH_TOKEN || '',
      sandbox: process.env.NODE_ENV !== 'production',
    });

    const resultado = await melhorEnvioService.calcularFrete({
      from,
      to,
      package: packageData,
    });

    res.json(resultado);
  } catch (error: any) {
    console.error('Erro ao calcular frete Melhor Envio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Rastrear envio pelo Melhor Envio
 */
router.get('/melhorenvio/rastrear/:id', authenticateToken, requirePermission('entregas', 'view'), async (req, res) => {
  try {
    const { id } = req.params;

    const melhorEnvioService = new MelhorEnvioService({
      clientId: process.env.MELHOR_ENVIO_CLIENT_ID || '',
      clientSecret: process.env.MELHOR_ENVIO_CLIENT_SECRET || '',
      accessToken: process.env.MELHOR_ENVIO_ACCESS_TOKEN || '',
      refreshToken: process.env.MELHOR_ENVIO_REFRESH_TOKEN || '',
      sandbox: process.env.NODE_ENV !== 'production',
    });

    const rastreamento = await melhorEnvioService.rastrearEnvio(id);

    res.json(rastreamento);
  } catch (error: any) {
    console.error('Erro ao rastrear envio Melhor Envio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Testar conexão com Melhor Envio
 */
router.get('/melhorenvio/testar', authenticateToken, requirePermission('entregas', 'view'), async (req, res) => {
  try {
    const melhorEnvioService = new MelhorEnvioService({
      clientId: process.env.MELHOR_ENVIO_CLIENT_ID || '',
      clientSecret: process.env.MELHOR_ENVIO_CLIENT_SECRET || '',
      accessToken: process.env.MELHOR_ENVIO_ACCESS_TOKEN || '',
      refreshToken: process.env.MELHOR_ENVIO_REFRESH_TOKEN || '',
      sandbox: process.env.NODE_ENV !== 'production',
    });

    const conectado = await melhorEnvioService.testarConexao();

    res.json({ 
      status: conectado ? 'online' : 'offline',
      message: conectado ? 'Conexão com Melhor Envio estabelecida' : 'Falha ao conectar com Melhor Envio'
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão Melhor Envio:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== JADLOG ====================

/**
 * Calcular frete pela Jadlog
 */
router.post('/jadlog/calcular-frete', authenticateToken, requirePermission('entregas', 'view'), async (req, res) => {
  try {
    const { cepOrigem, cepDestino, peso, valorDeclarado, modalidade } = req.body;

    const jadlogService = new JadlogService({
      token: process.env.JADLOG_TOKEN || '',
      cnpj: process.env.JADLOG_CNPJ || '',
      contrato: process.env.JADLOG_CONTRATO || '',
    });

    const resultado = await jadlogService.calcularFrete({
      cepOrigem,
      cepDestino,
      peso,
      valorDeclarado,
      modalidade,
    });

    res.json(resultado);
  } catch (error: any) {
    console.error('Erro ao calcular frete Jadlog:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Rastrear pedido pela Jadlog
 */
router.get('/jadlog/rastrear/:numero', authenticateToken, requirePermission('entregas', 'view'), async (req, res) => {
  try {
    const { numero } = req.params;

    const jadlogService = new JadlogService({
      token: process.env.JADLOG_TOKEN || '',
      cnpj: process.env.JADLOG_CNPJ || '',
      contrato: process.env.JADLOG_CONTRATO || '',
    });

    const rastreamento = await jadlogService.rastrearPedido(numero);

    res.json(rastreamento);
  } catch (error: any) {
    console.error('Erro ao rastrear pedido Jadlog:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Testar conexão com Jadlog
 */
router.get('/jadlog/testar', authenticateToken, requirePermission('entregas', 'view'), async (req, res) => {
  try {
    const jadlogService = new JadlogService({
      token: process.env.JADLOG_TOKEN || '',
      cnpj: process.env.JADLOG_CNPJ || '',
      contrato: process.env.JADLOG_CONTRATO || '',
    });

    const conectado = await jadlogService.testarConexao();

    res.json({ 
      status: conectado ? 'online' : 'offline',
      message: conectado ? 'Conexão com Jadlog estabelecida' : 'Falha ao conectar com Jadlog'
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão Jadlog:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
