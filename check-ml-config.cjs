#!/usr/bin/env node

/**
 * Script para verificar configuração do Mercado Livre
 * Verifica credenciais, integração e produtos
 */

const https = require('https');

const API_BASE_URL = 'https://www.markthubcrm.com.br';
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data).token);
        } else {
          reject(new Error(`Login falhou: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Faz requisição autenticada
 */
async function apiRequest(path, token, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.markthubcrm.com.br',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Função principal
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Verificação de Configuração do Mercado Livre - MarketHub    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Login
    console.log('🔐 Fazendo login...');
    const token = await login();
    console.log('✅ Login realizado com sucesso!\n');

    // 2. Verificar status da integração
    console.log('🔍 Verificando status da integração...');
    const statusResponse = await apiRequest('/api/integrations/mercadolivre/status', token);
    
    console.log(`Status HTTP: ${statusResponse.status}`);
    
    if (statusResponse.status === 200) {
      const status = statusResponse.data;
      
      if (status.connected) {
        console.log('✅ CONECTADO ao Mercado Livre!\n');
        console.log('📊 Informações da Integração:');
        console.log(`   - Usuário ML: ${status.integration?.userInfo?.nickname || 'N/A'}`);
        console.log(`   - Email: ${status.integration?.userInfo?.email || 'N/A'}`);
        console.log(`   - ID ML: ${status.integration?.mlUserId || 'N/A'}`);
        console.log(`   - Última Sync: ${status.integration?.lastSync || 'Nunca'}\n`);
      } else {
        console.log('❌ NÃO CONECTADO ao Mercado Livre\n');
        console.log('💡 Motivo: Nenhuma integração ativa encontrada');
        console.log('💡 Ação: Clique em "Conectar com Mercado Livre" na interface\n');
      }
    } else if (statusResponse.status === 429) {
      console.log('⚠️  Rate limit ativo (429)');
      console.log('💡 Aguarde 10-15 minutos e tente novamente\n');
    } else {
      console.log(`❌ Erro: ${statusResponse.status}`);
      console.log(`Resposta: ${JSON.stringify(statusResponse.data, null, 2)}\n`);
    }

    // 3. Verificar produtos
    console.log('🏷️  Verificando produtos...');
    const productsResponse = await apiRequest('/api/produtos', token);
    
    if (productsResponse.status === 200) {
      const products = productsResponse.data;
      
      if (products && products.length > 0) {
        console.log(`✅ Encontrados ${products.length} produtos no sistema!\n`);
        
        // Filtrar produtos do ML
        const mlProducts = products.filter(p => 
          p.marketplace === 'mercado_livre' || p.marketplace_id
        );
        
        if (mlProducts.length > 0) {
          console.log(`📦 Produtos do Mercado Livre: ${mlProducts.length}`);
          console.log('\nÚltimos 3 produtos:');
          mlProducts.slice(0, 3).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.title || p.name || 'Sem nome'}`);
            console.log(`      ID ML: ${p.marketplace_id || 'N/A'}`);
            console.log(`      Preço: R$ ${(p.price || 0).toFixed(2)}`);
            console.log(`      Estoque: ${p.stock || p.availableQuantity || 0}`);
          });
        } else {
          console.log('⚠️  Nenhum produto do Mercado Livre encontrado');
          console.log('💡 Execute sincronização de produtos na interface\n');
        }
      } else {
        console.log('⚠️  Nenhum produto encontrado no sistema');
        console.log('💡 Execute sincronização de produtos após conectar\n');
      }
    } else if (productsResponse.status === 429) {
      console.log('⚠️  Rate limit ativo (429)\n');
    } else {
      console.log(`❌ Erro ao buscar produtos: ${productsResponse.status}\n`);
    }

    // 4. Verificar pedidos
    console.log('📦 Verificando pedidos...');
    const ordersResponse = await apiRequest('/api/pedidos', token);
    
    if (ordersResponse.status === 200) {
      const orders = ordersResponse.data;
      
      if (orders && orders.length > 0) {
        console.log(`✅ Encontrados ${orders.length} pedidos no sistema!\n`);
        
        // Filtrar pedidos do ML
        const mlOrders = orders.filter(o => 
          o.marketplace === 'mercado_livre' || o.marketplace_order_id
        );
        
        if (mlOrders.length > 0) {
          console.log(`📦 Pedidos do Mercado Livre: ${mlOrders.length}`);
          console.log('\nÚltimos 3 pedidos:');
          mlOrders.slice(0, 3).forEach((o, i) => {
            console.log(`   ${i + 1}. Pedido #${o.marketplace_order_id || o.id}`);
            console.log(`      Status: ${o.status || 'N/A'}`);
            console.log(`      Valor: R$ ${(o.total_amount || o.totalAmount || 0).toFixed(2)}`);
            console.log(`      Cliente: ${o.customer_name || o.buyerNickname || 'N/A'}`);
          });
        } else {
          console.log('⚠️  Nenhum pedido do Mercado Livre encontrado\n');
        }
      } else {
        console.log('⚠️  Nenhum pedido encontrado no sistema\n');
      }
    } else if (ordersResponse.status === 429) {
      console.log('⚠️  Rate limit ativo (429)\n');
    } else {
      console.log(`❌ Erro ao buscar pedidos: ${ordersResponse.status}\n`);
    }

    // 5. Resumo
    console.log('═'.repeat(64));
    console.log('📋 RESUMO');
    console.log('═'.repeat(64));
    
    if (statusResponse.status === 200 && statusResponse.data.connected) {
      console.log('✅ Integração: CONECTADA');
    } else {
      console.log('❌ Integração: NÃO CONECTADA');
    }
    
    if (productsResponse.status === 200 && productsResponse.data && productsResponse.data.length > 0) {
      console.log(`✅ Produtos: ${productsResponse.data.length} encontrados`);
    } else {
      console.log('❌ Produtos: Nenhum encontrado');
    }
    
    if (ordersResponse.status === 200 && ordersResponse.data && ordersResponse.data.length > 0) {
      console.log(`✅ Pedidos: ${ordersResponse.data.length} encontrados`);
    } else {
      console.log('⚠️  Pedidos: Nenhum encontrado');
    }
    
    console.log('═'.repeat(64));

    console.log('\n💡 PRÓXIMOS PASSOS:\n');
    
    if (statusResponse.status === 429) {
      console.log('   1. ⏰ Aguarde 10-15 minutos (rate limit)');
      console.log('   2. 🔄 Execute este script novamente');
      console.log('   3. 🔗 Tente conectar na interface\n');
    } else if (!statusResponse.data?.connected) {
      console.log('   1. 🔗 Clique em "Conectar com Mercado Livre" na interface');
      console.log('   2. ✅ Autorize o acesso no Mercado Livre');
      console.log('   3. 🔄 Execute sincronização de produtos');
      console.log('   4. 📊 Verifique dados na interface\n');
    } else {
      console.log('   1. ✅ Integração está ativa!');
      console.log('   2. 🔄 Execute sincronização se produtos não aparecem');
      console.log('   3. 📊 Verifique dados na interface\n');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    
    if (error.message.includes('429')) {
      console.error('\n💡 Rate limit ativo. Aguarde 10-15 minutos e tente novamente.\n');
    } else {
      console.error('\n💡 Verifique se:');
      console.error('   - O sistema está online');
      console.error('   - As credenciais estão corretas');
      console.error('   - Não há problemas de rede\n');
    }
    
    process.exit(1);
  }
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
