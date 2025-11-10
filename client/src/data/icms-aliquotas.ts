/**
 * Alíquotas de ICMS por Estado Brasileiro
 * Atualizado em 2025
 */

export interface EstadoICMS {
  uf: string;
  nome: string;
  aliquotaInterna: number; // % para produtos nacionais vendidos dentro do estado
  aliquotaInterestadual: number; // % para vendas interestaduais
}

export const ESTADOS_ICMS: EstadoICMS[] = [
  { uf: 'AC', nome: 'Acre', aliquotaInterna: 17, aliquotaInterestadual: 12 },
  { uf: 'AL', nome: 'Alagoas', aliquotaInterna: 18, aliquotaInterestadual: 12 },
  { uf: 'AP', nome: 'Amapá', aliquotaInterna: 18, aliquotaInterestadual: 12 },
  { uf: 'AM', nome: 'Amazonas', aliquotaInterna: 18, aliquotaInterestadual: 12 },
  { uf: 'BA', nome: 'Bahia', aliquotaInterna: 19, aliquotaInterestadual: 12 },
  { uf: 'CE', nome: 'Ceará', aliquotaInterna: 18, aliquotaInterestadual: 12 },
  { uf: 'DF', nome: 'Distrito Federal', aliquotaInterna: 18, aliquotaInterestadual: 12 },
  { uf: 'ES', nome: 'Espírito Santo', aliquotaInterna: 17, aliquotaInterestadual: 12 },
  { uf: 'GO', nome: 'Goiás', aliquotaInterna: 19, aliquotaInterestadual: 12 },
  { uf: 'MA', nome: 'Maranhão', aliquotaInterna: 20, aliquotaInterestadual: 12 },
  { uf: 'MT', nome: 'Mato Grosso', aliquotaInterna: 17, aliquotaInterestadual: 12 },
  { uf: 'MS', nome: 'Mato Grosso do Sul', aliquotaInterna: 17, aliquotaInterestadual: 12 },
  { uf: 'MG', nome: 'Minas Gerais', aliquotaInterna: 18, aliquotaInterestadual: 12 },
  { uf: 'PA', nome: 'Pará', aliquotaInterna: 19, aliquotaInterestadual: 12 },
  { uf: 'PB', nome: 'Paraíba', aliquotaInterna: 20, aliquotaInterestadual: 12 },
  { uf: 'PR', nome: 'Paraná', aliquotaInterna: 19, aliquotaInterestadual: 12 },
  { uf: 'PE', nome: 'Pernambuco', aliquotaInterna: 20.5, aliquotaInterestadual: 12 },
  { uf: 'PI', nome: 'Piauí', aliquotaInterna: 21, aliquotaInterestadual: 12 },
  { uf: 'RJ', nome: 'Rio de Janeiro', aliquotaInterna: 20, aliquotaInterestadual: 12 },
  { uf: 'RN', nome: 'Rio Grande do Norte', aliquotaInterna: 18, aliquotaInterestadual: 12 },
  { uf: 'RS', nome: 'Rio Grande do Sul', aliquotaInterna: 17, aliquotaInterestadual: 12 },
  { uf: 'RO', nome: 'Rondônia', aliquotaInterna: 17.5, aliquotaInterestadual: 12 },
  { uf: 'RR', nome: 'Roraima', aliquotaInterna: 20, aliquotaInterestadual: 12 },
  { uf: 'SC', nome: 'Santa Catarina', aliquotaInterna: 17, aliquotaInterestadual: 12 },
  { uf: 'SP', nome: 'São Paulo', aliquotaInterna: 18, aliquotaInterestadual: 12 },
  { uf: 'SE', nome: 'Sergipe', aliquotaInterna: 19, aliquotaInterestadual: 12 },
  { uf: 'TO', nome: 'Tocantins', aliquotaInterna: 20, aliquotaInterestadual: 12 },
];

export function getAliquotaICMS(uf: string): number {
  const estado = ESTADOS_ICMS.find(e => e.uf === uf);
  return estado ? estado.aliquotaInterna : 18; // Padrão 18%
}

export function getEstadoNome(uf: string): string {
  const estado = ESTADOS_ICMS.find(e => e.uf === uf);
  return estado ? estado.nome : '';
}

/**
 * Regimes Tributários Brasileiros
 */
export interface RegimeTributario {
  id: string;
  nome: string;
  descricao: string;
  aliquotaAproximada: number; // % aproximado de impostos sobre faturamento
}

export const REGIMES_TRIBUTARIOS: RegimeTributario[] = [
  {
    id: 'simples_nacional',
    nome: 'Simples Nacional',
    descricao: 'Regime simplificado para empresas com faturamento até R$ 4,8 milhões/ano',
    aliquotaAproximada: 6.5 // Varia de 4% a 19% conforme faixa e atividade
  },
  {
    id: 'lucro_presumido',
    nome: 'Lucro Presumido',
    descricao: 'Para empresas com faturamento até R$ 78 milhões/ano',
    aliquotaAproximada: 11.33 // IRPJ + CSLL + PIS + COFINS
  },
  {
    id: 'lucro_real',
    nome: 'Lucro Real',
    descricao: 'Obrigatório para empresas com faturamento acima de R$ 78 milhões/ano',
    aliquotaAproximada: 13.33 // Varia conforme lucro real
  }
];

export function getAliquotaRegime(regimeId: string): number {
  const regime = REGIMES_TRIBUTARIOS.find(r => r.id === regimeId);
  return regime ? regime.aliquotaAproximada : 6.5;
}

/**
 * Origem do Produto (para cálculo de impostos)
 */
export const ORIGEM_PRODUTO = {
  IMPORTADO: {
    id: 'importado',
    nome: 'Importado',
    aliquotaImpostoImportacao: 4 // II + IPI médio
  },
  NACIONAL: {
    id: 'nacional',
    nome: 'Nacional',
    aliquotaImpostoImportacao: 0
  }
};
