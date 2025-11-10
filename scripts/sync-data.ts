/**
 * Script Principal de Sincronização de Dados
 * Executa extração de dados do Lexos Hub e Google Sheets
 * Pode ser agendado para execução automática (cron job)
 */

import { extractLexosData } from './extract-lexos-data.js';
import { extractGoogleSheetsData } from './extract-google-sheets.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const CONSOLIDATED_FILE = path.join(DATA_DIR, 'consolidated-data.json');
const LOG_FILE = path.join(DATA_DIR, 'sync-log.json');

interface SyncLog {
  timestamp: string;
  success: boolean;
  sources: {
    lexos: boolean;
    googleSheets: boolean;
  };
  errors: string[];
}

async function syncAllData() {
  console.log('🚀 Iniciando sincronização de dados...\n');
  
  const log: SyncLog = {
    timestamp: new Date().toISOString(),
    success: true,
    sources: {
      lexos: false,
      googleSheets: false
    },
    errors: []
  };
  
  try {
    // 1. Extrair dados do Lexos Hub
    console.log('📊 Extraindo dados do Lexos Hub...');
    const lexosData = await extractLexosData();
    log.sources.lexos = true;
    console.log('✅ Dados do Lexos Hub extraídos\n');
    
    // 2. Extrair dados do Google Sheets
    console.log('💰 Extraindo dados financeiros do Google Sheets...');
    const financialData = await extractGoogleSheetsData();
    log.sources.googleSheets = true;
    console.log('✅ Dados financeiros extraídos\n');
    
    // 3. Consolidar dados
    console.log('🔄 Consolidando dados...');
    const consolidatedData = {
      lastUpdate: new Date().toISOString(),
      lexos: lexosData,
      financial: financialData,
      summary: {
        totalVendas: lexosData.metrics.totalVendas,
        totalPedidos: lexosData.metrics.totalPedidos,
        ticketMedio: lexosData.metrics.ticketMedio,
        contasPagar: financialData.metrics.totalPagar,
        contasReceber: financialData.metrics.totalReceber,
        saldoProjetado: financialData.metrics.saldoProjetado
      }
    };
    
    // Criar diretório se não existir
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Salvar dados consolidados
    fs.writeFileSync(CONSOLIDATED_FILE, JSON.stringify(consolidatedData, null, 2));
    console.log('✅ Dados consolidados salvos em:', CONSOLIDATED_FILE);
    
    // 4. Salvar log
    saveSyncLog(log);
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`📊 Total Vendas: R$ ${consolidatedData.summary.totalVendas.toLocaleString('pt-BR')}`);
    console.log(`💰 Saldo Projetado: R$ ${consolidatedData.summary.saldoProjetado.toLocaleString('pt-BR')}`);
    
  } catch (error) {
    log.success = false;
    log.errors.push(error instanceof Error ? error.message : String(error));
    saveSyncLog(log);
    
    console.error('\n❌ Erro na sincronização:', error);
    throw error;
  }
}

function saveSyncLog(log: SyncLog) {
  try {
    let logs: SyncLog[] = [];
    
    if (fs.existsSync(LOG_FILE)) {
      const existingLogs = fs.readFileSync(LOG_FILE, 'utf-8');
      logs = JSON.parse(existingLogs);
    }
    
    logs.push(log);
    
    // Manter apenas os últimos 100 logs
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Erro ao salvar log:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  syncAllData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { syncAllData };
