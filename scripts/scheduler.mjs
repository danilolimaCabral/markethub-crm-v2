#!/usr/bin/env node
/**
 * Scheduler - Executa scraping periodicamente
 */

import { runScraper } from './lexos-scraper.mjs';
import cron from 'node-cron';

// Configurações
const SYNC_INTERVAL = process.env.SYNC_INTERVAL || '*/30 * * * *'; // A cada 30 minutos por padrão

console.log('🤖 Scheduler iniciado');
console.log(`📅 Intervalo de sincronização: ${SYNC_INTERVAL}`);

// Executar imediatamente na inicialização
console.log('🚀 Executando primeira sincronização...');
runScraper().catch(err => console.error('Erro na sincronização inicial:', err));

// Agendar execuções periódicas
cron.schedule(SYNC_INTERVAL, () => {
  console.log(`\n⏰ [${new Date().toISOString()}] Iniciando sincronização agendada...`);
  runScraper().catch(err => console.error('Erro na sincronização agendada:', err));
});

console.log('✅ Scheduler configurado e rodando');
console.log('Pressione Ctrl+C para parar\n');
