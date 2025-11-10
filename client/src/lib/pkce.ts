/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth2 authentication
 * Implements RFC 7636
 */

/**
 * Generate a random string for code_verifier
 * Must be between 43-128 characters
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generate code_challenge from code_verifier using SHA-256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Base64 URL encode (without padding)
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(buffer)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Store PKCE parameters in sessionStorage
 */
export function storePKCEParams(verifier: string, state: string): void {
  sessionStorage.setItem('pkce_code_verifier', verifier);
  sessionStorage.setItem('pkce_state', state);
}

/**
 * Retrieve and clear PKCE parameters from sessionStorage
 */
export function retrievePKCEParams(): { verifier: string | null; state: string | null } {
  const verifier = sessionStorage.getItem('pkce_code_verifier');
  const state = sessionStorage.getItem('pkce_state');
  
  // Clear after retrieval for security
  sessionStorage.removeItem('pkce_code_verifier');
  sessionStorage.removeItem('pkce_state');
  
  return { verifier, state };
}
