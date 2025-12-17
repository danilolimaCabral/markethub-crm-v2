/**
 * Control Tower Webhook Service
 * Envia dados automaticamente para o Control Tower quando eventos ocorrem
 */

const CONTROL_TOWER_URL = process.env.CONTROL_TOWER_URL || '';
const CONTROL_TOWER_API_KEY = process.env.CONTROL_TOWER_API_KEY || '';

interface WebhookPayload {
  event: string;
  timestamp: string;
  tenantId?: string;
  data: any;
}

/**
 * Envia webhook para o Control Tower
 */
async function sendWebhook(endpoint: string, payload: WebhookPayload): Promise<boolean> {
  if (!CONTROL_TOWER_URL || !CONTROL_TOWER_API_KEY) {
    console.log('[ControlTower] Webhook não configurado - URL ou API Key ausente');
    return false;
  }

  try {
    const response = await fetch(`${CONTROL_TOWER_URL}/api/markthub/webhook/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONTROL_TOWER_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[ControlTower] Webhook falhou: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log(`[ControlTower] Webhook ${endpoint} enviado com sucesso`);
    return true;
  } catch (error) {
    console.error('[ControlTower] Erro ao enviar webhook:', error);
    return false;
  }
}

/**
 * Notifica o Control Tower sobre um novo pedido
 */
export async function notifyNewOrder(order: {
  id: number;
  numero_pedido: string;
  cliente_nome: string;
  marketplace: string;
  valor_total: number;
  status: string;
  data_pedido: Date;
  tenantId?: string;
}): Promise<boolean> {
  return sendWebhook('sale', {
    event: 'order.created',
    timestamp: new Date().toISOString(),
    tenantId: order.tenantId,
    data: {
      externalId: order.id.toString(),
      saleNumber: order.numero_pedido,
      customerName: order.cliente_nome,
      totalAmount: order.valor_total,
      paymentMethod: order.marketplace,
      status: order.status,
      saleDate: order.data_pedido,
      source: 'markethub-crm-v2',
    },
  });
}

/**
 * Notifica o Control Tower sobre atualização de pedido
 */
export async function notifyOrderUpdate(order: {
  id: number;
  numero_pedido: string;
  cliente_nome: string;
  marketplace: string;
  valor_total: number;
  status: string;
  tenantId?: string;
}): Promise<boolean> {
  return sendWebhook('sale', {
    event: 'order.updated',
    timestamp: new Date().toISOString(),
    tenantId: order.tenantId,
    data: {
      externalId: order.id.toString(),
      saleNumber: order.numero_pedido,
      customerName: order.cliente_nome,
      totalAmount: order.valor_total,
      paymentMethod: order.marketplace,
      status: order.status,
      source: 'markethub-crm-v2',
    },
  });
}

/**
 * Notifica o Control Tower sobre um novo cliente
 */
export async function notifyNewCustomer(customer: {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  customerType?: string;
  tenantId?: string;
}): Promise<boolean> {
  return sendWebhook('customer', {
    event: 'customer.created',
    timestamp: new Date().toISOString(),
    tenantId: customer.tenantId,
    data: {
      externalId: customer.id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      document: customer.document,
      customerType: customer.customerType || 'pessoa_fisica',
      active: true,
      source: 'markethub-crm-v2',
    },
  });
}

/**
 * Notifica o Control Tower sobre atualização de cliente
 */
export async function notifyCustomerUpdate(customer: {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  customerType?: string;
  tenantId?: string;
}): Promise<boolean> {
  return sendWebhook('customer', {
    event: 'customer.updated',
    timestamp: new Date().toISOString(),
    tenantId: customer.tenantId,
    data: {
      externalId: customer.id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      document: customer.document,
      customerType: customer.customerType || 'pessoa_fisica',
      active: true,
      source: 'markethub-crm-v2',
    },
  });
}

/**
 * Notifica o Control Tower sobre uma nova nota fiscal
 */
export async function notifyNewInvoice(invoice: {
  id: number;
  number: string;
  customerName: string;
  totalAmount: number;
  issueDate: Date;
  status: string;
  tenantId?: string;
}): Promise<boolean> {
  return sendWebhook('invoice', {
    event: 'invoice.created',
    timestamp: new Date().toISOString(),
    tenantId: invoice.tenantId,
    data: {
      externalId: invoice.id.toString(),
      invoiceNumber: invoice.number,
      customerName: invoice.customerName,
      totalAmount: invoice.totalAmount,
      issueDate: invoice.issueDate,
      status: invoice.status,
      source: 'markethub-crm-v2',
    },
  });
}

/**
 * Notifica o Control Tower sobre sincronização de marketplace
 */
export async function notifySyncEvent(sync: {
  marketplace: string;
  syncType: string;
  itemsProcessed: number;
  itemsSuccess: number;
  itemsError: number;
  tenantId?: string;
}): Promise<boolean> {
  return sendWebhook('sync', {
    event: 'sync.completed',
    timestamp: new Date().toISOString(),
    tenantId: sync.tenantId,
    data: {
      marketplace: sync.marketplace,
      syncType: sync.syncType,
      itemsProcessed: sync.itemsProcessed,
      itemsSuccess: sync.itemsSuccess,
      itemsError: sync.itemsError,
      source: 'markethub-crm-v2',
    },
  });
}

export default {
  notifyNewOrder,
  notifyOrderUpdate,
  notifyNewCustomer,
  notifyCustomerUpdate,
  notifyNewInvoice,
  notifySyncEvent,
};
