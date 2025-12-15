#!/usr/bin/env node

/**
 * Script de Teste de Webhooks do Mercado Livre
 * 
 * Este script permite testar o endpoint de webhook enviando notificações simuladas
 * para verificar se o sistema está processando corretamente.
 * 
 * Uso:
 *   node test-webhook.js [tipo] [url]
 * 
 * Exemplos:
 *   node test-webhook.js order
 *   node test-webhook.js item https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook
 *   node test-webhook.js question http://localhost:3000/api/integrations/mercadolivre/webhook
 */

const https = require('https');
const http = require('http');
const url = require('url');

// Configuração padrão
const DEFAULT_WEBHOOK_URL = 'https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook';

// Tipos de notificações de teste
const TEST_NOTIFICATIONS = {
  order: {
    _id: 'test-order-' + Date.now(),
    resource: '/orders/2000003692581726',
    user_id: 123456789,
    topic: 'orders_v2',
    application_id: 1234567890,
    attempts: 1,
    sent: new Date().toISOString(),
    received: new Date().toISOString(),
  },
  item: {
    _id: 'test-item-' + Date.now(),
    resource: '/items/MLB123456789',
    user_id: 123456789,
    topic: 'items',
    application_id: 1234567890,
    attempts: 1,
    sent: new Date().toISOString(),
    received: new Date().toISOString(),
  },
  question: {
    _id: 'test-question-' + Date.now(),
    resource: '/questions/123456789',
    user_id: 123456789,
    topic: 'questions',
    application_id: 1234567890,
    attempts: 1,
    sent: new Date().toISOString(),
    received: new Date().toISOString(),
  },
  message: {
    _id: 'test-message-' + Date.now(),
    resource: '/messages/123456789',
    user_id: 123456789,
    topic: 'messages',
    application_id: 1234567890,
    attempts: 1,
    sent: new Date().toISOString(),
    received: new Date().toISOString(),
  },
  payment: {
    _id: 'test-payment-' + Date.now(),
    resource: '/payments/123456789',
    user_id: 123456789,
    topic: 'payments',
    application_id: 1234567890,
    attempts: 1,
    sent: new Date().toISOString(),
    received: new Date().toISOString(),
  },
  shipment: {
    _id: 'test-shipment-' + Date.now(),
    resource: '/shipments/123456789',
    user_id: 123456789,
    topic: 'shipments',
    application_id: 1234567890,
    attempts: 1,
    sent: new Date().toISOString(),
    received: new Date().toISOString(),
  },
};

/**
 * Envia notificação de teste para o webhook
 */
function sendTestNotification(webhookUrl, notification) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(webhookUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = JSON.stringify(notification);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'MercadoLivre-Webhook-Test/1.0',
      },
    };

    console.log('\n🚀 Enviando notificação de teste...');
    console.log('📍 URL:', webhookUrl);
    console.log('📦 Payload:', JSON.stringify(notification, null, 2));
    console.log('\n⏳ Aguardando resposta...\n');

    const startTime = Date.now();

    const req = client.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('✅ Resposta recebida:');
        console.log('   Status:', res.statusCode, res.statusMessage);
        console.log('   Tempo:', responseTime + 'ms');
        console.log('   Body:', data);

        if (res.statusCode === 200) {
          console.log('\n✅ Webhook funcionando corretamente!');
          resolve({ success: true, responseTime, data });
        } else {
          console.log('\n⚠️  Webhook retornou status diferente de 200');
          resolve({ success: false, statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      console.error('\n❌ Erro ao enviar notificação:');
      console.error('   Mensagem:', error.message);
      console.error('   Tempo:', responseTime + 'ms');
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Exibe ajuda
 */
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Teste de Webhooks do Mercado Livre - MarketHub        ║
╚════════════════════════════════════════════════════════════════╝

Uso:
  node test-webhook.js [tipo] [url]

Tipos disponíveis:
  order      - Notificação de pedido (orders_v2)
  item       - Notificação de produto (items)
  question   - Notificação de pergunta (questions)
  message    - Notificação de mensagem (messages)
  payment    - Notificação de pagamento (payments)
  shipment   - Notificação de envio (shipments)
  all        - Envia todos os tipos de notificação

Exemplos:
  # Testar pedido no servidor de produção
  node test-webhook.js order

  # Testar produto em servidor local
  node test-webhook.js item http://localhost:3000/api/integrations/mercadolivre/webhook

  # Testar todos os tipos
  node test-webhook.js all

  # URL padrão (se não especificada)
  ${DEFAULT_WEBHOOK_URL}
`);
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);

  // Verificar se pediu ajuda
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  // Obter tipo e URL
  const type = args[0] || 'order';
  const webhookUrl = args[1] || DEFAULT_WEBHOOK_URL;

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         Teste de Webhooks do Mercado Livre - MarketHub        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // Verificar se tipo é válido
  if (type !== 'all' && !TEST_NOTIFICATIONS[type]) {
    console.error('\n❌ Tipo de notificação inválido:', type);
    console.log('\nTipos válidos:', Object.keys(TEST_NOTIFICATIONS).join(', '), 'all');
    console.log('\nUse --help para mais informações');
    process.exit(1);
  }

  try {
    if (type === 'all') {
      // Testar todos os tipos
      console.log('\n🧪 Testando todos os tipos de notificação...\n');
      
      for (const [notifType, notification] of Object.entries(TEST_NOTIFICATIONS)) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testando: ${notifType.toUpperCase()}`);
        console.log('='.repeat(60));
        
        try {
          await sendTestNotification(webhookUrl, notification);
        } catch (error) {
          console.error(`❌ Falha ao testar ${notifType}:`, error.message);
        }
        
        // Aguardar 1 segundo entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ Todos os testes concluídos!');
      console.log('='.repeat(60));
    } else {
      // Testar tipo específico
      const notification = TEST_NOTIFICATIONS[type];
      await sendTestNotification(webhookUrl, notification);
    }

    console.log('\n💡 Dicas:');
    console.log('   - Verifique os logs do servidor para ver o processamento');
    console.log('   - Consulte o banco de dados para confirmar que foi salvo');
    console.log('   - Use "railway logs" para ver logs em produção\n');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
