import { getValidAccessToken, getIntegrationKey, isAPIConfigured } from './api-config';

/**
 * MarketHub CRM API Configuration
 */
const MARKETHUB_API_BASE_URL = 'https://api.example.com';

export interface MarketHubAPIError {
  message: string;
  status: number;
  details?: any;
}

/**
 * Make authenticated request to MarketHub CRM API
 */
export async function callMarketHubAPI<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Check if API is configured
  if (!isAPIConfigured()) {
    throw new Error('API not configured. Please configure API credentials in Settings.');
  }

  // Get valid access token and integration key
  const accessToken = getValidAccessToken();
  const integrationKey = getIntegrationKey();
  
  if (!accessToken || !integrationKey) {
    throw new Error('Invalid API configuration.');
  }

  // Build full URL
  const url = `${MARKETHUB_API_BASE_URL}${endpoint}`;

  // Merge headers
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Chave': integrationKey,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error: MarketHubAPIError = {
        message: `API request failed: ${response.statusText}`,
        status: response.status,
        details: errorText,
      };
      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error('External API Error:', error);
    throw error;
  }
}

/**
 * API Methods for MarketHub CRM
 */

// ========== PEDIDOS (Orders) ==========

export interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  valor: number;
  status: string;
  dataCriacao: string;
  marketplace?: string;
}

export async function getPedidos(params?: {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  limit?: number;
}): Promise<Pedido[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.dataInicio) queryParams.append('dataInicio', params.dataInicio);
  if (params?.dataFim) queryParams.append('dataFim', params.dataFim);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  const endpoint = `/Pedido/ObterLista${query ? `?${query}` : ''}`;
  
  return callMarketHubAPI<Pedido[]>(endpoint);
}

export async function getPedidoById(id: string): Promise<Pedido> {
  return callMarketHubAPI<Pedido>(`/Pedido/Obter/${id}`);
}

// ========== PRODUTOS (Products) ==========

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  preco: number;
  estoque: number;
  categoria?: string;
  ativo: boolean;
}

export async function getProdutos(params?: {
  categoria?: string;
  ativo?: boolean;
  limit?: number;
}): Promise<Produto[]> {
  const queryParams = new URLSearchParams();
  if (params?.categoria) queryParams.append('categoria', params.categoria);
  if (params?.ativo !== undefined) queryParams.append('ativo', params.ativo.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  const endpoint = `/Catalogo/ObterLista${query ? `?${query}` : ''}`;
  
  return callMarketHubAPI<Produto[]>(endpoint);
}

export async function getProdutoById(id: string): Promise<Produto> {
  return callMarketHubAPI<Produto>(`/Catalogo/Obter/${id}`);
}

// ========== ANÚNCIOS (Listings) ==========

export interface Anuncio {
  id: string;
  titulo: string;
  produtoId: string;
  marketplace: string;
  preco: number;
  status: string;
  estoque: number;
}

export async function getAnuncios(params?: {
  marketplace?: string;
  status?: string;
  limit?: number;
}): Promise<Anuncio[]> {
  const queryParams = new URLSearchParams();
  if (params?.marketplace) queryParams.append('marketplace', params.marketplace);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  const endpoint = `/Anuncio/ObterLista${query ? `?${query}` : ''}`;
  
  return callMarketHubAPI<Anuncio[]>(endpoint);
}

// ========== ENTREGAS (Deliveries) ==========

export interface Entrega {
  id: string;
  pedidoId: string;
  rastreio: string;
  status: string;
  dataEnvio?: string;
  dataEntrega?: string;
}

export async function getEntregas(params?: {
  status?: string;
  limit?: number;
}): Promise<Entrega[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  const endpoint = `/Entrega/ObterLista${query ? `?${query}` : ''}`;
  
  return callMarketHubAPI<Entrega[]>(endpoint);
}

// ========== LOJAS (Stores) ==========

export interface Loja {
  id: string;
  nome: string;
  marketplace: string;
  ativa: boolean;
}

export async function getLojas(): Promise<Loja[]> {
  return callMarketHubAPI<Loja[]>('/Loja/ObterLista');
}

// ========== DASHBOARD / METRICS ==========

export interface DashboardMetrics {
  totalPedidos: number;
  totalFaturamento: number;
  ticketMedio: number;
  pedidosPendentes: number;
  produtosAtivos: number;
  anunciosAtivos: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // This might need to be constructed from multiple API calls
  // or use a specific dashboard endpoint if available
  const pedidos = await getPedidos({ limit: 1000 });
  
  const totalPedidos = pedidos.length;
  const totalFaturamento = pedidos.reduce((sum, p) => sum + p.valor, 0);
  const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;

  return {
    totalPedidos,
    totalFaturamento,
    ticketMedio,
    pedidosPendentes,
    produtosAtivos: 0, // Will be populated when we fetch products
    anunciosAtivos: 0, // Will be populated when we fetch listings
  };
}
