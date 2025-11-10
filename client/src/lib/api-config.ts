/**
 * Configuração da API Lexos
 * Armazena credenciais de forma centralizada
 */

export interface LexosAPIConfig {
  integrationKey: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

const CONFIG_KEY = 'markethub_api_config';

/**
 * Salvar configuração da API
 */
export function saveAPIConfig(config: LexosAPIConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

/**
 * Obter configuração da API
 */
export function getAPIConfig(): LexosAPIConfig | null {
  const configJson = localStorage.getItem(CONFIG_KEY);
  return configJson ? JSON.parse(configJson) : null;
}

/**
 * Verificar se API está configurada
 */
export function isAPIConfigured(): boolean {
  const config = getAPIConfig();
  return !!(config && config.integrationKey && config.accessToken);
}

/**
 * Remover configuração da API
 */
export function clearAPIConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

/**
 * Obter access token válido
 */
export function getValidAccessToken(): string | null {
  const config = getAPIConfig();
  if (!config) return null;

  // Verificar se token expirou
  if (config.expiresAt && Date.now() >= config.expiresAt) {
    return null;
  }

  return config.accessToken;
}

/**
 * Obter Integration Key
 */
export function getIntegrationKey(): string | null {
  const config = getAPIConfig();
  return config?.integrationKey || null;
}
