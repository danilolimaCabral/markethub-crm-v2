/**
 * Serviço de integração com PagBank (PagSeguro) API
 * Documentação: https://developer.pagbank.com.br/
 */

import axios, { AxiosInstance } from 'axios';

interface PagBankConfig {
  token: string;
  sandbox?: boolean;
}

interface ChargeParams {
  referenceId: string;
  description: string;
  amount: {
    value: number; // em centavos
    currency: 'BRL';
  };
  paymentMethod: {
    type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'PIX';
    card?: {
      number: string;
      expMonth: string;
      expYear: string;
      securityCode: string;
      holder: {
        name: string;
      };
    };
  };
  customer: {
    name: string;
    email: string;
    taxId: string; // CPF ou CNPJ
    phones: Array<{
      country: string;
      area: string;
      number: string;
      type: 'MOBILE' | 'HOME' | 'BUSINESS';
    }>;
  };
  billingAddress?: {
    street: string;
    number: string;
    complement?: string;
    locality: string;
    city: string;
    regionCode: string;
    country: string;
    postalCode: string;
  };
}

interface RecurrenceParams {
  referenceId: string;
  description: string;
  amount: {
    value: number;
    currency: 'BRL';
  };
  interval: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  customer: {
    name: string;
    email: string;
    taxId: string;
  };
  paymentMethod: {
    type: 'CREDIT_CARD';
    card: {
      number: string;
      expMonth: string;
      expYear: string;
      securityCode: string;
      holder: {
        name: string;
      };
    };
  };
}

export class PagBankService {
  private api: AxiosInstance;
  private config: PagBankConfig;

  constructor(config: PagBankConfig) {
    this.config = config;
    
    const baseURL = config.sandbox
      ? 'https://sandbox.api.pagbank.com'
      : 'https://api.pagbank.com';

    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
    });
  }

  /**
   * Criar cobrança (pagamento único)
   */
  async criarCobranca(params: ChargeParams) {
    try {
      const response = await this.api.post('/charges', params);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar cobrança PagBank:', error.response?.data || error.message);
      throw new Error(`Erro ao criar cobrança: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Consultar cobrança
   */
  async consultarCobranca(chargeId: string) {
    try {
      const response = await this.api.get(`/charges/${chargeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao consultar cobrança PagBank:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar cobrança: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Cancelar cobrança
   */
  async cancelarCobranca(chargeId: string) {
    try {
      const response = await this.api.post(`/charges/${chargeId}/cancel`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao cancelar cobrança PagBank:', error.response?.data || error.message);
      throw new Error(`Erro ao cancelar cobrança: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Criar cobrança recorrente (assinatura)
   */
  async criarRecorrencia(params: RecurrenceParams) {
    try {
      const response = await this.api.post('/subscriptions', params);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar recorrência PagBank:', error.response?.data || error.message);
      throw new Error(`Erro ao criar recorrência: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Consultar assinatura
   */
  async consultarAssinatura(subscriptionId: string) {
    try {
      const response = await this.api.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao consultar assinatura PagBank:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar assinatura: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelarAssinatura(subscriptionId: string) {
    try {
      const response = await this.api.post(`/subscriptions/${subscriptionId}/cancel`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao cancelar assinatura PagBank:', error.response?.data || error.message);
      throw new Error(`Erro ao cancelar assinatura: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Gerar QR Code PIX
   */
  async gerarQRCodePix(amount: number, description: string) {
    try {
      const response = await this.api.post('/pix/qrcodes', {
        reference_id: `PIX-${Date.now()}`,
        description,
        amount: {
          value: amount,
          currency: 'BRL',
        },
        expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao gerar QR Code PIX:', error.response?.data || error.message);
      throw new Error(`Erro ao gerar QR Code PIX: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Consultar transação PIX
   */
  async consultarTransacaoPix(txid: string) {
    try {
      const response = await this.api.get(`/pix/${txid}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao consultar transação PIX:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar transação PIX: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Listar transações
   */
  async listarTransacoes(startDate: string, endDate: string, page: number = 1, limit: number = 50) {
    try {
      const response = await this.api.get('/charges', {
        params: {
          created_date_range: `${startDate} TO ${endDate}`,
          page,
          limit,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao listar transações PagBank:', error.response?.data || error.message);
      throw new Error(`Erro ao listar transações: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Consultar saldo
   */
  async consultarSaldo() {
    try {
      const response = await this.api.get('/accounts/balance');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao consultar saldo PagBank:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar saldo: ${error.response?.data?.error_messages?.[0]?.description || error.message}`);
    }
  }

  /**
   * Testar conexão
   */
  async testarConexao(): Promise<boolean> {
    try {
      await this.consultarSaldo();
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão PagBank:', error);
      return false;
    }
  }
}

export default PagBankService;
