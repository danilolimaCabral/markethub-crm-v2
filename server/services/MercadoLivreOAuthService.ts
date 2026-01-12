import axios, { AxiosError } from 'axios';
import { query } from '../db';
import { cache } from '../utils/cache';

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

interface IntegrationRecord {
  id: number;
  tenant_id: number;
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
  config: any;
}

class MercadoLivreOAuthService {
  /**
   * Gera URL de autorização do Mercado Livre
   */
  static getAuthorizationUrl(state: string, customClientId?: string, customRedirectUri?: string): string {
    const clientId = customClientId || ML_CLIENT_ID;
    const redirectUri = customRedirectUri || ML_REDIRECT_URI;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
    });

    return `${ML_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Troca o código de autorização por access token
   */
  static async exchangeCodeForToken(
    code: string,
    customClientId?: string,
    customClientSecret?: string,
    customRedirectUri?: string
  ): Promise<MLTokenResponse> {
    try {
      const clientId = customClientId || ML_CLIENT_ID;
      const clientSecret = customClientSecret || ML_CLIENT_SECRET;
      const redirectUri = customRedirectUri || ML_REDIRECT_URI;

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
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
   * CORRIGIDO: Usando URLSearchParams (form-urlencoded) em vez de JSON
   */
  static async refreshAccessToken(
    refreshToken: string,
    customClientId?: string,
    customClientSecret?: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    try {
      const clientId = customClientId || ML_CLIENT_ID;
      const clientSecret = customClientSecret || ML_CLIENT_SECRET;

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      });

      const response = await axios.post(
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

      console.log('✅ Token renovado com sucesso');

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('❌ Erro ao renovar token:', error.response?.data || error.message);
      throw new Error('Falha ao renovar token do Mercado Livre');
    }
  }

  /**
   * Verifica se o token está expirado e renova se necessário
   * CORRIGIDO: Usando marketplace_integrations em vez de Sequelize model
   */
  static async ensureValidToken(tenantId: number | string): Promise<string> {
    // Buscar integração do banco
    const result = await query(
      `SELECT id, access_token, refresh_token, token_expires_at, config
       FROM marketplace_integrations
       WHERE tenant_id = $1 AND marketplace = 'mercado_livre' AND is_active = true
       LIMIT 1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error('Integração do Mercado Livre não encontrada');
    }

    const integration = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(integration.token_expires_at);

    // Se o token expira em menos de 1 hora, renova
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (expiresAt <= oneHourFromNow) {
      console.log('🔄 Token expirando em breve, renovando...');

      const tokenData = await this.refreshAccessToken(integration.refresh_token);

      // Atualiza o token no banco
      const newExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);
      await query(
        `UPDATE marketplace_integrations
         SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW()
         WHERE id = $4`,
        [tokenData.access_token, tokenData.refresh_token, newExpiresAt, integration.id]
      );

      return tokenData.access_token;
    }

    return integration.access_token;
  }

  /**
   * Obtém informações do usuário do Mercado Livre
   */
  static async getUserInfo(accessToken: string): Promise<MLUserInfo> {
    try {
      const response = await axios.get(`${ML_API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao obter informações do usuário:', error.response?.data || error.message);
      throw new Error('Falha ao obter informações do usuário');
    }
  }

  /**
   * Salva ou atualiza integração no banco de dados
   * CORRIGIDO: Usando marketplace_integrations diretamente
   */
  static async saveIntegration(
    tenantId: number,
    userId: number,
    tokenData: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_id: number | string;
    },
    userInfo?: MLUserInfo
  ): Promise<IntegrationRecord> {
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const config = {
      ml_user_id: tokenData.user_id.toString(),
      ml_nickname: userInfo?.nickname || null,
      ml_email: userInfo?.email || null,
    };

    // Verifica se já existe integração para este tenant
    const existing = await query(
      `SELECT id FROM marketplace_integrations
       WHERE tenant_id = $1 AND marketplace = 'mercado_livre'`,
      [tenantId]
    );

    let integrationId: number;

    if (existing.rows.length > 0) {
      // Atualiza integração existente
      await query(
        `UPDATE marketplace_integrations
         SET access_token = $1, refresh_token = $2, token_expires_at = $3,
             is_active = true, config = $4, updated_at = NOW()
         WHERE id = $5`,
        [
          tokenData.access_token,
          tokenData.refresh_token,
          expiresAt,
          JSON.stringify(config),
          existing.rows[0].id,
        ]
      );
      integrationId = existing.rows[0].id;
      console.log(`✅ Integração ML atualizada para tenant ${tenantId}`);
    } else {
      // Cria nova integração
      const result = await query(
        `INSERT INTO marketplace_integrations (
          tenant_id, marketplace, access_token, refresh_token,
          token_expires_at, is_active, config
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          tenantId,
          'mercado_livre',
          tokenData.access_token,
          tokenData.refresh_token,
          expiresAt,
          true,
          JSON.stringify(config),
        ]
      );
      integrationId = result.rows[0].id;
      console.log(`✅ Nova integração ML criada para tenant ${tenantId}`);
    }

    // Retornar o registro criado/atualizado
    const integration = await query(
      `SELECT id, tenant_id, access_token, refresh_token, token_expires_at, config
       FROM marketplace_integrations WHERE id = $1`,
      [integrationId]
    );

    return integration.rows[0];
  }

  /**
   * Busca integração ativa por tenant
   */
  static async getIntegration(tenantId: number | string): Promise<IntegrationRecord | null> {
    const result = await query(
      `SELECT id, tenant_id, access_token, refresh_token, token_expires_at, config
       FROM marketplace_integrations
       WHERE tenant_id = $1 AND marketplace = 'mercado_livre' AND is_active = true
       LIMIT 1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Busca integração por ML User ID (para webhooks)
   */
  static async getIntegrationByMLUserId(mlUserId: string): Promise<IntegrationRecord | null> {
    const result = await query(
      `SELECT id, tenant_id, access_token, refresh_token, token_expires_at, config
       FROM marketplace_integrations
       WHERE marketplace = 'mercado_livre'
         AND is_active = true
         AND config->>'ml_user_id' = $1
       LIMIT 1`,
      [mlUserId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Desconecta integração
   */
  static async disconnect(tenantId: number | string): Promise<void> {
    await query(
      `UPDATE marketplace_integrations
       SET is_active = false, updated_at = NOW()
       WHERE tenant_id = $1 AND marketplace = 'mercado_livre'`,
      [tenantId]
    );

    // Invalidar cache
    await cache.deletePattern(`ml:${tenantId}*`);

    console.log(`✅ Integração ML desconectada para tenant ${tenantId}`);
  }
}

export default MercadoLivreOAuthService;
