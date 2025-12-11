/**
 * Script de teste de integrações
 * Verifica se todas as integrações estão configuradas corretamente
 */

import dotenv from 'dotenv';
dotenv.config();

interface IntegrationStatus {
  name: string;
  configured: boolean;
  variables: string[];
  missing: string[];
  status: 'OK' | 'PARTIAL' | 'NOT_CONFIGURED';
}

const integrations: IntegrationStatus[] = [];

// Mercado Livre
const mlVars = ['ML_CLIENT_ID', 'ML_CLIENT_SECRET', 'ML_REDIRECT_URI'];
const mlMissing = mlVars.filter(v => !process.env[v]);
integrations.push({
  name: 'Mercado Livre',
  configured: mlMissing.length === 0,
  variables: mlVars,
  missing: mlMissing,
  status: mlMissing.length === 0 ? 'OK' : mlMissing.length < mlVars.length ? 'PARTIAL' : 'NOT_CONFIGURED'
});

// Stripe (Pagamentos)
const stripeVars = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'];
const stripeMissing = stripeVars.filter(v => !process.env[v]);
integrations.push({
  name: 'Stripe (Pagamentos)',
  configured: stripeMissing.length === 0,
  variables: stripeVars,
  missing: stripeMissing,
  status: stripeMissing.length === 0 ? 'OK' : stripeMissing.length < stripeVars.length ? 'PARTIAL' : 'NOT_CONFIGURED'
});

// Database
const dbVars = ['DATABASE_URL'];
const dbMissing = dbVars.filter(v => !process.env[v]);
integrations.push({
  name: 'Database (PostgreSQL)',
  configured: dbMissing.length === 0,
  variables: dbVars,
  missing: dbMissing,
  status: dbMissing.length === 0 ? 'OK' : 'NOT_CONFIGURED'
});

// Redis (Cache)
const redisVars = ['REDIS_URL'];
const redisMissing = redisVars.filter(v => !process.env[v]);
integrations.push({
  name: 'Redis (Cache)',
  configured: redisMissing.length === 0,
  variables: redisVars,
  missing: redisMissing,
  status: redisMissing.length === 0 ? 'OK' : 'NOT_CONFIGURED'
});

// Email (SMTP)
const emailVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const emailMissing = emailVars.filter(v => !process.env[v]);
integrations.push({
  name: 'Email (SMTP)',
  configured: emailMissing.length === 0,
  variables: emailVars,
  missing: emailMissing,
  status: emailMissing.length === 0 ? 'OK' : emailMissing.length < emailVars.length ? 'PARTIAL' : 'NOT_CONFIGURED'
});

// AI Assistant (Gemini)
const aiVars = ['GOOGLE_GEMINI_API_KEY'];
const aiMissing = aiVars.filter(v => !process.env[v]);
integrations.push({
  name: 'AI Assistant (Gemini)',
  configured: aiMissing.length === 0,
  variables: aiVars,
  missing: aiMissing,
  status: aiMissing.length === 0 ? 'OK' : 'NOT_CONFIGURED'
});

// Sentry (Monitoramento)
const sentryVars = ['SENTRY_DSN'];
const sentryMissing = sentryVars.filter(v => !process.env[v]);
integrations.push({
  name: 'Sentry (Monitoramento)',
  configured: sentryMissing.length === 0,
  variables: sentryVars,
  missing: sentryMissing,
  status: sentryMissing.length === 0 ? 'OK' : 'NOT_CONFIGURED'
});

// Exibir resultados
console.log('\n==============================================');
console.log('  VERIFICAÇÃO DE INTEGRAÇÕES - Markthub CRM');
console.log('==============================================\n');

integrations.forEach(integration => {
  const statusIcon = integration.status === 'OK' ? '✅' : integration.status === 'PARTIAL' ? '⚠️' : '❌';
  console.log(`${statusIcon} ${integration.name}`);
  console.log(`   Status: ${integration.status}`);
  
  if (integration.missing.length > 0) {
    console.log(`   Variáveis faltando: ${integration.missing.join(', ')}`);
  }
  console.log('');
});

// Resumo
const ok = integrations.filter(i => i.status === 'OK').length;
const partial = integrations.filter(i => i.status === 'PARTIAL').length;
const notConfigured = integrations.filter(i => i.status === 'NOT_CONFIGURED').length;

console.log('==============================================');
console.log('RESUMO:');
console.log(`✅ Configuradas: ${ok}/${integrations.length}`);
console.log(`⚠️  Parcialmente: ${partial}/${integrations.length}`);
console.log(`❌ Não configuradas: ${notConfigured}/${integrations.length}`);
console.log('==============================================\n');

// Exit code
process.exit(notConfigured > 0 ? 1 : 0);
