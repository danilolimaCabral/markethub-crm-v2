import axios from 'axios';

/**
 * Serviço de Consulta de CNPJ
 * Utiliza a BrasilAPI (gratuita e sem necessidade de autenticação)
 * Documentação: https://brasilapi.com.br/docs#tag/CNPJ
 */

interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cnae_fiscal: string;
  cnae_fiscal_descricao: string;
  data_inicio_atividade: string;
  natureza_juridica: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  email: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  porte: string;
  capital_social: number;
}

interface CNPJResponse {
  success: boolean;
  data?: {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    email: string;
    telefone: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    situacao: string;
    porte: string;
    capital_social: number;
    data_abertura: string;
    cnae_principal: string;
    cnae_descricao: string;
  };
  error?: string;
}

/**
 * Consulta dados de uma empresa pelo CNPJ
 * @param cnpj CNPJ da empresa (com ou sem formatação)
 * @returns Dados da empresa ou erro
 */
export async function consultarCNPJ(cnpj: string): Promise<CNPJResponse> {
  try {
    // Remove formatação do CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    // Valida se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
      return {
        success: false,
        error: 'CNPJ deve conter 14 dígitos'
      };
    }
    
    // Consulta a BrasilAPI
    const response = await axios.get<CNPJData>(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
      {
        timeout: 10000, // 10 segundos
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    const data = response.data;
    
    // Formata telefone
    let telefone = '';
    if (data.ddd_telefone_1) {
      telefone = data.ddd_telefone_1;
    } else if (data.ddd_telefone_2) {
      telefone = data.ddd_telefone_2;
    }
    
    // Formata endereço completo
    const endereco = [
      data.logradouro,
      data.numero,
      data.complemento,
      data.bairro
    ].filter(Boolean).join(', ');
    
    // Retorna dados formatados
    return {
      success: true,
      data: {
        cnpj: formatarCNPJ(cnpjLimpo),
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || data.razao_social,
        email: data.email || '',
        telefone: telefone,
        endereco: endereco,
        cidade: data.municipio,
        estado: data.uf,
        cep: data.cep,
        situacao: data.situacao_cadastral,
        porte: data.porte,
        capital_social: data.capital_social,
        data_abertura: data.data_inicio_atividade,
        cnae_principal: data.cnae_fiscal,
        cnae_descricao: data.cnae_fiscal_descricao
      }
    };
    
  } catch (error: any) {
    console.error('Erro ao consultar CNPJ:', error);
    
    // Trata erros específicos
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'CNPJ não encontrado na base da Receita Federal'
      };
    }
    
    if (error.response?.status === 429) {
      return {
        success: false,
        error: 'Limite de requisições excedido. Tente novamente em alguns segundos.'
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: 'Tempo de consulta excedido. Verifique sua conexão e tente novamente.'
      };
    }
    
    return {
      success: false,
      error: 'Erro ao consultar CNPJ. Tente novamente mais tarde.'
    };
  }
}

/**
 * Formata CNPJ para o padrão XX.XXX.XXX/XXXX-XX
 * @param cnpj CNPJ sem formatação
 * @returns CNPJ formatado
 */
export function formatarCNPJ(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  
  if (cnpjLimpo.length !== 14) {
    return cnpj;
  }
  
  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Valida se um CNPJ é válido (algoritmo da Receita Federal)
 * @param cnpj CNPJ com ou sem formatação
 * @returns true se válido, false caso contrário
 */
export function validarCNPJ(cnpj: string): boolean {
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

export default {
  consultarCNPJ,
  formatarCNPJ,
  validarCNPJ
};
