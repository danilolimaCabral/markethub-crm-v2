/**
 * Helper para buscar credenciais de marketplace do cliente
 * Permite usar credenciais específicas por cliente em vez de globais
 */

import { query } from '../db';
import crypto from 'crypto';

interface ClientCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
}

/**
 * Descriptografa client_secret
 */
function decryptSecret(encryptedSecret: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!!!!!', 'utf8').slice(0, 32);
    
    const parts = encryptedSecret.split(':');
    if (parts.length !== 2) {
      throw new Error('Formato de secret inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar secret:', error);
    throw new Error('Erro ao descriptografar credenciais');
  }
}

/**
 * Busca credenciais de marketplace do cliente
 * Se não encontrar, retorna credenciais globais do sistema
 */
export async function getClientCredentials(
  userId: number,
  marketplace: string
): Promise<ClientCredentials> {
  try {
    // Buscar credenciais específicas do cliente
    const result = await query(`
      SELECT client_id, client_secret, config
      FROM marketplace_credentials
      WHERE user_id = $1 AND marketplace = $2 AND is_active = true
      LIMIT 1
    `, [userId, marketplace]);

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const config = row.config || {};
      
      // Descriptografar client_secret
      const decryptedSecret = decryptSecret(row.client_secret);
      
      console.log(`✅ Usando credenciais específicas do cliente ${userId} para ${marketplace}`);
      
      return {
        client_id: row.client_id,
        client_secret: decryptedSecret,
        redirect_uri: config.redirect_uri,
      };
    }

    // Se não encontrou credenciais do cliente, usar credenciais globais do sistema
    console.log(`⚠️  Credenciais não encontradas para cliente ${userId}. Usando credenciais globais do sistema.`);
    
    return getSystemCredentials(marketplace);
  } catch (error) {
    console.error('Erro ao buscar credenciais do cliente:', error);
    // Em caso de erro, usar credenciais globais
    return getSystemCredentials(marketplace);
  }
}

/**
 * Retorna credenciais globais do sistema (fallback)
 */
function getSystemCredentials(marketplace: string): ClientCredentials {
  switch (marketplace) {
    case 'mercado_livre':
      return {
        client_id: process.env.ML_CLIENT_ID || '',
        client_secret: process.env.ML_CLIENT_SECRET || '',
        redirect_uri: process.env.ML_REDIRECT_URI,
      };
    
    case 'amazon':
      return {
        client_id: process.env.AMAZON_CLIENT_ID || '',
        client_secret: process.env.AMAZON_CLIENT_SECRET || '',
        redirect_uri: process.env.AMAZON_REDIRECT_URI,
      };
    
    case 'shopee':
      return {
        client_id: process.env.SHOPEE_CLIENT_ID || '',
        client_secret: process.env.SHOPEE_CLIENT_SECRET || '',
        redirect_uri: process.env.SHOPEE_REDIRECT_URI,
      };
    
    default:
      console.warn(`Marketplace ${marketplace} não configurado`);
      return {
        client_id: '',
        client_secret: '',
      };
  }
}

/**
 * Verifica se cliente tem credenciais cadastradas
 */
export async function hasClientCredentials(
  userId: number,
  marketplace: string
): Promise<boolean> {
  try {
    const result = await query(`
      SELECT id
      FROM marketplace_credentials
      WHERE user_id = $1 AND marketplace = $2 AND is_active = true
      LIMIT 1
    `, [userId, marketplace]);

    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao verificar credenciais:', error);
    return false;
  }
}
