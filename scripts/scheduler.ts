/**
 * Agendador Automático de Sincronização de Dados
 * Executa sync-data.ts todos os dias às 8h da manhã
 */

import cron from 'node-cron';
import { syncAllData } from './sync-data';

console.log('🚀 Iniciando agendador de sincronização...\n');

// Agendar para executar todos os dias às 8h (horário de Brasília)
// Formato: segundos minutos horas dia mês dia-da-semana
const cronExpression = '0 0 8 * * *'; // 8:00 AM todos os dias

console.log(`📅 Agendado para executar diariamente às 8:00 AM`);
console.log(`⏰ Expressão cron: ${cronExpression}\n`);

// Criar tarefa agendada
const task = cron.schedule(cronExpression, async () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🔔 Executando sincronização agendada - ${new Date().toLocaleString('pt-BR')}`);
  console.log('='.repeat(60) + '\n');
  
  try {
    await syncAllData();
    console.log('\n✅ Sincronização agendada concluída com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro na sincronização agendada:', error);
  }
  
  console.log('='.repeat(60) + '\n');
}, {
  scheduled: true,
  timezone: "America/Sao_Paulo" // Horário de Brasília
});

// Executar imediatamente na inicialização (opcional)
console.log('🔄 Executando sincronização inicial...\n');
syncAllData()
  .then(() => {
    console.log('\n✅ Sincronização inicial concluída!');
    console.log(`⏰ Próxima execução agendada para: ${getNextExecutionTime()}\n`);
  })
  .catch((error) => {
    console.error('\n❌ Erro na sincronização inicial:', error);
  });

// Função auxiliar para mostrar próxima execução
function getNextExecutionTime(): string {
  const now = new Date();
  const next = new Date(now);
  
  // Se já passou das 8h hoje, agendar para amanhã
  if (now.getHours() >= 8) {
    next.setDate(next.getDate() + 1);
  }
  
  next.setHours(8, 0, 0, 0);
  
  return next.toLocaleString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Manter o processo rodando
process.on('SIGINT', () => {
  console.log('\n\n🛑 Encerrando agendador...');
  task.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Encerrando agendador...');
  task.stop();
  process.exit(0);
});

console.log('✅ Agendador iniciado e rodando em background');
console.log('💡 Pressione Ctrl+C para encerrar\n');
