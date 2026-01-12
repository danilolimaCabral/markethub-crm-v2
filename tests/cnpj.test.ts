/**
 * Testes Automatizados - API de CNPJ
 * Markthub CRM
 */

import { validarCNPJ, formatarCNPJ, consultarCNPJ } from '../server/services/cnpjService';

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passedTests++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    failedTests++;
  }
}

function assertEquals(actual: any, expected: any, testName: string) {
  if (actual === expected) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passedTests++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual: ${actual}`);
    failedTests++;
  }
}

async function runTests() {
  console.log(`\n${colors.cyan}========================================`);
  console.log(`TESTES AUTOMATIZADOS - API DE CNPJ`);
  console.log(`========================================${colors.reset}\n`);

  // ==========================================
  // TESTES DE VALIDAÇÃO DE CNPJ
  // ==========================================
  console.log(`${colors.blue}📋 Testes de Validação de CNPJ${colors.reset}\n`);

  // CNPJs válidos
  assert(
    validarCNPJ('00000000000191'),
    'Deve validar CNPJ válido: 00000000000191'
  );

  assert(
    validarCNPJ('00.000.000/0001-91'),
    'Deve validar CNPJ válido com formatação: 00.000.000/0001-91'
  );

  assert(
    validarCNPJ('11222333000181'),
    'Deve validar CNPJ válido: 11222333000181'
  );

  // CNPJs inválidos
  assert(
    !validarCNPJ('00000000000000'),
    'Deve rejeitar CNPJ com todos os dígitos iguais'
  );

  assert(
    !validarCNPJ('11111111111111'),
    'Deve rejeitar CNPJ com sequência de 1s'
  );

  assert(
    !validarCNPJ('12345678901234'),
    'Deve rejeitar CNPJ com dígitos verificadores inválidos'
  );

  assert(
    !validarCNPJ('123456789012'),
    'Deve rejeitar CNPJ com menos de 14 dígitos'
  );

  assert(
    !validarCNPJ('123456789012345'),
    'Deve rejeitar CNPJ com mais de 14 dígitos'
  );

  assert(
    !validarCNPJ(''),
    'Deve rejeitar CNPJ vazio'
  );

  assert(
    !validarCNPJ('abcd1234567890'),
    'Deve rejeitar CNPJ com letras'
  );

  // ==========================================
  // TESTES DE FORMATAÇÃO DE CNPJ
  // ==========================================
  console.log(`\n${colors.blue}📋 Testes de Formatação de CNPJ${colors.reset}\n`);

  assertEquals(
    formatarCNPJ('00000000000191'),
    '00.000.000/0001-91',
    'Deve formatar CNPJ sem formatação'
  );

  assertEquals(
    formatarCNPJ('11222333000181'),
    '11.222.333/0001-81',
    'Deve formatar CNPJ corretamente'
  );

  assertEquals(
    formatarCNPJ('00.000.000/0001-91'),
    '00.000.000/0001-91',
    'Deve manter CNPJ já formatado'
  );

  assertEquals(
    formatarCNPJ('123'),
    '123',
    'Deve retornar CNPJ inválido sem formatação'
  );

  // ==========================================
  // TESTES DE CONSULTA DE CNPJ (API)
  // ==========================================
  console.log(`\n${colors.blue}📋 Testes de Consulta de CNPJ${colors.reset}\n`);

  // Teste com CNPJ válido (Banco do Brasil)
  try {
    const result = await consultarCNPJ('00000000000191');
    assert(
      result.success === true,
      'Deve retornar sucesso para CNPJ válido'
    );
    assert(
      result.data?.cnpj === '00.000.000/0001-91',
      'Deve retornar CNPJ formatado'
    );
    assert(
      result.data?.razao_social !== undefined,
      'Deve retornar razão social'
    );
    console.log(`  ${colors.cyan}→ Empresa encontrada: ${result.data?.razao_social}${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠ Teste de consulta pulado (API indisponível)${colors.reset}`);
  }

  // Teste com CNPJ inválido
  try {
    const result = await consultarCNPJ('00000000000000');
    assert(
      result.success === false,
      'Deve retornar erro para CNPJ inválido'
    );
    assert(
      result.error !== undefined,
      'Deve retornar mensagem de erro'
    );
  } catch (error) {
    console.log(`${colors.yellow}⚠ Teste de consulta pulado (API indisponível)${colors.reset}`);
  }

  // Teste com CNPJ não encontrado
  try {
    const result = await consultarCNPJ('99999999999999');
    assert(
      result.success === false,
      'Deve retornar erro para CNPJ não encontrado'
    );
  } catch (error) {
    console.log(`${colors.yellow}⚠ Teste de consulta pulado (API indisponível)${colors.reset}`);
  }

  // ==========================================
  // TESTES DE CASOS ESPECIAIS
  // ==========================================
  console.log(`\n${colors.blue}📋 Testes de Casos Especiais${colors.reset}\n`);

  assert(
    !validarCNPJ('  00000000000191  '),
    'Deve rejeitar CNPJ com espaços (sem trim automático)'
  );

  assert(
    validarCNPJ('00.000.000/0001-91'),
    'Deve aceitar CNPJ com pontuação'
  );

  assert(
    !validarCNPJ('00-000-000-0001-91'),
    'Deve rejeitar CNPJ com formatação incorreta'
  );

  // ==========================================
  // RESULTADOS FINAIS
  // ==========================================
  console.log(`\n${colors.cyan}========================================`);
  console.log(`RESULTADOS DOS TESTES`);
  console.log(`========================================${colors.reset}\n`);

  const totalTests = passedTests + failedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`Total de testes: ${totalTests}`);
  console.log(`${colors.green}✓ Passou: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}✗ Falhou: ${failedTests}${colors.reset}`);
  console.log(`Taxa de sucesso: ${successRate}%\n`);

  if (failedTests === 0) {
    console.log(`${colors.green}🎉 TODOS OS TESTES PASSARAM!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ ALGUNS TESTES FALHARAM${colors.reset}\n`);
    process.exit(1);
  }
}

// Executar testes
runTests().catch(error => {
  console.error(`${colors.red}Erro ao executar testes:${colors.reset}`, error);
  process.exit(1);
});
