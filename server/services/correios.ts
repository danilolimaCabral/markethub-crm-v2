/**
 * Serviço de integração com API dos Correios
 * Documentação: https://www.correios.com.br/atendimento/developers
 */

import axios, { AxiosInstance } from 'axios';

interface CorreiosConfig {
  usuario: string;
  senha: string;
  cartaoPostagem: string;
  cnpj: string;
}

interface CalculoFreteParams {
  cepOrigem: string;
  cepDestino: string;
  peso: number; // em gramas
  formato: 1 | 2 | 3; // 1=caixa/pacote, 2=rolo/prisma, 3=envelope
  comprimento: number; // em cm
  altura: number; // em cm
  largura: number; // em cm
  diametro?: number; // em cm (apenas para formato 2)
  maoPropria?: 'S' | 'N';
  valorDeclarado?: number;
  avisoRecebimento?: 'S' | 'N';
}

interface RastreamentoResponse {
  codigo: string;
  eventos: Array<{
    data: string;
    hora: string;
    local: string;
    status: string;
    descricao: string;
  }>;
}

export class CorreiosService {
  private api: AxiosInstance;
  private config: CorreiosConfig;

  constructor(config: CorreiosConfig) {
    this.config = config;
    
    // API dos Correios (ambiente de produção)
    this.api = axios.create({
      baseURL: 'https://api.correios.com.br',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar autenticação
    this.api.interceptors.request.use((config) => {
      const token = Buffer.from(`${this.config.usuario}:${this.config.senha}`).toString('base64');
      config.headers.Authorization = `Basic ${token}`;
      return config;
    });
  }

  /**
   * Calcular frete para PAC e SEDEX
   */
  async calcularFrete(params: CalculoFreteParams) {
    try {
      const response = await this.api.post('/preco/v1/nacional', {
        idLote: Date.now().toString(),
        parametrosProduto: [
          {
            codigo: '04510', // PAC
            cepOrigem: params.cepOrigem,
            cepDestino: params.cepDestino,
            psObjeto: params.peso,
            tpObjeto: params.formato,
            comprimento: params.comprimento,
            largura: params.largura,
            altura: params.altura,
            diametro: params.diametro || 0,
            servicosAdicionais: [
              params.maoPropria === 'S' ? '001' : null,
              params.avisoRecebimento === 'S' ? '002' : null,
              params.valorDeclarado ? '019' : null,
            ].filter(Boolean),
            vlDeclarado: params.valorDeclarado || 0,
          },
          {
            codigo: '04014', // SEDEX
            cepOrigem: params.cepOrigem,
            cepDestino: params.cepDestino,
            psObjeto: params.peso,
            tpObjeto: params.formato,
            comprimento: params.comprimento,
            largura: params.largura,
            altura: params.altura,
            diametro: params.diametro || 0,
            servicosAdicionais: [
              params.maoPropria === 'S' ? '001' : null,
              params.avisoRecebimento === 'S' ? '002' : null,
              params.valorDeclarado ? '019' : null,
            ].filter(Boolean),
            vlDeclarado: params.valorDeclarado || 0,
          },
        ],
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao calcular frete Correios:', error.response?.data || error.message);
      throw new Error(`Erro ao calcular frete: ${error.response?.data?.mensagem || error.message}`);
    }
  }

  /**
   * Rastrear objeto pelos Correios
   */
  async rastrearObjeto(codigoRastreio: string): Promise<RastreamentoResponse> {
    try {
      const response = await this.api.get(`/srorastro/v1/objetos/${codigoRastreio}`);
      
      return {
        codigo: codigoRastreio,
        eventos: response.data.objetos[0]?.eventos?.map((evento: any) => ({
          data: evento.dtHrCriado.split('T')[0],
          hora: evento.dtHrCriado.split('T')[1]?.split('.')[0] || '',
          local: `${evento.unidade?.endereco?.cidade}/${evento.unidade?.endereco?.uf}`,
          status: evento.codigo,
          descricao: evento.descricao,
        })) || [],
      };
    } catch (error: any) {
      console.error('Erro ao rastrear objeto Correios:', error.response?.data || error.message);
      throw new Error(`Erro ao rastrear objeto: ${error.response?.data?.mensagem || error.message}`);
    }
  }

  /**
   * Gerar etiqueta de postagem
   */
  async gerarEtiqueta(quantidade: number = 1) {
    try {
      const response = await this.api.post('/prepostagem/v1/etiquetas', {
        usuario: this.config.usuario,
        qtdEtiquetas: quantidade,
        idServico: '04510', // PAC (pode ser alterado)
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao gerar etiqueta Correios:', error.response?.data || error.message);
      throw new Error(`Erro ao gerar etiqueta: ${error.response?.data?.mensagem || error.message}`);
    }
  }

  /**
   * Verificar disponibilidade de serviço
   */
  async verificarDisponibilidade(cepOrigem: string, cepDestino: string) {
    try {
      const response = await this.api.get('/cep/v2/consulta', {
        params: {
          cepOrigem,
          cepDestino,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao verificar disponibilidade Correios:', error.response?.data || error.message);
      throw new Error(`Erro ao verificar disponibilidade: ${error.response?.data?.mensagem || error.message}`);
    }
  }

  /**
   * Testar conexão com API
   */
  async testarConexao(): Promise<boolean> {
    try {
      // Tenta fazer uma consulta simples para verificar autenticação
      await this.api.get('/token/v1/autentica');
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão Correios:', error);
      return false;
    }
  }
}

export default CorreiosService;
