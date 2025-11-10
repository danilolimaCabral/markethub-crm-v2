/**
 * Configuração PM2 para Scheduler de Sincronização
 * 
 * Uso:
 *   pm2 start ecosystem.config.js
 *   pm2 logs markethub-sync
 *   pm2 restart markethub-sync
 *   pm2 stop markethub-sync
 *   pm2 delete markethub-sync
 */

module.exports = {
  apps: [
    {
      name: 'markethub-sync',
      script: 'pnpm',
      args: 'run scheduler',
      cwd: '/home/ubuntu/markethub-crm',
      
      // Configurações de execução
      instances: 1,
      exec_mode: 'fork',
      
      // Auto-restart
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // Restart em caso de falha
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,
      
      // Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Variáveis de ambiente
      env: {
        NODE_ENV: 'production',
        TZ: 'America/Sao_Paulo'
      },
      
      // Configurações adicionais
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true
    }
  ]
};
