#!/usr/bin/env node
/**
 * Agente Automatizado de Scraping do Lexos Hub
 * Extrai dados reais e alimenta o CRM automaticamente
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

// Configurações
const LEXOS_HUB_URL = 'https://app-hub.lexos.com.br';
const CREDENTIALS = {
  email: process.env.LEXOS_EMAIL || 'trueimportadosbradm@gmail.com',
  password: process.env.LEXOS_PASSWORD || '', // Definir via variável de ambiente
};
const DATA_FILE = path.join(process.cwd(), 'client/src/data/synced-data.json');
const LOG_FILE = path.join(process.cwd(), 'logs/sync.log');

/**
 * Logger
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  
  // Salvar em arquivo
  fs.appendFile(LOG_FILE, logMessage).catch(err => console.error('Erro ao salvar log:', err));
}

/**
 * Fazer login no Lexos Hub
 */
async function login(page) {
  log('🔐 Fazendo login no Lexos Hub...');
  
  try {
    await page.goto(LEXOS_HUB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Aguardar campos de login
    await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    // Preencher credenciais
    await page.type('input[type="email"], input[type="text"]', CREDENTIALS.email);
    await page.type('input[type="password"]', CREDENTIALS.password);
    
    // Clicar em entrar
    await page.click('button[type="submit"]');
    
    // Aguardar navegação
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    log('✅ Login realizado com sucesso');
    return true;
  } catch (error) {
    log(`❌ Erro no login: ${error.message}`);
    return false;
  }
}

/**
 * Extrair dados do dashboard
 */
async function extractDashboardData(page) {
  log('📊 Extraindo dados do dashboard...');
  
  try {
    // Navegar para dashboard
    await page.goto(`${LEXOS_HUB_URL}/#/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Aguardar carregamento dos dados
    await page.waitForTimeout(3000);
    
    // Extrair métricas principais
    const data = await page.evaluate(() => {
      const extractText = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : null;
      };
      
      const extractNumber = (text) => {
        if (!text) return 0;
        return parseFloat(text.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
      };
      
      return {
        timestamp: new Date().toISOString(),
        metrics: {
          totalVendas: extractNumber(extractText('[data-metric="total-vendas"]')),
          totalPedidos: extractNumber(extractText('[data-metric="total-pedidos"]')),
          ticketMedio: extractNumber(extractText('[data-metric="ticket-medio"]')),
          pedidosConferidos: extractNumber(extractText('[data-metric="pedidos-conferidos"]')),
        },
        status: 'success'
      };
    });
    
    log(`✅ Dados extraídos: ${JSON.stringify(data.metrics)}`);
    return data;
  } catch (error) {
    log(`❌ Erro ao extrair dados: ${error.message}`);
    return {
      timestamp: new Date().toISOString(),
      metrics: {},
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Salvar dados extraídos
 */
async function saveData(data) {
  log('💾 Salvando dados...');
  
  try {
    // Criar diretório se não existir
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    
    // Salvar dados
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    
    log('✅ Dados salvos com sucesso');
    return true;
  } catch (error) {
    log(`❌ Erro ao salvar dados: ${error.message}`);
    return false;
  }
}

/**
 * Executar scraping completo
 */
async function runScraper() {
  log('🤖 Iniciando agente de scraping...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Fazer login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      throw new Error('Falha no login');
    }
    
    // Extrair dados
    const data = await extractDashboardData(page);
    
    // Salvar dados
    await saveData(data);
    
    log('🎉 Scraping concluído com sucesso!');
    
  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Executar agente
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runScraper()
    .then(() => {
      log('✅ Agente finalizado');
      process.exit(0);
    })
    .catch((error) => {
      log(`❌ Erro fatal: ${error.message}`);
      process.exit(1);
    });
}

export { runScraper };
