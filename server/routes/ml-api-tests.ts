import { Router } from 'express';
import axios from 'axios';

const router = Router();

const ML_API_BASE_URL = 'https://api.mercadolibre.com';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  responseTime: number;
  statusCode: number | null;
  errorMessage: string | null;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  pendingTests: number;
  totalTime: number;
  avgResponseTime: number;
}

/**
 * Executa um teste individual em um endpoint
 */
async function runTest(name: string, endpoint: string, accessToken?: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const headers: any = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await axios.get(endpoint, {
      headers,
      timeout: 10000,
      validateStatus: () => true, // Aceita qualquer status code
    });

    const responseTime = Date.now() - startTime;
    const success = response.status >= 200 && response.status < 300;

    return {
      name,
      endpoint,
      status: success ? 'success' : 'failed',
      responseTime,
      statusCode: response.status,
      errorMessage: success ? null : (response.data?.message || response.data?.error || 'Request failed'),
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      name,
      endpoint,
      status: 'failed',
      responseTime,
      statusCode: error.response?.status || null,
      errorMessage: error.message || 'Unknown error',
    };
  }
}

/**
 * POST /api/mercadolivre/test-api
 * Executa todos os testes da API do Mercado Livre
 */
router.post('/test-api', async (req, res) => {
  try {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Definir todos os testes a serem executados
    const testCases = [
      { name: 'Listar Categorias', endpoint: `${ML_API_BASE_URL}/sites/MLB/categories` },
      { name: 'Categoria Eletrônicos', endpoint: `${ML_API_BASE_URL}/categories/MLB1000` },
      { name: 'Listar Moedas', endpoint: `${ML_API_BASE_URL}/currencies` },
      { name: 'Moeda BRL', endpoint: `${ML_API_BASE_URL}/currencies/BRL` },
      { name: 'Listar Sites', endpoint: `${ML_API_BASE_URL}/sites` },
      { name: 'Site Brasil', endpoint: `${ML_API_BASE_URL}/sites/MLB` },
      { name: 'Listar Países', endpoint: `${ML_API_BASE_URL}/countries` },
      { name: 'País Brasil', endpoint: `${ML_API_BASE_URL}/countries/BR` },
      { name: 'Listar Estados (BR)', endpoint: `${ML_API_BASE_URL}/countries/BR/states` },
      { name: 'Estado São Paulo', endpoint: `${ML_API_BASE_URL}/states/BR-SP` },
      { name: 'Listar Cidades (SP)', endpoint: `${ML_API_BASE_URL}/states/BR-SP/cities` },
      { name: 'Tipos de Listagem', endpoint: `${ML_API_BASE_URL}/sites/MLB/listing_types` },
      { name: 'Exposições', endpoint: `${ML_API_BASE_URL}/sites/MLB/listing_exposures` },
      { name: 'Métodos de Pagamento', endpoint: `${ML_API_BASE_URL}/sites/MLB/payment_methods` },
      { name: 'Tipos de Identificação', endpoint: `${ML_API_BASE_URL}/sites/MLB/identification_types` },
    ];

    // Executar todos os testes
    for (const testCase of testCases) {
      const result = await runTest(testCase.name, testCase.endpoint);
      tests.push(result);
    }

    // Calcular estatísticas
    const totalTime = Date.now() - startTime;
    const passedTests = tests.filter(t => t.status === 'success').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;
    const totalResponseTime = tests.reduce((sum, t) => sum + t.responseTime, 0);
    const avgResponseTime = totalResponseTime / tests.length;

    const summary: TestSummary = {
      totalTests: tests.length,
      passedTests,
      failedTests,
      pendingTests: 0,
      totalTime,
      avgResponseTime,
    };

    res.json({
      success: true,
      tests,
      summary,
    });
  } catch (error: any) {
    console.error('Erro ao executar testes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar testes da API',
      error: error.message,
    });
  }
});

export default router;
