/**
 * Serviço de Renovação Automática de Token JWT
 * Gerencia renovação de tokens expirados usando refreshToken
 */

import { refreshAccessToken, getStoredTokens, logout } from './auth';

// Intervalo de verificação (a cada 5 minutos)
const CHECK_INTERVAL = 5 * 60 * 1000;

// Renovar quando faltar menos de 10 minutos para expirar
const REFRESH_THRESHOLD = 10 * 60 * 1000;

let refreshTimer: NodeJS.Timeout | null = null;
let isRefreshing = false;

/**
 * Verifica se o token está próximo de expirar
 */
function isTokenExpiringSoon(): boolean {
  const tokens = getStoredTokens();
  
  if (!tokens?.accessToken || !tokens?.expiresAt) {
    return true; // Sem token ou sem data de expiração
  }

  const now = Date.now();
  const expiresAt = new Date(tokens.expiresAt).getTime();
  const timeUntilExpiry = expiresAt - now;

  return timeUntilExpiry < REFRESH_THRESHOLD;
}

/**
 * Tenta renovar o token automaticamente
 */
async function attemptTokenRefresh(): Promise<boolean> {
  if (isRefreshing) {
    console.log('[TokenRefresh] Renovação já em andamento...');
    return false;
  }

  const tokens = getStoredTokens();
  
  if (!tokens?.refreshToken) {
    console.error('[TokenRefresh] Sem refreshToken disponível');
    return false;
  }

  try {
    isRefreshing = true;
    console.log('[TokenRefresh] Iniciando renovação do token...');
    
    const newTokens = await refreshAccessToken(tokens.refreshToken);
    
    if (newTokens) {
      console.log('[TokenRefresh] Token renovado com sucesso!');
      return true;
    } else {
      console.error('[TokenRefresh] Falha ao renovar token');
      return false;
    }
  } catch (error) {
    console.error('[TokenRefresh] Erro ao renovar token:', error);
    return false;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Verifica e renova token se necessário
 */
async function checkAndRefreshToken(): Promise<void> {
  const tokens = getStoredTokens();
  
  if (!tokens?.accessToken) {
    console.log('[TokenRefresh] Usuário não autenticado, parando monitoramento');
    stopTokenRefreshMonitoring();
    return;
  }

  if (isTokenExpiringSoon()) {
    console.log('[TokenRefresh] Token expirando em breve, renovando...');
    const success = await attemptTokenRefresh();
    
    if (!success) {
      console.error('[TokenRefresh] Falha na renovação, fazendo logout...');
      logout();
      stopTokenRefreshMonitoring();
    }
  } else {
    const tokens = getStoredTokens();
    if (tokens?.expiresAt) {
      const expiresAt = new Date(tokens.expiresAt).getTime();
      const timeUntilExpiry = expiresAt - Date.now();
      const minutesLeft = Math.floor(timeUntilExpiry / 60000);
      console.log(`[TokenRefresh] Token válido por mais ${minutesLeft} minutos`);
    }
  }
}

/**
 * Inicia o monitoramento automático de renovação de token
 */
export function startTokenRefreshMonitoring(): void {
  if (refreshTimer) {
    console.log('[TokenRefresh] Monitoramento já está ativo');
    return;
  }

  console.log('[TokenRefresh] Iniciando monitoramento automático de token');
  
  // Verifica imediatamente
  checkAndRefreshToken();
  
  // Configura verificação periódica
  refreshTimer = setInterval(checkAndRefreshToken, CHECK_INTERVAL);
}

/**
 * Para o monitoramento automático de renovação de token
 */
export function stopTokenRefreshMonitoring(): void {
  if (refreshTimer) {
    console.log('[TokenRefresh] Parando monitoramento de token');
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Força a renovação imediata do token
 */
export async function forceTokenRefresh(): Promise<boolean> {
  console.log('[TokenRefresh] Renovação forçada solicitada');
  return await attemptTokenRefresh();
}

/**
 * Obtém o tempo restante até a expiração do token (em milissegundos)
 */
export function getTimeUntilExpiry(): number | null {
  const tokens = getStoredTokens();
  
  if (!tokens?.expiresAt) {
    return null;
  }

  const expiresAt = new Date(tokens.expiresAt).getTime();
  const now = Date.now();
  
  return Math.max(0, expiresAt - now);
}

/**
 * Verifica se o token está expirado
 */
export function isTokenExpired(): boolean {
  const timeLeft = getTimeUntilExpiry();
  return timeLeft === null || timeLeft <= 0;
}
