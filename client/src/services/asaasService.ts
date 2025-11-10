/**
 * Serviço de Integração com API Asaas
 * Gateway de Pagamentos para Assinaturas Recorrentes
 */

const ASAAS_API_URL = import.meta.env.VITE_ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = import.meta.env.VITE_ASAAS_API_KEY || '';
const SIMULATION_MODE = !ASAAS_API_KEY || ASAAS_API_KEY === ''; // Modo simulação se não houver API key

interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
}

interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}

interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  netValue: number;
  status: string;
  billingType: string;
  confirmedDate?: string;
  paymentDate?: string;
  creditDate?: string;
}

class AsaasService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = ASAAS_API_URL;
    this.apiKey = ASAAS_API_KEY;
  }

  /**
   * Fazer requisição para API Asaas (ou simular)
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    // MODO SIMULAÇÃO: Retornar dados mockados
    if (SIMULATION_MODE) {
      console.log('🔧 MODO SIMULAÇÃO ATIVO - Dados mockados');
      return this.simulateRequest<T>(endpoint, method, data);
    }

    // MODO REAL: Fazer requisição real para API Asaas
    const url = `${this.apiUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey,
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.description || 'Erro na requisição Asaas');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro Asaas:', error);
      throw error;
    }
  }

  /**
   * Simular requisição (modo sem API key)
   */
  private async simulateRequest<T>(endpoint: string, method: string, data?: any): Promise<T> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    const randomId = () => Math.random().toString(36).substr(2, 9);

    // Simular criação de cliente
    if (endpoint === '/customers' && method === 'POST') {
      return {
        id: `cus_sim_${randomId()}`,
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj,
        phone: data.phone,
      } as T;
    }

    // Simular criação de assinatura
    if (endpoint === '/subscriptions' && method === 'POST') {
      return {
        id: `sub_sim_${randomId()}`,
        customer: data.customer,
        billingType: data.billingType,
        value: data.value,
        nextDueDate: data.nextDueDate,
        cycle: data.cycle,
        description: data.description,
        externalReference: data.externalReference,
        status: 'ACTIVE',
      } as T;
    }

    // Simular busca de assinatura
    if (endpoint.startsWith('/subscriptions/') && method === 'GET') {
      return {
        id: endpoint.split('/')[2],
        status: 'ACTIVE',
        value: 49.90,
        cycle: 'MONTHLY',
      } as T;
    }

    // Simular busca de pagamento
    if (endpoint.startsWith('/payments/') && method === 'GET') {
      return {
        id: endpoint.split('/')[2],
        status: 'RECEIVED',
        value: 49.90,
        netValue: 46.07,
      } as T;
    }

    // Retornar objeto vazio para outras requisições
    return {} as T;
  }

  /**
   * Criar cliente no Asaas
   */
  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('/customers', 'POST', customerData);
  }

  /**
   * Buscar cliente por ID
   */
  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>(`/customers/${customerId}`);
  }

  /**
   * Criar assinatura recorrente
   */
  async createSubscription(subscriptionData: AsaasSubscription): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('/subscriptions', 'POST', subscriptionData);
  }

  /**
   * Buscar assinatura por ID
   */
  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Listar assinaturas de um cliente
   */
  async listSubscriptions(customerId: string): Promise<{ data: AsaasSubscription[] }> {
    return this.request<{ data: AsaasSubscription[] }>(`/subscriptions?customer=${customerId}`);
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    return this.request<void>(`/subscriptions/${subscriptionId}`, 'DELETE');
  }

  /**
   * Buscar pagamento por ID
   */
  async getPayment(paymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(`/payments/${paymentId}`);
  }

  /**
   * Listar pagamentos de um cliente
   */
  async listPayments(customerId: string): Promise<{ data: AsaasPayment[] }> {
    return this.request<{ data: AsaasPayment[] }>(`/payments?customer=${customerId}`);
  }

  /**
   * Criar assinatura com trial de 14 dias
   */
  async createSubscriptionWithTrial(
    customer: AsaasCustomer,
    plan: { name: string; value: number }
  ): Promise<{ customer: AsaasCustomer; subscription: AsaasSubscription }> {
    // 1. Criar cliente no Asaas
    const asaasCustomer = await this.createCustomer(customer);

    // 2. Calcular data de vencimento (14 dias de trial)
    const trialDays = 14;
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + trialDays);
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

    // 3. Criar assinatura
    const subscription = await this.createSubscription({
      customer: asaasCustomer.id!,
      billingType: 'CREDIT_CARD',
      value: plan.value,
      nextDueDate: nextDueDateStr,
      cycle: 'MONTHLY',
      description: `MarketHub CRM - ${plan.name}`,
      externalReference: customer.email, // Usar email como referência
    });

    return {
      customer: asaasCustomer,
      subscription,
    };
  }
}

// Exportar instância única
export const asaasService = new AsaasService();

// Exportar tipos
export type {
  AsaasCustomer,
  AsaasSubscription,
  AsaasPayment,
};
