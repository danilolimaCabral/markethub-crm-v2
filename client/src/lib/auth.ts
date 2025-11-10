import { generateCodeVerifier, generateCodeChallenge, generateState, storePKCEParams, retrievePKCEParams } from './pkce';

/**
 * OAuth2 Configuration for MarketHub CRM
 */
const OAUTH_CONFIG = {
  authorizationEndpoint: 'https://api.example.com/Autenticacao/',
  tokenEndpoint: 'https://api.example.com/Autenticacao/Token',
  refreshEndpoint: 'https://api.example.com/Autenticacao/RefreshToken',
  clientId: '6b6c14ef-a27a-4467-8bb3-e0d7dc4b206f', // External API Client ID
  redirectUri: window.location.origin + '/callback',
  scope: 'openid',
};

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

/**
 * Initiate OAuth2 login flow with PKCE
 */
export async function initiateLogin(): Promise<void> {
  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store for later use
  storePKCEParams(codeVerifier, state);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;

  // Redirect to authorization server
  window.location.href = authUrl;
}

/**
 * Handle OAuth2 callback and exchange code for tokens
 */
export async function handleCallback(callbackUrl: string): Promise<AuthTokens> {
  const url = new URL(callbackUrl);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  if (!code) {
    throw new Error('No authorization code received');
  }

  // Retrieve PKCE parameters
  const { verifier, state: storedState } = retrievePKCEParams();

  if (!verifier) {
    throw new Error('No code verifier found');
  }

  if (state !== storedState) {
    throw new Error('State mismatch - possible CSRF attack');
  }

  // Exchange code for tokens
  const tokenResponse = await exchangeCodeForTokens(code, verifier);

  // Calculate expiration time
  const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);

  const tokens: AuthTokens = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt,
  };

  // Store tokens
  storeTokens(tokens);

  return tokens;
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    client_id: OAUTH_CONFIG.clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: OAUTH_CONFIG.clientId,
  });

  const response = await fetch(OAUTH_CONFIG.refreshEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const tokenResponse: TokenResponse = await response.json();

  const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);

  const tokens: AuthTokens = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || refreshToken,
    expiresAt,
  };

  storeTokens(tokens);

  return tokens;
}

/**
 * Store tokens in localStorage
 */
export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
}

/**
 * Retrieve tokens from localStorage
 */
export function getStoredTokens(): AuthTokens | null {
  const stored = localStorage.getItem('auth_tokens');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clear stored tokens (logout)
 */
export function clearTokens(): void {
  localStorage.removeItem('auth_tokens');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const tokens = getStoredTokens();
  if (!tokens) return false;
  
  // Check if token is expired
  return Date.now() < tokens.expiresAt;
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens) return null;

  // If token is still valid, return it
  if (Date.now() < tokens.expiresAt) {
    return tokens.accessToken;
  }

  // Token expired, try to refresh
  if (tokens.refreshToken) {
    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken);
      return newTokens.accessToken;
    } catch {
      // Refresh failed, clear tokens
      clearTokens();
      return null;
    }
  }

  return null;
}

/**
 * Logout user
 */
export function logout(): void {
  clearTokens();
  // Limpar todos os dados de autenticação
  localStorage.removeItem('markethub_user');
  localStorage.removeItem('markethub_user'); // Manter para compatibilidade
  localStorage.clear(); // Limpar tudo para garantir
  window.location.href = '/';
}
