/**
 * Internal API Client para MarketHub CRM v2
 * Conecta-se ao backend local do sistema
 */

const API_BASE_URL = '/api';

/**
 * Função auxiliar para fazer requisições autenticadas
 */
async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ========== PRODUTOS ==========

export interface Produto {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock?: number;
  weight?: number;
  dimensions?: any;
  images?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getProdutos(params?: {
  categoria?: string;
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<Produto[]> {
  const queryParams = new URLSearchParams();
  if (params?.categoria) queryParams.append('categoria', params.categoria);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.search) queryParams.append('search', params.search);

  const query = queryParams.toString();
  return fetchAPI<Produto[]>(`/produtos${query ? `?${query}` : ''}`);
}

export async function getProdutoById(id: number): Promise<Produto> {
  return fetchAPI<Produto>(`/produtos/${id}`);
}

export async function createProduto(data: Partial<Produto>): Promise<Produto> {
  return fetchAPI<Produto>('/produtos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduto(id: number, data: Partial<Produto>): Promise<Produto> {
  return fetchAPI<Produto>(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduto(id: number): Promise<void> {
  return fetchAPI<void>(`/produtos/${id}`, {
    method: 'DELETE',
  });
}

// ========== PEDIDOS ==========

export interface Pedido {
  id: number;
  numero_pedido: string;
  cliente_nome: string;
  marketplace?: string;
  valor_total: number;
  status: string;
  data_pedido: string;
  data_entrega?: string;
  rastreio?: string;
  observacoes?: string;
  created_at: string;
}

export async function getPedidos(params?: {
  status?: string;
  marketplace?: string;
  limit?: number;
  offset?: number;
}): Promise<Pedido[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.marketplace) queryParams.append('marketplace', params.marketplace);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  return fetchAPI<Pedido[]>(`/pedidos${query ? `?${query}` : ''}`);
}

export async function getPedidoById(id: number): Promise<Pedido> {
  return fetchAPI<Pedido>(`/pedidos/${id}`);
}

export async function createPedido(data: Partial<Pedido>): Promise<Pedido> {
  return fetchAPI<Pedido>('/pedidos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePedido(id: number, data: Partial<Pedido>): Promise<Pedido> {
  return fetchAPI<Pedido>(`/pedidos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePedido(id: number): Promise<void> {
  return fetchAPI<void>(`/pedidos/${id}`, {
    method: 'DELETE',
  });
}

// ========== CLIENTES ==========

export interface Cliente {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone?: string;
  plano: string;
  status: string;
  faturamento_total: number;
  total_pedidos: number;
  total_produtos: number;
  created_at: string;
  updated_at: string;
}

export async function getClientes(): Promise<Cliente[]> {
  return fetchAPI<Cliente[]>('/clientes');
}

export async function getClienteById(id: number): Promise<Cliente> {
  return fetchAPI<Cliente>(`/clientes/${id}`);
}

export async function createCliente(data: Partial<Cliente>): Promise<Cliente> {
  return fetchAPI<Cliente>('/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCliente(id: number, data: Partial<Cliente>): Promise<Cliente> {
  return fetchAPI<Cliente>(`/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCliente(id: number): Promise<void> {
  return fetchAPI<void>(`/clientes/${id}`, {
    method: 'DELETE',
  });
}
