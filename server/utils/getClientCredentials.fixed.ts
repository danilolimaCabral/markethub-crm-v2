/**
 * Helper para buscar credenciais de marketplace do cliente
 * Versão CORRIGIDA com validações robustas
 * 
 * Correções aplicadas:
 * - Validação obrigatória de variáveis de ambiente
 * - Validação obrigatória de ENCRYPTION_KEY
 * - Mensagens de erro mais descritivas
 * - Logs estruturados para debugging
 * - Tratamento de erros mais robusto
 */

import { query } from '../db';
import crypto from 'crypto';

interface ClientCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
}

/**
 * Valida se ENCRYPTION_KEY está configurada e é segura
 */
function validateEncryptionKey(): Buffer {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error(
      'ENCRYPTION_KEY não está configurada. ' +
      'Configure esta variável de ambiente com uma chave de 32+ caracteres. ' +
      'Exemplo: openssl rand -base64 32'
    );
  }
  
  if (encryptionKey.length < 32) {
    throw new Error(
      `ENCRYPTION_KEY muito curta (${encryptionKey.length} caracteres). ` +
      'Use uma chave com pelo menos 32 caracteres para segurança adequada.'
    );
  }
  
  // Aviso se estiver usando a chave padrão insegura
  if (encryptionKey === 'default-key-32-chars-long!!!!!!') {
    console.warn(
      '⚠️  AVISO DE SEGURANÇA: Usando ENCRYPTION_KEY padrão. ' +
      'Configure uma chave única em produção!'
    );
  }
  
  return Buffer.from(encryptionKey, 'utf8').slice(0, 32);
}

/**
 * Descriptografa client_secret
 */
function decryptSecret(encryptedSecret: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = validateEncryptionKey();
    
    const parts = encryptedSecret.split(':');
    if (parts.length !== 2) {
      throw new Error(
        'Formato de secret inválido. Esperado: "iv:encrypted". ' +
        `Recebido: "${encryptedSecret.substring(0, 20)}..."`
      );
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    console.error('❌ Erro ao descriptografar secret:', {
      error: error.message,
      encryptedPreview: encryptedSecret.substring(0, 20) + '...'
    });
    throw new Error(
      'Erro ao descriptografar credenciais. ' +
      'Verifique se ENCRYPTION_KEY está correta e se o secret foi criptografado com a mesma chave.'
    );
  }
}

/**
 * Valida credenciais do sistema antes de retornar
 */
function validateSystemCredentials(marketplace: string, credentials: ClientCredentials): void {
  if (!credentials.client_id || credentials.client_id.trim() === '') {
    throw new Error(
      `Credenciais do ${marketplace} não configuradas. ` +
      `Configure a variável de ambiente correspondente ao client_id. ` +
      `Exemplo: ML_CLIENT_ID=seu_client_id_aqui`
    );
  }
  
  if (!credentials.client_secret || credentials.client_secret.trim() === '') {
    throw new Error(
      `Credenciais do ${marketplace} não configuradas. ` +
      `Configure a variável de ambiente correspondente ao client_secret. ` +
      `Exemplo: ML_CLIENT_SECRET=seu_client_secret_aqui`
    );
  }
  
  if (!credentials.redirect_uri || credentials.redirect_uri.trim() === '') {
    console.warn(
      `⚠️  redirect_uri não configurado para ${marketplace}. ` +
      `Isso pode causar erro no fluxo OAuth2.`
    );
  }
}

/**
 * Busca credenciais de marketplace do cliente
 * Se não encontrar, retorna credenciais globais do sistema
 */
export async function getClientCredentials(
  userId: string | number,
  marketplace: string
): Promise<ClientCredentials> {
  try {
    console.log(`🔍 Buscando credenciais para usuário ${userId} no marketplace ${marketplace}`);
    
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
      
      try {
        // Descriptografar client_secret
        const decryptedSecret = decryptSecret(row.client_secret);
        
        console.log(`✅ Usando credenciais específicas do cliente ${userId} para ${marketplace}`);
        
        return {
          client_id: row.client_id,
          client_secret: decryptedSecret,
          redirect_uri: config.redirect_uri,
        };
      } catch (decryptError) {
        console.error(
          `❌ Erro ao descriptografar credenciais do cliente ${userId}. ` +
          `Usando credenciais globais como fallback.`,
          decryptError
        );
        // Continua para usar credenciais globais
      }
    } else {
      console.log(`ℹ️  Credenciais específicas não encontradas para cliente ${userId}. Usando credenciais globais.`);
    }

    // Se não encontrou credenciais do cliente, usar credenciais globais do sistema
    return getSystemCredentials(marketplace);
  } catch (error: any) {
    console.error('❌ Erro ao buscar credenciais do cliente:', {
      userId,
      marketplace,
      error: error.message
    });
    
    // Em caso de erro, tentar usar credenciais globais
    console.log('⚠️  Tentando usar credenciais globais como fallback...');
    return getSystemCredentials(marketplace);
  }
}

/**
 * Retorna credenciais globais do sistema (fallback)
 */
function getSystemCredentials(marketplace: string): ClientCredentials {
  console.log(`🔧 Buscando credenciais globais do sistema para ${marketplace}`);
  
  let credentials: ClientCredentials;
  
  switch (marketplace) {
    case 'mercado_livre':
      credentials = {
        client_id: process.env.ML_CLIENT_ID || '',
        client_secret: process.env.ML_CLIENT_SECRET || '',
        redirect_uri: process.env.ML_REDIRECT_URI,
      };
      break;
    
    case 'amazon':
      credentials = {
        client_id: process.env.AMAZON_CLIENT_ID || '',
        client_secret: process.env.AMAZON_CLIENT_SECRET || '',
        redirect_uri: process.env.AMAZON_REDIRECT_URI,
      };
      break;
    
    case 'shopee':
      credentials = {
        client_id: process.env.SHOPEE_CLIENT_ID || '',
        client_secret: process.env.SHOPEE_CLIENT_SECRET || '',
        redirect_uri: process.env.SHOPEE_REDIRECT_URI,
      };
      break;
    
    default:
      throw new Error(
        `Marketplace "${marketplace}" não é suportado. ` +
        `Marketplaces suportados: mercado_livre, amazon, shopee`
      );
  }
  
  // Validar credenciais antes de retornar
  validateSystemCredentials(marketplace, credentials);
  
  console.log(`✅ Credenciais globais do sistema para ${marketplace} validadas com sucesso`);
  
  return credentials;
}

/**
 * Verifica se cliente tem credenciais cadastradas
 */
export async function hasClientCredentials(
  userId: string | number,
  marketplace: string
): Promise<boolean> {
  try {
    const result = await query(`
      SELECT id
      FROM marketplace_credentials
      WHERE user_id = $1 AND marketplace = $2 AND is_active = true
      LIMIT 1
    `, [userId, marketplace]);

    const hasCredentials = result.rows.length > 0;
    
    console.log(
      hasCredentials 
        ? `✅ Cliente ${userId} possui credenciais para ${marketplace}` 
        : `ℹ️  Cliente ${userId} não possui credenciais para ${marketplace}`
    );
    
    return hasCredentials;
  } catch (error: any) {
    console.error('❌ Erro ao verificar credenciais:', {
      userId,
      marketplace,
      error: error.message
    });
    return false;
  }
}

/**
 * Criptografa um client_secret para armazenamento seguro
 * (Função auxiliar para uso em scripts de administração)
 */
export function encryptSecret(plainSecret: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = validateEncryptionKey();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(plainSecret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retorna no formato "iv:encrypted"
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error: any) {
    console.error('❌ Erro ao criptografar secret:', error.message);
    throw new Error('Erro ao criptografar credenciais');
  }
}
