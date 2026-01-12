/**
 * Script de Teste - Validações de CNPJ
 * Markthub CRM - Testes sem dependências externas
 */

// Cores para output
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

// Função de validação de CNPJ (copiada do serviço)
function validarCNPJ(cnpj) {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se tem 14 dígitos
  if (cnpjLimpo.length !== 14) {
    return false;
  }
  
  // Verifica se não é uma sequência de números iguais
  if (/^(\d)\1+$/.test(cnpjLimpo)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  
  if (resultado !== parseInt(digitos.charAt(0))) {
    return false;
  }
  
  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  
  if (resultado !== parseInt(digitos.charAt(1))) {
    return false;
  }
  
  return true;
}

// Função de formatação de CNPJ
function formatarCNPJ(cnpj) {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  
  if (cnpjLimpo.length !== 14) {
    return cnpj;
  }
  
  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

function assert(condition, testName) {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passedTests++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    failedTests++;
  }
}

function assertEquals(actual, expected, testName) {
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

console.log(`\n${colors.cyan}========================================`);
console.log(`TESTES DE VALIDAÇÃO E FORMATAÇÃO DE CNPJ`);
console.log(`========================================${colors.reset}\n`);

// ==========================================
// TESTES DE VALIDAÇÃO
// ==========================================
console.log(`${colors.blue}📋 Testes de Validação de CNPJ${colors.reset}\n`);

// CNPJs válidos
assert(
  validarCNPJ('00000000000191'),
  'Deve validar CNPJ válido: 00000000000191 (Banco do Brasil)'
);

assert(
  validarCNPJ('00.000.000/0001-91'),
  'Deve validar CNPJ com formatação: 00.000.000/0001-91'
);

assert(
  validarCNPJ('11222333000181'),
  'Deve validar CNPJ válido: 11222333000181'
);

assert(
  validarCNPJ('00360305000104'),
  'Deve validar CNPJ válido: 00360305000104 (Petrobras)'
);

assert(
  validarCNPJ('33000167000101'),
  'Deve validar CNPJ válido: 33000167000101 (Caixa Econômica)'
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
  !validarCNPJ('22222222222222'),
  'Deve rejeitar CNPJ com sequência de 2s'
);

assert(
  !validarCNPJ('12345678901234'),
  'Deve rejeitar CNPJ com dígitos verificadores inválidos'
);

assert(
  !validarCNPJ('00000000000190'),
  'Deve rejeitar CNPJ com último dígito incorreto'
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
// TESTES DE FORMATAÇÃO
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
  formatarCNPJ('00360305000104'),
  '00.360.305/0001-04',
  'Deve formatar CNPJ da Petrobras'
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
// TESTES DE CASOS ESPECIAIS
// ==========================================
console.log(`\n${colors.blue}📋 Testes de Casos Especiais${colors.reset}\n`);

assert(
  validarCNPJ('00.000.000/0001-91'),
  'Deve aceitar CNPJ com pontuação padrão'
);

assert(
  validarCNPJ('00000000/0001-91'),
  'Deve aceitar CNPJ com pontuação parcial'
);

assert(
  validarCNPJ('00-000-000-0001-91'),
  'Deve aceitar CNPJ com hífens'
);

// ==========================================
// TESTES DE INTEGRAÇÃO COM TENANT
// ==========================================
console.log(`\n${colors.blue}📋 Testes de Integração (Simulação)${colors.reset}\n`);

// Simula validações do endpoint de criação de tenant
function validarCriacaoTenant(dados) {
  const erros = [];
  
  // 1. CNPJ obrigatório
  if (!dados.cnpj || dados.cnpj.trim() === '') {
    erros.push('CNPJ é obrigatório');
  }
  
  // 2. CNPJ válido
  if (dados.cnpj && !validarCNPJ(dados.cnpj)) {
    erros.push('CNPJ inválido');
  }
  
  // 3. Email obrigatório
  if (!dados.email || dados.email.trim() === '') {
    erros.push('Email é obrigatório');
  }
  
  // 4. Integrações obrigatórias
  if (!dados.integrations || dados.integrations.length === 0) {
    erros.push('Pelo menos uma integração é obrigatória');
  }
  
  return {
    valido: erros.length === 0,
    erros
  };
}

// Teste 1: Dados completos e válidos
const teste1 = validarCriacaoTenant({
  cnpj: '00000000000191',
  email: 'contato@empresa.com',
  integrations: ['MercadoLivre']
});
assert(
  teste1.valido,
  'Deve aceitar criação de tenant com dados válidos'
);

// Teste 2: CNPJ faltando
const teste2 = validarCriacaoTenant({
  cnpj: '',
  email: 'contato@empresa.com',
  integrations: ['MercadoLivre']
});
assert(
  !teste2.valido && teste2.erros.includes('CNPJ é obrigatório'),
  'Deve rejeitar criação sem CNPJ'
);

// Teste 3: CNPJ inválido
const teste3 = validarCriacaoTenant({
  cnpj: '12345678901234',
  email: 'contato@empresa.com',
  integrations: ['MercadoLivre']
});
assert(
  !teste3.valido && teste3.erros.includes('CNPJ inválido'),
  'Deve rejeitar criação com CNPJ inválido'
);

// Teste 4: Email faltando
const teste4 = validarCriacaoTenant({
  cnpj: '00000000000191',
  email: '',
  integrations: ['MercadoLivre']
});
assert(
  !teste4.valido && teste4.erros.includes('Email é obrigatório'),
  'Deve rejeitar criação sem email'
);

// Teste 5: Integrações faltando
const teste5 = validarCriacaoTenant({
  cnpj: '00000000000191',
  email: 'contato@empresa.com',
  integrations: []
});
assert(
  !teste5.valido && teste5.erros.includes('Pelo menos uma integração é obrigatória'),
  'Deve rejeitar criação sem integrações'
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
