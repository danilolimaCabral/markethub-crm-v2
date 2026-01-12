/**
 * Serviço de Validações Robustas
 * Markthub CRM - Validações completas para dados de entrada
 */

/**
 * Valida formato de email
 * @param email Email para validar
 * @returns true se válido, false caso contrário
 */
export function validarEmail(email: string): boolean {
  if (!email || email.trim() === '') {
    return false;
  }

  // Regex robusto para validação de email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }

  // Validações adicionais
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;

  // Local part não pode começar ou terminar com ponto
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  // Local part não pode ter pontos consecutivos
  if (localPart.includes('..')) {
    return false;
  }

  // Domínio deve ter pelo menos um ponto
  if (!domain.includes('.')) {
    return false;
  }

  // TLD (top-level domain) deve ter pelo menos 2 caracteres
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) {
    return false;
  }

  return true;
}

/**
 * Valida e formata telefone brasileiro
 * @param telefone Telefone para validar
 * @returns Objeto com status de validação e telefone formatado
 */
export function validarTelefone(telefone: string): {
  valido: boolean;
  formatado: string;
  tipo: 'fixo' | 'celular' | 'invalido';
} {
  if (!telefone || telefone.trim() === '') {
    return {
      valido: false,
      formatado: '',
      tipo: 'invalido'
    };
  }

  // Remove todos os caracteres não numéricos
  const numeros = telefone.replace(/\D/g, '');

  // Telefone deve ter 10 ou 11 dígitos (com DDD)
  if (numeros.length < 10 || numeros.length > 11) {
    return {
      valido: false,
      formatado: telefone,
      tipo: 'invalido'
    };
  }

  // Extrai DDD
  const ddd = numeros.substring(0, 2);
  
  // Valida DDD (11 a 99)
  const dddNum = parseInt(ddd);
  if (dddNum < 11 || dddNum > 99) {
    return {
      valido: false,
      formatado: telefone,
      tipo: 'invalido'
    };
  }

  // Determina tipo e formata
  if (numeros.length === 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    const numero = numeros.substring(2);
    return {
      valido: true,
      formatado: `(${ddd}) ${numero.substring(0, 4)}-${numero.substring(4)}`,
      tipo: 'fixo'
    };
  } else {
    // Celular: (XX) XXXXX-XXXX
    const numero = numeros.substring(2);
    
    // Valida se começa com 9 (celular)
    if (!numero.startsWith('9')) {
      return {
        valido: false,
        formatado: telefone,
        tipo: 'invalido'
      };
    }

    return {
      valido: true,
      formatado: `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`,
      tipo: 'celular'
    };
  }
}

/**
 * Valida CEP brasileiro
 * @param cep CEP para validar
 * @returns true se válido, false caso contrário
 */
export function validarCEP(cep: string): boolean {
  if (!cep || cep.trim() === '') {
    return false;
  }

  // Remove formatação
  const numeros = cep.replace(/\D/g, '');

  // CEP deve ter 8 dígitos
  if (numeros.length !== 8) {
    return false;
  }

  // CEP não pode ser sequência de zeros
  if (numeros === '00000000') {
    return false;
  }

  return true;
}

/**
 * Formata CEP brasileiro
 * @param cep CEP para formatar
 * @returns CEP formatado (XXXXX-XXX)
 */
export function formatarCEP(cep: string): string {
  const numeros = cep.replace(/\D/g, '');
  
  if (numeros.length !== 8) {
    return cep;
  }

  return `${numeros.substring(0, 5)}-${numeros.substring(5)}`;
}

/**
 * Valida nome completo
 * @param nome Nome para validar
 * @returns true se válido, false caso contrário
 */
export function validarNomeCompleto(nome: string): boolean {
  if (!nome || nome.trim() === '') {
    return false;
  }

  const nomeTrimmed = nome.trim();

  // Nome deve ter pelo menos 2 caracteres
  if (nomeTrimmed.length < 2) {
    return false;
  }

  // Nome deve ter pelo menos um espaço (nome e sobrenome)
  if (!nomeTrimmed.includes(' ')) {
    return false;
  }

  // Nome não pode ter números
  if (/\d/.test(nomeTrimmed)) {
    return false;
  }

  // Nome não pode ter caracteres especiais (exceto acentos e hífen)
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(nomeTrimmed)) {
    return false;
  }

  // Cada parte do nome deve ter pelo menos 2 caracteres
  const partes = nomeTrimmed.split(' ').filter(p => p.length > 0);
  if (partes.some(parte => parte.length < 2)) {
    return false;
  }

  return true;
}

/**
 * Valida URL
 * @param url URL para validar
 * @returns true se válida, false caso contrário
 */
export function validarURL(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    
    // Protocolo deve ser http ou https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // Hostname deve existir
    if (!urlObj.hostname) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Valida senha forte
 * @param senha Senha para validar
 * @returns Objeto com status e mensagens de erro
 */
export function validarSenhaForte(senha: string): {
  valida: boolean;
  erros: string[];
  forca: 'fraca' | 'media' | 'forte';
} {
  const erros: string[] = [];
  let pontuacao = 0;

  if (!senha || senha.trim() === '') {
    return {
      valida: false,
      erros: ['Senha é obrigatória'],
      forca: 'fraca'
    };
  }

  // Mínimo 8 caracteres
  if (senha.length < 8) {
    erros.push('Senha deve ter no mínimo 8 caracteres');
  } else {
    pontuacao += 1;
  }

  // Pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(senha)) {
    erros.push('Senha deve conter pelo menos uma letra maiúscula');
  } else {
    pontuacao += 1;
  }

  // Pelo menos uma letra minúscula
  if (!/[a-z]/.test(senha)) {
    erros.push('Senha deve conter pelo menos uma letra minúscula');
  } else {
    pontuacao += 1;
  }

  // Pelo menos um número
  if (!/\d/.test(senha)) {
    erros.push('Senha deve conter pelo menos um número');
  } else {
    pontuacao += 1;
  }

  // Pelo menos um caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    erros.push('Senha deve conter pelo menos um caractere especial');
  } else {
    pontuacao += 1;
  }

  // Determina força
  let forca: 'fraca' | 'media' | 'forte' = 'fraca';
  if (pontuacao >= 4) {
    forca = 'forte';
  } else if (pontuacao >= 2) {
    forca = 'media';
  }

  return {
    valida: erros.length === 0,
    erros,
    forca
  };
}

/**
 * Sanitiza string removendo caracteres perigosos
 * @param input String para sanitizar
 * @returns String sanitizada
 */
export function sanitizarString(input: string): string {
  if (!input) {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Valida data no formato brasileiro (DD/MM/YYYY)
 * @param data Data para validar
 * @returns true se válida, false caso contrário
 */
export function validarData(data: string): boolean {
  if (!data || data.trim() === '') {
    return false;
  }

  // Formato DD/MM/YYYY
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = data.match(regex);

  if (!match) {
    return false;
  }

  const [, dia, mes, ano] = match;
  const diaNum = parseInt(dia);
  const mesNum = parseInt(mes);
  const anoNum = parseInt(ano);

  // Valida mês
  if (mesNum < 1 || mesNum > 12) {
    return false;
  }

  // Valida dia
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Verifica ano bissexto
  const bissexto = (anoNum % 4 === 0 && anoNum % 100 !== 0) || (anoNum % 400 === 0);
  if (bissexto) {
    diasPorMes[1] = 29;
  }

  if (diaNum < 1 || diaNum > diasPorMes[mesNum - 1]) {
    return false;
  }

  // Valida ano (entre 1900 e 2100)
  if (anoNum < 1900 || anoNum > 2100) {
    return false;
  }

  return true;
}

export default {
  validarEmail,
  validarTelefone,
  validarCEP,
  formatarCEP,
  validarNomeCompleto,
  validarURL,
  validarSenhaForte,
  sanitizarString,
  validarData
};
