/**
 * Script de Extração de Dados da Planilha Google Sheets
 * Extrai dados financeiros reais (contas a pagar, receber, fluxo de caixa)
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQY39dmgm-RWT_wI-3YvUuvfdZlqPkOhsIf9mmANPnLZX-Sj5vAcD_iEv7fjChHiw/pub?output=csv';
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'financial-data.json');

interface FinancialRecord {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pago' | 'pendente' | 'vencido';
  tipo: 'pagar' | 'receber';
  categoria: string;
}

async function extractGoogleSheetsData() {
  try {
    console.log('🔄 Iniciando extração de dados da planilha...');
    
    // Baixar CSV da planilha
    const response = await axios.get(SHEETS_URL);
    const csvData = response.data;
    
    console.log('✅ Dados baixados com sucesso');
    
    // Processar CSV
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim());
    
    const contasPagar: FinancialRecord[] = [];
    const contasReceber: FinancialRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const values = line.split(',').map((v: string) => v.trim());
      
      const record: FinancialRecord = {
        id: `FIN-${Date.now()}-${i}`,
        descricao: values[0] || '',
        valor: parseFloat(values[1]?.replace(/[^\d.-]/g, '') || '0'),
        vencimento: values[2] || '',
        status: determineStatus(values[2], values[3]),
        tipo: values[4]?.toLowerCase() === 'pagar' ? 'pagar' : 'receber',
        categoria: values[5] || 'Outros'
      };
      
      if (record.tipo === 'pagar') {
        contasPagar.push(record);
      } else {
        contasReceber.push(record);
      }
    }
    
    // Calcular métricas
    const metrics = calculateMetrics(contasPagar, contasReceber);
    
    // Salvar dados
    const financialData = {
      lastUpdate: new Date().toISOString(),
      contasPagar,
      contasReceber,
      metrics
    };
    
    // Criar diretório se não existir
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(financialData, null, 2));
    
    console.log('✅ Dados financeiros salvos em:', OUTPUT_FILE);
    console.log(`📊 Contas a Pagar: ${contasPagar.length}`);
    console.log(`📊 Contas a Receber: ${contasReceber.length}`);
    console.log(`💰 Total a Pagar: R$ ${metrics.totalPagar.toFixed(2)}`);
    console.log(`💰 Total a Receber: R$ ${metrics.totalReceber.toFixed(2)}`);
    
    return financialData;
    
  } catch (error) {
    console.error('❌ Erro ao extrair dados da planilha:', error);
    throw error;
  }
}

function determineStatus(vencimento: string, statusPago?: string): 'pago' | 'pendente' | 'vencido' {
  if (statusPago?.toLowerCase() === 'pago') return 'pago';
  
  const hoje = new Date();
  const dataVencimento = new Date(vencimento);
  
  if (dataVencimento < hoje) return 'vencido';
  return 'pendente';
}

function calculateMetrics(contasPagar: FinancialRecord[], contasReceber: FinancialRecord[]) {
  const totalPagar = contasPagar
    .filter(c => c.status !== 'pago')
    .reduce((sum, c) => sum + c.valor, 0);
    
  const totalReceber = contasReceber
    .filter(c => c.status !== 'pago')
    .reduce((sum, c) => sum + c.valor, 0);
    
  const contasVencidas = contasPagar.filter(c => c.status === 'vencido');
  const totalVencido = contasVencidas.reduce((sum, c) => sum + c.valor, 0);
  
  return {
    totalPagar,
    totalReceber,
    saldoProjetado: totalReceber - totalPagar,
    contasVencidas: contasVencidas.length,
    totalVencido
  };
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  extractGoogleSheetsData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { extractGoogleSheetsData };
