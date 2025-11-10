// Taxas e Comissões do Mercado Livre - Atualizado 2025

export type ListingType = 'classico' | 'premium';
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card' | 'credit_card_installments';

export interface MLCategory {
  id: string;
  name: string;
  classicoFee: number; // Percentual (ex: 0.11 para 11%)
  premiumFee: number;
}

export interface MLFixedCost {
  minPrice: number;
  maxPrice: number;
  cost: number | 'percentage'; // R$ fixo ou 'percentage' para 50%
  percentage?: number; // Usado quando cost = 'percentage'
}

export interface MLPaymentFee {
  method: PaymentMethod;
  fee: number; // Percentual
  additionalFeePerInstallment?: number; // Taxa adicional por parcela
}

export interface MLShippingCost {
  weightMin: number; // gramas
  weightMax: number; // gramas
  costRegular: number; // R$
  costMercadoLider: number; // R$ com desconto
}

// ========== CATEGORIAS E COMISSÕES ==========

export const ML_CATEGORIES: MLCategory[] = [
  // Comissão mais baixa (10% / 15%)
  { id: 'MLB1196', name: 'Livros, Revistas e Comics', classicoFee: 0.10, premiumFee: 0.15 },
  { id: 'MLB1403', name: 'Supermercado', classicoFee: 0.10, premiumFee: 0.15 },
  
  // Comissão baixa (11% / 16%)
  { id: 'MLB1000', name: 'Eletrônicos, Áudio e Vídeo', classicoFee: 0.11, premiumFee: 0.16 },
  { id: 'MLB1648', name: 'Informática', classicoFee: 0.11, premiumFee: 0.16 },
  { id: 'MLB1051', name: 'Celulares e Telefones', classicoFee: 0.11, premiumFee: 0.16 },
  { id: 'MLB1144', name: 'Consoles e Videogames', classicoFee: 0.11, premiumFee: 0.16 },
  { id: 'MLB1367', name: 'Câmeras e Acessórios', classicoFee: 0.11, premiumFee: 0.16 },
  
  // Comissão média (12% / 17%)
  { id: 'MLB1574', name: 'Casa, Móveis e Decoração', classicoFee: 0.12, premiumFee: 0.17 },
  { id: 'MLB1499', name: 'Construção', classicoFee: 0.12, premiumFee: 0.17 },
  { id: 'MLB1276', name: 'Esportes e Fitness', classicoFee: 0.12, premiumFee: 0.17 },
  { id: 'MLB1132', name: 'Brinquedos e Hobbies', classicoFee: 0.12, premiumFee: 0.17 },
  { id: 'MLB1168', name: 'Música, Filmes e Seriados', classicoFee: 0.12, premiumFee: 0.17 },
  { id: 'MLB1430', name: 'Ferramentas', classicoFee: 0.12, premiumFee: 0.17 },
  { id: 'MLB1459', name: 'Indústria e Comércio', classicoFee: 0.12, premiumFee: 0.17 },
  { id: 'MLB1540', name: 'Serviços', classicoFee: 0.12, premiumFee: 0.17 },
  
  // Comissão média-alta (13% / 18%)
  { id: 'MLB1246', name: 'Beleza e Cuidado Pessoal', classicoFee: 0.13, premiumFee: 0.18 },
  { id: 'MLB1430', name: 'Saúde', classicoFee: 0.13, premiumFee: 0.18 },
  { id: 'MLB1071', name: 'Animais', classicoFee: 0.13, premiumFee: 0.18 },
  { id: 'MLB1039', name: 'Câmeras e Acessórios', classicoFee: 0.13, premiumFee: 0.18 },
  { id: 'MLB1953', name: 'Moda', classicoFee: 0.13, premiumFee: 0.18 },
  { id: 'MLB1430', name: 'Calçados, Roupas e Bolsas', classicoFee: 0.13, premiumFee: 0.18 },
  { id: 'MLB1384', name: 'Bebês', classicoFee: 0.13, premiumFee: 0.18 },
  
  // Comissão alta (14% / 19%)
  { id: 'MLB1158', name: 'Acessórios para Veículos', classicoFee: 0.14, premiumFee: 0.19 },
  { id: 'MLB1743', name: 'Carros, Motos e Outros', classicoFee: 0.14, premiumFee: 0.19 },
  { id: 'MLB3937', name: 'Joias e Relógios', classicoFee: 0.14, premiumFee: 0.19 },
  { id: 'MLB1182', name: 'Antiguidades e Coleções', classicoFee: 0.14, premiumFee: 0.19 },
  { id: 'MLB1953', name: 'Arte, Papelaria e Armarinho', classicoFee: 0.14, premiumFee: 0.19 },
  
  // Categoria genérica (padrão)
  { id: 'MLB_DEFAULT', name: 'Outras Categorias', classicoFee: 0.12, premiumFee: 0.17 },
];

// ========== CUSTOS FIXOS POR FAIXA DE PREÇO ==========

export const ML_FIXED_COSTS: MLFixedCost[] = [
  // Produtos até R$ 12,50: 50% do valor
  {
    minPrice: 0,
    maxPrice: 12.50,
    cost: 'percentage',
    percentage: 0.50,
  },
  // R$ 12,50 a R$ 29,00: R$ 3,00
  {
    minPrice: 12.50,
    maxPrice: 29.00,
    cost: 3.00,
  },
  // R$ 29,00 a R$ 50,00: R$ 3,50
  {
    minPrice: 29.00,
    maxPrice: 50.00,
    cost: 3.50,
  },
  // R$ 50,00 a R$ 79,00: R$ 4,00
  {
    minPrice: 50.00,
    maxPrice: 79.00,
    cost: 4.00,
  },
  // Acima de R$ 79,00: sem custo fixo
  {
    minPrice: 79.00,
    maxPrice: Infinity,
    cost: 0,
  },
];

// ========== TAXAS DE PAGAMENTO (MERCADO PAGO) ==========

export const ML_PAYMENT_FEES: MLPaymentFee[] = [
  {
    method: 'pix',
    fee: 0.0099, // 0,99%
  },
  {
    method: 'boleto',
    fee: 0.0349, // 3,49%
  },
  {
    method: 'credit_card',
    fee: 0.0499, // 4,99%
  },
  {
    method: 'credit_card_installments',
    fee: 0.0499, // 4,99% base
    additionalFeePerInstallment: 0.03, // 3% adicional por parcela acima de 6x
  },
];

// ========== CUSTOS DE FRETE (MERCADO ENVIOS) ==========

export const ML_SHIPPING_COSTS: MLShippingCost[] = [
  { weightMin: 0, weightMax: 300, costRegular: 15.00, costMercadoLider: 10.50 },
  { weightMin: 300, weightMax: 500, costRegular: 18.00, costMercadoLider: 12.87 },
  { weightMin: 500, weightMax: 1000, costRegular: 22.00, costMercadoLider: 15.40 },
  { weightMin: 1000, weightMax: 2000, costRegular: 28.00, costMercadoLider: 19.60 },
  { weightMin: 2000, weightMax: 5000, costRegular: 35.00, costMercadoLider: 24.50 },
  { weightMin: 5000, weightMax: 10000, costRegular: 45.00, costMercadoLider: 31.50 },
  { weightMin: 10000, weightMax: 20000, costRegular: 60.00, costMercadoLider: 42.00 },
  { weightMin: 20000, weightMax: 30000, costRegular: 80.00, costMercadoLider: 56.00 },
];

// ========== FUNÇÕES DE CÁLCULO ==========

/**
 * Obtém a comissão da categoria
 */
export function getCategoryFee(categoryId: string, listingType: ListingType): number {
  const category = ML_CATEGORIES.find(c => c.id === categoryId) || 
                   ML_CATEGORIES.find(c => c.id === 'MLB_DEFAULT')!;
  
  return listingType === 'classico' ? category.classicoFee : category.premiumFee;
}

/**
 * Calcula o custo fixo baseado no preço do produto
 */
export function getFixedCost(price: number): number {
  const range = ML_FIXED_COSTS.find(r => price >= r.minPrice && price < r.maxPrice);
  
  if (!range) return 0;
  
  if (range.cost === 'percentage' && range.percentage) {
    return price * range.percentage;
  }
  
  return range.cost as number;
}

/**
 * Calcula a taxa de pagamento
 */
export function getPaymentFee(
  price: number, 
  method: PaymentMethod, 
  installments: number = 1
): number {
  const paymentFee = ML_PAYMENT_FEES.find(f => f.method === method);
  
  if (!paymentFee) return 0;
  
  let totalFee = price * paymentFee.fee;
  
  // Taxa adicional para parcelamento acima de 6x
  if (method === 'credit_card_installments' && installments > 6 && paymentFee.additionalFeePerInstallment) {
    const additionalInstallments = installments - 6;
    totalFee += price * paymentFee.additionalFeePerInstallment * additionalInstallments;
  }
  
  return totalFee;
}

/**
 * Calcula o custo de frete
 */
export function getShippingCost(weightGrams: number, isMercadoLider: boolean = false): number {
  const range = ML_SHIPPING_COSTS.find(r => weightGrams >= r.weightMin && weightGrams < r.weightMax);
  
  if (!range) {
    // Peso acima de 30kg, retorna custo estimado
    return isMercadoLider ? 70.00 : 100.00;
  }
  
  return isMercadoLider ? range.costMercadoLider : range.costRegular;
}

/**
 * Calcula todas as taxas do Mercado Livre
 */
export interface MLFeesCalculation {
  salePrice: number;
  categoryFee: number;
  fixedCost: number;
  paymentFee: number;
  shippingCost: number;
  totalFees: number;
  netRevenue: number;
  netMarginPercentage: number;
}

export function calculateMLFees(params: {
  salePrice: number;
  categoryId: string;
  listingType: ListingType;
  paymentMethod: PaymentMethod;
  installments?: number;
  weightGrams: number;
  isMercadoLider?: boolean;
  offerFreeShipping?: boolean;
}): MLFeesCalculation {
  const {
    salePrice,
    categoryId,
    listingType,
    paymentMethod,
    installments = 1,
    weightGrams,
    isMercadoLider = false,
    offerFreeShipping = false,
  } = params;
  
  // 1. Comissão da categoria
  const categoryFeeRate = getCategoryFee(categoryId, listingType);
  const categoryFee = salePrice * categoryFeeRate;
  
  // 2. Custo fixo
  const fixedCost = getFixedCost(salePrice);
  
  // 3. Taxa de pagamento
  const paymentFee = getPaymentFee(salePrice, paymentMethod, installments);
  
  // 4. Custo de frete
  let shippingCost = getShippingCost(weightGrams, isMercadoLider);
  
  // Se oferece frete grátis, o vendedor paga
  if (!offerFreeShipping) {
    shippingCost = 0; // Comprador paga
  }
  
  // Total de taxas
  const totalFees = categoryFee + fixedCost + paymentFee + shippingCost;
  
  // Receita líquida
  const netRevenue = salePrice - totalFees;
  
  // Margem líquida percentual
  const netMarginPercentage = (netRevenue / salePrice) * 100;
  
  return {
    salePrice,
    categoryFee,
    fixedCost,
    paymentFee,
    shippingCost,
    totalFees,
    netRevenue,
    netMarginPercentage,
  };
}

/**
 * Calcula o preço de venda necessário para atingir uma margem desejada
 */
export function calculateRequiredPrice(params: {
  costPrice: number;
  desiredMarginPercentage: number;
  categoryId: string;
  listingType: ListingType;
  paymentMethod: PaymentMethod;
  installments?: number;
  weightGrams: number;
  isMercadoLider?: boolean;
  offerFreeShipping?: boolean;
}): number {
  const {
    costPrice,
    desiredMarginPercentage,
    categoryId,
    listingType,
    paymentMethod,
    installments = 1,
    weightGrams,
    isMercadoLider = false,
    offerFreeShipping = false,
  } = params;
  
  // Iteração para encontrar o preço ideal
  let salePrice = costPrice * 2; // Chute inicial
  let iterations = 0;
  const maxIterations = 100;
  
  while (iterations < maxIterations) {
    const fees = calculateMLFees({
      salePrice,
      categoryId,
      listingType,
      paymentMethod,
      installments,
      weightGrams,
      isMercadoLider,
      offerFreeShipping,
    });
    
    const actualMargin = ((fees.netRevenue - costPrice) / fees.netRevenue) * 100;
    
    // Se margem está próxima do desejado (±0.5%), retorna
    if (Math.abs(actualMargin - desiredMarginPercentage) < 0.5) {
      return salePrice;
    }
    
    // Ajusta o preço
    if (actualMargin < desiredMarginPercentage) {
      salePrice *= 1.05; // Aumenta 5%
    } else {
      salePrice *= 0.98; // Diminui 2%
    }
    
    iterations++;
  }
  
  return salePrice;
}
