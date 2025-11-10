// Tipos para integrações com marketplaces e ERPs

export type MarketplaceType = 'mercado_livre' | 'amazon' | 'shopee' | 'shopify' | 'woocommerce';
export type ERPType = 'bling' | 'tiny' | 'omie' | 'totvs' | 'sap' | 'generic';
export type IntegrationType = MarketplaceType | ERPType;

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';
export type SyncStatus = 'success' | 'error' | 'pending' | 'running';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  status: IntegrationStatus;
  config: IntegrationConfig;
  lastSync: string | null;
  syncFrequency: number; // minutos
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConfig {
  // OAuth 2.0
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  
  // API Key
  apiKey?: string;
  apiSecret?: string;
  
  // Endpoints
  baseUrl?: string;
  authUrl?: string;
  
  // Configurações específicas
  sellerId?: string;
  storeId?: string;
  marketplace?: string;
  
  // Webhooks
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface SyncLog {
  id: string;
  integrationId: string;
  integrationType: IntegrationType;
  syncType: 'products' | 'orders' | 'customers' | 'stock' | 'full';
  status: SyncStatus;
  startedAt: string;
  completedAt: string | null;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errors: SyncError[];
  details?: Record<string, any>;
}

export interface SyncError {
  recordId?: string;
  recordType: string;
  errorCode: string;
  errorMessage: string;
  timestamp: string;
}

export interface ProductMapping {
  localProductId: string;
  externalProductId: string;
  integrationType: IntegrationType;
  sku: string;
  lastSyncAt: string;
}

export interface OrderMapping {
  localOrderId: string;
  externalOrderId: string;
  integrationType: IntegrationType;
  orderNumber: string;
  lastSyncAt: string;
}

// Mercado Livre
export interface MercadoLivreConfig extends IntegrationConfig {
  userId?: string;
  siteId?: string; // MLB (Brasil), MLA (Argentina), etc
}

export interface MercadoLivreProduct {
  id: string;
  title: string;
  price: number;
  available_quantity: number;
  sold_quantity: number;
  condition: 'new' | 'used';
  listing_type_id: string;
  pictures: Array<{ url: string }>;
  attributes: Array<{ id: string; name: string; value_name: string }>;
}

export interface MercadoLivreOrder {
  id: number;
  status: string;
  date_created: string;
  total_amount: number;
  buyer: {
    id: number;
    nickname: string;
    email: string;
    phone: { number: string };
  };
  order_items: Array<{
    item: {
      id: string;
      title: string;
    };
    quantity: number;
    unit_price: number;
  }>;
  shipping: {
    id: number;
    receiver_address: {
      street_name: string;
      street_number: string;
      city: { name: string };
      state: { name: string };
      zip_code: string;
    };
  };
}

// Amazon
export interface AmazonConfig extends IntegrationConfig {
  sellerId?: string;
  marketplaceId?: string; // A2Q3Y263D00KWC (Brasil)
  region?: string; // us-east-1
  roleArn?: string;
}

// Shopee
export interface ShopeeConfig extends IntegrationConfig {
  partnerId?: string;
  partnerKey?: string;
  shopId?: string;
}

// Bling
export interface BlingConfig extends IntegrationConfig {
  apiKey?: string;
}

// Tiny
export interface TinyConfig extends IntegrationConfig {
  token?: string;
}

// Webhook payload
export interface WebhookPayload {
  event: string;
  timestamp: string;
  integrationId: string;
  integrationType: IntegrationType;
  data: Record<string, any>;
}
