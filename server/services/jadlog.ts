/**
 * Serviço de integração com API da Jadlog
 * Documentação: https://integracoes.jadlog.com.br/integracao-por-api/
 */

import axios, { AxiosInstance } from 'axios';

interface JadlogConfig {
  token: string;
  cnpj: string;
  contrato: string;
}

interface CotacaoParams {
  cepOrigem: string;
  cepDestino: string;
  peso: number; // em kg
  valorDeclarado?: number;
  modalidade: '0' | '3' | '4' | '5' | '6' | '7' | '9' | '10' | '12' | '14' | '17' | '40' | '46' | '54' | '57' | '64' | '65' | '67' | '69';
  // 0=Rodoviário, 3=Econômico, 4=DOC, 5=.COM, 6=Corporate, 7=Cargo, 9=.Package, 10=Internacional, 12=Cargo Economy, 14=Emergencial, 17=Pickup
}

interface PedidoParams {
  cepOrigem: string;
  cepDestino: string;
  peso: number;
  volumes: number;
  valorDeclarado: number;
  destinatario: {
    nome: string;
    cpfCnpj: string;
    endereco: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    telefone: string;
    email: string;
  };
  modalidade: string;
  observacao?: string;
}

export class JadlogService {
  private api: AxiosInstance;
  private config: JadlogConfig;

  constructor(config: JadlogConfig) {
    this.config = config;
    
    // API da Jadlog (ambiente de produção)
    this.api = axios.create({
      baseURL: 'https://api.jadlog.com.br',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
    });
  }

  /**
   * Obter token de autenticação
   */
  static async obterToken(cnpj: string, senha: string): Promise<string> {
    try {
      const response = await axios.post('https://api.jadlog.com.br/auth/login', {
        cnpj,
        senha,
      });

      return response.data.token;
    } catch (error: any) {
      console.error('Erro ao obter token Jadlog:', error.response?.data || error.message);
      throw new Error(`Erro ao autenticar: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Calcular frete
   */
  async calcularFrete(params: CotacaoParams) {
    try {
      const response = await this.api.post('/cotacao/v1/consultar', {
        frete: [{
          cepori: params.cepOrigem,
          cepdes: params.cepDestino,
          peso: params.peso,
          vlrdec: params.valorDeclarado || 0,
          modal: params.modalidade,
          conta: this.config.contrato,
          cnpj: this.config.cnpj,
        }],
      });

      return response.data.frete[0];
    } catch (error: any) {
      console.error('Erro ao calcular frete Jadlog:', error.response?.data || error.message);
      throw new Error(`Erro ao calcular frete: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Criar pedido de coleta
   */
  async criarPedido(params: PedidoParams) {
    try {
      const response = await this.api.post('/embarque/v1/incluir', {
        pedido: [{
          conta: this.config.contrato,
          cnpj: this.config.cnpj,
          cepori: params.cepOrigem,
          cepdes: params.cepDestino,
          peso: params.peso,
          qtdvolume: params.volumes,
          vlrdec: params.valorDeclarado,
          modal: params.modalidade,
          tpentrega: 'D', // Delivery
          tpseguro: 'N', // Sem seguro adicional
          obs: params.observacao || '',
          rem: {
            nome: 'Remetente', // Deve vir do cadastro da empresa
            cnpjcpf: this.config.cnpj,
          },
          dest: {
            nome: params.destinatario.nome,
            cnpjcpf: params.destinatario.cpfCnpj,
            ie: '',
            endereco: params.destinatario.endereco,
            numero: params.destinatario.numero,
            compl: params.destinatario.complemento || '',
            bairro: params.destinatario.bairro,
            cidade: params.destinatario.cidade,
            uf: params.destinatario.uf,
            cep: params.destinatario.cep,
            telefone: params.destinatario.telefone,
            email: params.destinatario.email,
          },
        }],
      });

      return response.data.pedido[0];
    } catch (error: any) {
      console.error('Erro ao criar pedido Jadlog:', error.response?.data || error.message);
      throw new Error(`Erro ao criar pedido: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Rastrear pedido
   */
  async rastrearPedido(numeroEmbarque: string) {
    try {
      const response = await this.api.post('/tracking/v1/consultar', {
        consulta: [{
          df: numeroEmbarque,
        }],
      });

      return response.data.tracking[0];
    } catch (error: any) {
      console.error('Erro ao rastrear pedido Jadlog:', error.response?.data || error.message);
      throw new Error(`Erro ao rastrear pedido: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cancelar pedido
   */
  async cancelarPedido(numeroEmbarque: string) {
    try {
      const response = await this.api.post('/embarque/v1/cancelar', {
        pedido: [{
          df: numeroEmbarque,
          conta: this.config.contrato,
          cnpj: this.config.cnpj,
        }],
      });

      return response.data.pedido[0];
    } catch (error: any) {
      console.error('Erro ao cancelar pedido Jadlog:', error.response?.data || error.message);
      throw new Error(`Erro ao cancelar pedido: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Consultar modalidades disponíveis
   */
  async consultarModalidades() {
    try {
      const response = await this.api.get('/modalidade/v1/consultar', {
        params: {
          conta: this.config.contrato,
          cnpj: this.config.cnpj,
        },
      });

      return response.data.modalidades;
    } catch (error: any) {
      console.error('Erro ao consultar modalidades Jadlog:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar modalidades: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Testar conexão com API
   */
  async testarConexao(): Promise<boolean> {
    try {
      // Tenta consultar modalidades para verificar autenticação
      await this.consultarModalidades();
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão Jadlog:', error);
      return false;
    }
  }
}

export default JadlogService;
