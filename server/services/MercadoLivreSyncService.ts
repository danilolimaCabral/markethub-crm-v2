/**
 * Serviço de Sincronização do Mercado Livre
 * Sincroniza pedidos, produtos e estoque bidirecionalmente
 */

import MercadoLivreAPIClient from './MercadoLivreAPIClient';
import { query, transaction } from '../db';
import { cache } from '../utils/cache';

interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  duration: number;
}

interface SyncOptions {
  syncOrders?: boolean;
  syncProducts?: boolean;
  syncQuestions?: boolean;
  limit?: number;
}

class MercadoLivreSyncService {
  private client: MercadoLivreAPIClient;
  private tenantId: string;
  private mlUserId: string | null = null;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.client = new MercadoLivreAPIClient(tenantId);
  }

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.client.initialize();
    
    // Obter ML User ID
    const userInfo = await this.client.getUserInfo();
    this.mlUserId = userInfo.id.toString();
    
    console.log(`✅ Sync service inicializado para tenant ${this.tenantId}, ML User: ${this.mlUserId}`);
  }

  /**
   * Sincronização completa
   */
  async syncAll(options: SyncOptions = {}): Promise<{
    orders?: SyncResult;
    products?: SyncResult;
    questions?: SyncResult;
  }> {
    await this.initialize();

    const results: any = {};

    try {
      if (options.syncOrders !== false) {
        console.log('📦 Sincronizando pedidos...');
        results.orders = await this.syncOrders(options.limit);
      }

      if (options.syncProducts !== false) {
        console.log('🏷️  Sincronizando produtos...');
        results.products = await this.syncProducts(options.limit);
      }

      if (options.syncQuestions !== false) {
        console.log('❓ Sincronizando perguntas...');
        results.questions = await this.syncQuestions(options.limit);
      }

      // Atualizar last_sync
      await query(
        `UPDATE marketplace_integrations 
         SET last_sync_at = NOW() 
         WHERE tenant_id = $1 AND marketplace = 'mercado_livre'`,
        [this.tenantId]
      );

      console.log('✅ Sincronização completa finalizada');
      return results;
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error);
      throw error;
    }
  }

  /**
   * Sincroniza pedidos do ML para o CRM
   */
  async syncOrders(limit: number = 50): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    try {
      // Buscar pedidos desde o último sync
      const response = await this.client.searchOrders({
        seller: this.mlUserId!,
        limit,
        sort: 'date_created',
        order: 'desc',
      });

      console.log(`📦 Encontrados ${response.results.length} pedidos`);

      for (const mlOrder of response.results) {
        try {
          await this.saveOrder(mlOrder);
          processed++;
        } catch (error: any) {
          console.error(`❌ Erro ao processar pedido ${mlOrder.id}:`, error.message);
          errors.push(`Pedido ${mlOrder.id}: ${error.message}`);
          failed++;
        }
      }

      // Invalidar cache de pedidos
      await cache.deletePattern(`orders:${this.tenantId}*`);

      return {
        success: true,
        processed,
        failed,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar pedidos:', error);
      return {
        success: false,
        processed,
        failed,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Salva ou atualiza um pedido no banco
   */
  private async saveOrder(mlOrder: any): Promise<void> {
    await transaction(async (client) => {
      // Verificar se pedido já existe
      const existing = await client.query(
        'SELECT id FROM orders WHERE marketplace_order_id = $1 AND tenant_id = $2',
        [mlOrder.id.toString(), this.tenantId]
      );

      // Obter ou criar cliente
      const customerId = await this.getOrCreateCustomer(mlOrder.buyer, client);

      const orderData = {
        tenant_id: this.tenantId,
        order_number: mlOrder.id.toString(),
        customer_id: customerId,
        marketplace: 'mercado_livre',
        marketplace_order_id: mlOrder.id.toString(),
        status: this.mapOrderStatus(mlOrder.status),
        payment_method: mlOrder.payments?.[0]?.payment_method_id || null,
        payment_status: mlOrder.payments?.[0]?.status || 'pending',
        subtotal: mlOrder.total_amount,
        shipping_cost: mlOrder.shipping?.cost || 0,
        discount: mlOrder.coupon?.amount || 0,
        total: mlOrder.total_amount,
        shipping_address: JSON.stringify(mlOrder.shipping?.receiver_address || {}),
        tracking_code: mlOrder.shipping?.tracking_number || null,
        notes: mlOrder.buyer_message || null,
        created_at: new Date(mlOrder.date_created),
      };

      let orderId: string;

      if (existing.rows.length > 0) {
        // Atualizar pedido existente
        await client.query(
          `UPDATE orders 
           SET status = $1, payment_status = $2, tracking_code = $3, updated_at = NOW()
           WHERE id = $4`,
          [orderData.status, orderData.payment_status, orderData.tracking_code, existing.rows[0].id]
        );
        orderId = existing.rows[0].id;
        console.log(`🔄 Pedido ${mlOrder.id} atualizado`);
      } else {
        // Criar novo pedido
        const result = await client.query(
          `INSERT INTO orders (
            tenant_id, order_number, customer_id, marketplace, marketplace_order_id,
            status, payment_method, payment_status, subtotal, shipping_cost,
            discount, total, shipping_address, tracking_code, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING id`,
          [
            orderData.tenant_id, orderData.order_number, orderData.customer_id,
            orderData.marketplace, orderData.marketplace_order_id, orderData.status,
            orderData.payment_method, orderData.payment_status, orderData.subtotal,
            orderData.shipping_cost, orderData.discount, orderData.total,
            orderData.shipping_address, orderData.tracking_code, orderData.notes,
            orderData.created_at,
          ]
        );
        orderId = result.rows[0].id;
        console.log(`✅ Pedido ${mlOrder.id} criado`);
      }

      // Sincronizar itens do pedido
      for (const item of mlOrder.order_items) {
        await this.saveOrderItem(orderId, item, client);
      }
    });
  }

  /**
   * Salva item do pedido
   */
  private async saveOrderItem(orderId: string, mlItem: any, client: any): Promise<void> {
    // Buscar produto pelo SKU do ML
    const productResult = await client.query(
      `SELECT id FROM products 
       WHERE tenant_id = $1 AND (sku = $2 OR name ILIKE $3)
       LIMIT 1`,
      [this.tenantId, mlItem.item.id, `%${mlItem.item.title}%`]
    );

    const productId = productResult.rows[0]?.id || null;

    // Verificar se item já existe
    const existing = await client.query(
      'SELECT id FROM order_items WHERE order_id = $1 AND sku = $2',
      [orderId, mlItem.item.id]
    );

    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, sku, name, quantity, unit_price, subtotal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          productId,
          mlItem.item.id,
          mlItem.item.title,
          mlItem.quantity,
          mlItem.unit_price,
          mlItem.quantity * mlItem.unit_price,
        ]
      );
    }
  }

  /**
   * Obtém ou cria cliente
   */
  private async getOrCreateCustomer(buyer: any, client: any): Promise<string> {
    // Buscar por email ou document
    let existing = await client.query(
      `SELECT id FROM customers 
       WHERE tenant_id = $1 AND (email = $2 OR document = $3)
       LIMIT 1`,
      [this.tenantId, buyer.email, buyer.billing_info?.doc_number]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    // Criar novo cliente
    const result = await client.query(
      `INSERT INTO customers (
        tenant_id, name, email, phone, document, type
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        this.tenantId,
        `${buyer.first_name} ${buyer.last_name}`.trim(),
        buyer.email,
        buyer.phone?.number || null,
        buyer.billing_info?.doc_number || null,
        buyer.billing_info?.doc_type === 'CPF' ? 'pessoa_fisica' : 'pessoa_juridica',
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Mapeia status do ML para status interno
   */
  private mapOrderStatus(mlStatus: string): string {
    const statusMap: Record<string, string> = {
      'confirmed': 'paid',
      'payment_required': 'pending',
      'payment_in_process': 'processing',
      'paid': 'paid',
      'partially_paid': 'paid',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
    };

    return statusMap[mlStatus] || 'pending';
  }

  /**
   * Sincroniza produtos do ML para o CRM
   */
  async syncProducts(limit: number = 50): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    try {
      // Buscar produtos do vendedor
      const response = await this.client.searchItems(this.mlUserId!, 0, limit);

      console.log(`🏷️  Encontrados ${response.results.length} produtos`);

      for (const itemId of response.results) {
        try {
          // Obter detalhes completos do produto
          const item = await this.client.getItem(itemId);
          await this.saveProduct(item);
          processed++;
        } catch (error: any) {
          console.error(`❌ Erro ao processar produto ${itemId}:`, error.message);
          errors.push(`Produto ${itemId}: ${error.message}`);
          failed++;
        }
      }

      // Invalidar cache de produtos
      await cache.deletePattern(`products:${this.tenantId}*`);

      return {
        success: true,
        processed,
        failed,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar produtos:', error);
      return {
        success: false,
        processed,
        failed,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Salva ou atualiza produto no banco
   */
  private async saveProduct(mlItem: any): Promise<void> {
    // Verificar se produto já existe
    const existing = await query(
      'SELECT id FROM products WHERE tenant_id = $1 AND sku = $2',
      [this.tenantId, mlItem.id]
    );

    const productData = {
      sku: mlItem.id,
      name: mlItem.title,
      description: mlItem.description || '',
      category: mlItem.category_id,
      brand: mlItem.attributes?.find((a: any) => a.id === 'BRAND')?.value_name || null,
      sale_price: mlItem.price,
      stock_quantity: mlItem.available_quantity,
      images: JSON.stringify(mlItem.pictures?.map((p: any) => p.url) || []),
      is_active: mlItem.status === 'active',
    };

    if (existing.rows.length > 0) {
      // Atualizar
      await query(
        `UPDATE products 
         SET name = $1, description = $2, sale_price = $3, stock_quantity = $4,
             images = $5, is_active = $6, updated_at = NOW()
         WHERE id = $7`,
        [
          productData.name,
          productData.description,
          productData.sale_price,
          productData.stock_quantity,
          productData.images,
          productData.is_active,
          existing.rows[0].id,
        ]
      );
      console.log(`🔄 Produto ${mlItem.id} atualizado`);
    } else {
      // Criar
      await query(
        `INSERT INTO products (
          tenant_id, sku, name, description, category, brand,
          cost_price, sale_price, stock_quantity, images, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          this.tenantId,
          productData.sku,
          productData.name,
          productData.description,
          productData.category,
          productData.brand,
          0, // cost_price (não disponível no ML)
          productData.sale_price,
          productData.stock_quantity,
          productData.images,
          productData.is_active,
        ]
      );
      console.log(`✅ Produto ${mlItem.id} criado`);
    }
  }

  /**
   * Sincroniza perguntas
   */
  async syncQuestions(limit: number = 50): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    try {
      const response = await this.client.searchQuestions({
        sellerId: this.mlUserId!,
        status: 'UNANSWERED',
        limit,
      });

      console.log(`❓ Encontradas ${response.questions?.length || 0} perguntas`);

      // TODO: Implementar salvamento de perguntas no banco
      // Por enquanto apenas loga

      return {
        success: true,
        processed,
        failed,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar perguntas:', error);
      return {
        success: false,
        processed,
        failed,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Atualiza estoque no ML quando muda no CRM
   */
  async updateStockOnML(productSku: string, newQuantity: number): Promise<void> {
    try {
      await this.initialize();
      await this.client.updateStock(productSku, newQuantity);
      console.log(`✅ Estoque atualizado no ML: ${productSku} = ${newQuantity}`);
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar estoque no ML:`, error);
      throw error;
    }
  }
}

export default MercadoLivreSyncService;
