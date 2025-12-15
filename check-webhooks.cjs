#!/usr/bin/env node

/**
 * Script para verificar webhooks recebidos e dados sincronizados
 * 
 * Uso:
 *   node check-webhooks.cjs
 */

const https = require('https');

const API_BASE_URL = 'https://www.markthubcrm.com.br/api';

// Credenciais de login (mesmas do teste)
const LOGIN_CREDENTIALS = {
  email: 'trueimportador',
  password: 'True@2024!'
};

/**
 * Faz login e retorna o token JWT
 */
async function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(LOGIN_CREDENTIALS);

    const options = {
      hostname: 'www.markthubcrm.com.br',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response.token);
        } else {
          reject(new Error(`Login falhou: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Faz requisição autenticada
 */
async function authenticatedRequest(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.markthubcrm.com.br',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Requisição falhou: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Formata data para exibição
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Exibe tabela formatada
 */
function printTable(title, headers, rows) {
  console.log('\n' + '='.repeat(80));
  console.log(title);
  console.log('='.repeat(80));
  
  if (rows.length === 0) {
    console.log('Nenhum dado encontrado.');
    return;
  }

  // Cabeçalho
  console.log(headers.join(' | '));
  console.log('-'.repeat(80));

  // Linhas
  rows.forEach(row => {
    console.log(row.join(' | '));
  });
}

/**
 * Função principal
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Verificação de Webhooks e Sincronização - MarketHub       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Fazer login
    console.log('🔐 Fazendo login...');
    const token = await login();
    console.log('✅ Login realizado com sucesso!\n');

    // 2. Buscar histórico de sincronização
    console.log('📊 Buscando histórico de sincronização...');
    const syncHistory = await authenticatedRequest(
      '/api/integrations/mercadolivre/sync/history',
      token
    );

    if (syncHistory && syncHistory.length > 0) {
      // Filtrar webhooks
      const webhooks = syncHistory.filter(item => 
        item.sync_type && item.sync_type.startsWith('webhook_')
      );

      if (webhooks.length > 0) {
        console.log(`\n✅ Encontrados ${webhooks.length} webhooks recebidos!\n`);

        // Exibir últimos webhooks
        const webhookRows = webhooks.slice(0, 10).map(webhook => {
          const details = typeof webhook.details === 'string' 
            ? JSON.parse(webhook.details) 
            : webhook.details;
          
          return [
            webhook.sync_type.replace('webhook_', ''),
            details._id || 'N/A',
            details.resource || 'N/A',
            webhook.status || 'N/A',
            formatDate(webhook.started_at)
          ];
        });

        printTable(
          '📨 ÚLTIMOS WEBHOOKS RECEBIDOS',
          ['Tipo', 'ID', 'Resource', 'Status', 'Data/Hora'],
          webhookRows
        );

        // Estatísticas por tipo
        const typeStats = {};
        webhooks.forEach(webhook => {
          const type = webhook.sync_type.replace('webhook_', '');
          if (!typeStats[type]) {
            typeStats[type] = { total: 0, success: 0, error: 0 };
          }
          typeStats[type].total++;
          if (webhook.status === 'success') typeStats[type].success++;
          if (webhook.status === 'error') typeStats[type].error++;
        });

        const statsRows = Object.entries(typeStats).map(([type, stats]) => [
          type,
          stats.total.toString(),
          stats.success.toString(),
          stats.error.toString(),
          ((stats.success / stats.total) * 100).toFixed(1) + '%'
        ]);

        printTable(
          '📈 ESTATÍSTICAS POR TIPO',
          ['Tipo', 'Total', 'Sucesso', 'Erro', 'Taxa Sucesso'],
          statsRows
        );

      } else {
        console.log('\n⚠️  Nenhum webhook recebido ainda.');
        console.log('💡 Dica: Faça uma compra de teste ou registre o webhook no DevCenter do ML.\n');
      }

      // Exibir outras sincronizações
      const otherSyncs = syncHistory.filter(item => 
        item.sync_type && !item.sync_type.startsWith('webhook_')
      );

      if (otherSyncs.length > 0) {
        const syncRows = otherSyncs.slice(0, 10).map(sync => [
          sync.sync_type || 'N/A',
          sync.status || 'N/A',
          formatDate(sync.started_at),
          formatDate(sync.completed_at)
        ]);

        printTable(
          '🔄 OUTRAS SINCRONIZAÇÕES',
          ['Tipo', 'Status', 'Início', 'Conclusão'],
          syncRows
        );
      }

    } else {
      console.log('\n⚠️  Nenhum histórico de sincronização encontrado.');
      console.log('💡 Dica: Execute uma sincronização manual ou aguarde webhooks.\n');
    }

    // 3. Buscar pedidos sincronizados
    console.log('\n📦 Buscando pedidos sincronizados...');
    try {
      const orders = await authenticatedRequest('/api/pedidos', token);
      
      if (orders && orders.length > 0) {
        console.log(`✅ Encontrados ${orders.length} pedidos no sistema!\n`);
        
        const orderRows = orders.slice(0, 5).map(order => [
          order.marketplace_order_id || order.id || 'N/A',
          order.status || 'N/A',
          order.customer_name || 'N/A',
          'R$ ' + (order.total_amount || 0).toFixed(2),
          formatDate(order.created_at)
        ]);

        printTable(
          '📦 ÚLTIMOS PEDIDOS',
          ['ID Pedido', 'Status', 'Cliente', 'Valor', 'Data'],
          orderRows
        );
      } else {
        console.log('⚠️  Nenhum pedido encontrado.');
      }
    } catch (error) {
      console.log('⚠️  Não foi possível buscar pedidos:', error.message);
    }

    // 4. Buscar produtos sincronizados
    console.log('\n🏷️  Buscando produtos sincronizados...');
    try {
      const products = await authenticatedRequest('/api/produtos', token);
      
      if (products && products.length > 0) {
        console.log(`✅ Encontrados ${products.length} produtos no sistema!\n`);
        
        const productRows = products.slice(0, 5).map(product => [
          product.marketplace_id || product.id || 'N/A',
          (product.name || product.title || 'N/A').substring(0, 30),
          'R$ ' + (product.price || 0).toFixed(2),
          product.stock?.toString() || 'N/A',
          product.status || 'N/A'
        ]);

        printTable(
          '🏷️  ÚLTIMOS PRODUTOS',
          ['ID Produto', 'Nome', 'Preço', 'Estoque', 'Status'],
          productRows
        );
      } else {
        console.log('⚠️  Nenhum produto encontrado.');
      }
    } catch (error) {
      console.log('⚠️  Não foi possível buscar produtos:', error.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Verificação concluída!');
    console.log('='.repeat(80));

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Registre o webhook no DevCenter do Mercado Livre');
    console.log('   2. Faça uma compra de teste para receber webhook real');
    console.log('   3. Execute sincronização manual: POST /api/integrations/mercadolivre/sync');
    console.log('   4. Monitore logs: railway logs --tail 100\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error('\n💡 Verifique se:');
    console.error('   - O sistema está online');
    console.error('   - As credenciais estão corretas');
    console.error('   - Você tem permissão para acessar os dados\n');
    process.exit(1);
  }
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
