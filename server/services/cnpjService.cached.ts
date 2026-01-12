/**
 * Serviço de Consulta de CNPJ com Cache Redis
 * Markthub CRM - Versão otimizada com cache
 */

import axios from 'axios';
import { setCache, getCache } from './cacheService';

/**
 * Interface para dados de CNPJ da BrasilAPI
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
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  email: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  capital_social: number;
}

/**
 * Consulta CNPJ na BrasilAPI com cache
 * @param cnpj CNPJ para consultar (com ou sem formatação)
 * @returns Dados da empresa ou null se não encontrado
 */
export async function consultarCNPJ(cnpj: string): Promise<CNPJData | null> {
  try {
    // Remove formatação do CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    // Valida CNPJ
    if (!validarCNPJ(cnpjLimpo)) {
      console.error('❌ CNPJ inválido:', cnpj);
      return null;
    }

    // Chave do cache
    const cacheKey = `cnpj:${cnpjLimpo}`;

    // Tenta obter do cache (TTL: 7 dias = 604800 segundos)
    const cached = await getCache<CNPJData>(cacheKey);
    if (cached) {
      console.log(`✅ CNPJ obtido do cache: ${cnpjLimpo}`);
      return cached;
    }

    // Consulta na BrasilAPI
    console.log(`🔍 Consultando CNPJ na BrasilAPI: ${cnpjLimpo}`);
    const response = await axios.get(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'Markthub-CRM/1.0',
        },
      }
    );

    if (response.status === 200 && response.data) {
      const data: CNPJData = response.data;

      // Salva no cache (7 dias)
      await setCache(cacheKey, data, 604800);
      console.log(`✅ CNPJ salvo no cache: ${cnpjLimpo}`);

      return data;
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error('❌ CNPJ não encontrado:', cnpj);
    } else {
      console.error('❌ Erro ao consultar CNPJ:', error.message);
    }
    return null;
  }
}

/**
 * Valida CNPJ usando algoritmo da Receita Federal
 * @param cnpj CNPJ sem formatação (apenas números)
 * @returns true se válido, false caso contrário
 */
export function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cnpjLimpo = cnpj.replace(/\D/g, '');

  // CNPJ deve ter 14 dígitos
  if (cnpjLimpo.length !== 14) {
    return false;
  }

  // Rejeita CNPJs com todos os dígitos iguais
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

/**
 * Formata CNPJ para o padrão XX.XXX.XXX/XXXX-XX
 * @param cnpj CNPJ sem formatação
 * @returns CNPJ formatado
 */
export function formatarCNPJ(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/\D/g, '');

  if (cnpjLimpo.length !== 14) {
    return cnpj;
  }

  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Extrai informações relevantes do CNPJ para formulário
 * @param data Dados do CNPJ da BrasilAPI
 * @returns Objeto com informações formatadas
 */
export function extrairInformacoesCNPJ(data: CNPJData): {
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  situacao: string;
  dataAbertura: string;
} {
  return {
    razaoSocial: data.razao_social || '',
    nomeFantasia: data.nome_fantasia || data.razao_social || '',
    email: data.email || '',
    telefone: data.ddd_telefone_1 || data.ddd_telefone_2 || '',
    endereco: `${data.logradouro}, ${data.numero}${
      data.complemento ? ' - ' + data.complemento : ''
    } - ${data.bairro}`,
    cidade: data.municipio || '',
    estado: data.uf || '',
    cep: data.cep || '',
    situacao: data.situacao_cadastral || '',
    dataAbertura: data.data_inicio_atividade || '',
  };
}

export default {
  consultarCNPJ,
  validarCNPJ,
  formatarCNPJ,
  extrairInformacoesCNPJ,
};
