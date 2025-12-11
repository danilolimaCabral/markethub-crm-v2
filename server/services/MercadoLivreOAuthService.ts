import axios, { AxiosError } from 'axios';
import { query } from '../db';
import { cache } from '../utils/cache';
import { MercadoLivreIntegration } from '../models/MercadoLivreIntegration';

const ML_API_BASE = 'https://api.mercadolibre.com';
const ML_AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';

// Credenciais - DEVEM ser configuradas nas variáveis de ambiente
const ML_CLIENT_ID = process.env.ML_CLIENT_ID || '';
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET || '';
const ML_REDIRECT_URI = process.env.ML_REDIRECT_URI || 'http://localhost:3000/api/integrations/mercadolivre/callback';

// Validar configuração na inicialização
if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
  console.warn('⚠️  Mercado Livre não configurado. Configure ML_CLIENT_ID e ML_CLIENT_SECRET no .env');
}

interface MLTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
  token_type: string;
  scope: string;
}

interface MLUserInfo {
  id: number;
  nickname: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  permalink?: string;
  registration_date?: string;
  country_id?: string;
  address?: any;
  phone?: any;
  seller_reputation?: any;
}

class MercadoLivreOAuthService {
  /**
   * Gera URL de autorização do Mercado Livre
   */
  static getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: ML_CLIENT_ID,
      redirect_uri: ML_REDIRECT_URI,
      state: state,
    });

    return `${ML_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Troca o código de autorização por access token
   */
  static async exchangeCodeForToken(code: string): Promise<MLTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code: code,
        redirect_uri: ML_REDIRECT_URI,
      });

      const response = await axios.post<MLTokenResponse>(
        `${ML_API_BASE}/oauth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('✅ Token obtido com sucesso:', {
        user_id: response.data.user_id,
        expires_in: response.data.expires_in,
        scope: response.data.scope,
      });

      return response.data;
    } catch (error: any) {
      const axiosError = error as AxiosError;
      console.error('❌ Erro ao trocar código por token:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      
      if (axiosError.response?.status === 400) {
        throw new Error('Código de autorização inválido ou expirado');
      }
      
      throw new Error('Falha na autenticação com Mercado Livre');
    }
  }

  /**
   * Renova o access token usando refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    try {
      const response = await axios.post(`${ML_API_BASE}/oauth/token`, {
        grant_type: 'refresh_token',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        refresh_token: refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('Erro ao renovar token:', error.response?.data || error.message);
      throw new Error('Falha ao renovar token do Mercado Livre');
    }
  }

  /**
   * Verifica se o token está expirado e renova se necessário
   */
  static async ensureValidToken(integration: MercadoLivreIntegration): Promise<string> {
    const now = new Date();
    const expiresAt = new Date(integration.tokenExpiresAt);

    // Se o token expira em menos de 1 hora, renova
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (expiresAt <= oneHourFromNow) {
      const tokenData = await this.refreshAccessToken(integration.refreshToken);

      // Atualiza o token no banco
      const newExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);
      await integration.update({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: newExpiresAt,
      });

      return tokenData.access_token;
    }

    return integration.accessToken;
  }

  /**
   * Obtém informações do usuário do Mercado Livre
   */
  static async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${ML_API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao obter informações do usuário:', error.response?.data || error.message);
      throw new Error('Falha ao obter informações do usuário');
    }
  }

  /**
   * Salva ou atualiza integração no banco de dados
   */
  static async saveIntegration(
    tenantId: number,
    userId: number,
    tokenData: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_id: string;
    }
  ): Promise<MercadoLivreIntegration> {
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Verifica se já existe integração para este tenant
    let integration = await MercadoLivreIntegration.findOne({
      where: { tenantId, mlUserId: tokenData.user_id },
    });

    if (integration) {
      // Atualiza integração existente
      await integration.update({
        userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: expiresAt,
        isActive: true,
      });
    } else {
      // Cria nova integração
      integration = await MercadoLivreIntegration.create({
        tenantId,
        userId,
        mlUserId: tokenData.user_id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: expiresAt,
        isActive: true,
        lastSync: null,
      });
    }

    return integration;
  }
}

export default MercadoLivreOAuthService;
