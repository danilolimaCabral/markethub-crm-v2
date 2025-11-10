# Scripts de Sincronização de Dados

Este diretório contém scripts automatizados para extração e sincronização de dados reais do Lexos Hub e planilha Google Sheets.

## Scripts Disponíveis

### 1. extract-lexos-data.ts
Extrai dados do Lexos Hub (métricas, categorias, marketplaces).

**Execução manual:**
```bash
pnpm run sync:lexos
```

**Dados extraídos:**
- Total de vendas (últimos 30 dias)
- Total de pedidos
- Ticket médio
- Taxa de conferência
- Distribuição por categorias
- Distribuição por marketplaces

**Saída:** `data/lexos-data.json`

---

### 2. extract-google-sheets.ts
Extrai dados financeiros da planilha Google Sheets.

**Execução manual:**
```bash
pnpm run sync:sheets
```

**Dados extraídos:**
- Contas a pagar
- Contas a receber
- Contas vencidas
- Saldo projetado

**Saída:** `data/financial-data.json`

---

### 3. sync-data.ts
Script principal que executa ambas as extrações e consolida os dados.

**Execução manual:**
```bash
pnpm run sync:all
```

**Saída:**
- `data/consolidated-data.json` - Dados consolidados
- `data/sync-log.json` - Histórico de sincronizações

---

### 4. scheduler.ts
Agendador automático que executa `sync-data.ts` todos os dias às 8h da manhã.

**Iniciar agendador:**
```bash
pnpm run scheduler
```

**Características:**
- Executa automaticamente às 8:00 AM (horário de Brasília)
- Executa sincronização inicial ao iniciar
- Mantém logs de todas as execuções
- Roda em background até ser interrompido (Ctrl+C)

**Configuração do horário:**
O horário está configurado no arquivo `scheduler.ts` usando expressão cron:
```typescript
const cronExpression = '0 0 8 * * *'; // 8:00 AM todos os dias
```

Para alterar o horário, modifique a expressão cron:
- `0 0 8 * * *` = 8:00 AM
- `0 0 12 * * *` = 12:00 PM (meio-dia)
- `0 30 14 * * *` = 14:30 (2:30 PM)
- `0 0 */6 * * *` = A cada 6 horas

---

## Estrutura de Dados

### data/lexos-data.json
```json
{
  "lastUpdate": "2025-11-06T12:00:00.000Z",
  "metrics": {
    "totalVendas": 408262,
    "totalPedidos": 1231,
    "ticketMedio": 333,
    ...
  },
  "categories": [...],
  "marketplaces": [...],
  "pedidos": [...],
  "produtos": [...]
}
```

### data/financial-data.json
```json
{
  "lastUpdate": "2025-11-06T12:00:00.000Z",
  "contasPagar": [...],
  "contasReceber": [...],
  "metrics": {
    "totalPagar": 235648,
    "totalReceber": 39222,
    "saldoProjetado": -196426,
    ...
  }
}
```

### data/consolidated-data.json
```json
{
  "lastUpdate": "2025-11-06T12:00:00.000Z",
  "lexos": { ... },
  "financial": { ... },
  "summary": {
    "totalVendas": 408262,
    "totalPedidos": 1231,
    "contasPagar": 235648,
    "contasReceber": 39222,
    ...
  }
}
```

---

## Configuração em Produção

### Opção 1: PM2 (Recomendado)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar scheduler com PM2
pm2 start "pnpm run scheduler" --name "lexos-sync"

# Configurar para iniciar automaticamente no boot
pm2 startup
pm2 save

# Monitorar
pm2 logs lexos-sync
pm2 status
```

### Opção 2: Systemd (Linux)
Criar arquivo `/etc/systemd/system/lexos-sync.service`:
```ini
[Unit]
Description=Lexos Data Sync Scheduler
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/markethub-crm
ExecStart=/usr/bin/pnpm run scheduler
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ativar:
```bash
sudo systemctl enable lexos-sync
sudo systemctl start lexos-sync
sudo systemctl status lexos-sync
```

### Opção 3: Cron (Alternativa simples)
```bash
# Editar crontab
crontab -e

# Adicionar linha para executar às 8h
0 8 * * * cd /home/ubuntu/markethub-crm && pnpm run sync:all >> /var/log/lexos-sync.log 2>&1
```

---

## Logs e Monitoramento

### Visualizar logs de sincronização
```bash
cat data/sync-log.json | jq '.'
```

### Últimas 10 sincronizações
```bash
cat data/sync-log.json | jq '.[-10:]'
```

### Verificar última atualização
```bash
cat data/consolidated-data.json | jq '.lastUpdate'
```

---

## Troubleshooting

### Erro: "Cannot find module 'node-cron'"
```bash
pnpm install
```

### Erro: "Permission denied"
```bash
chmod +x scripts/*.ts
```

### Scheduler não está executando
1. Verificar se o processo está rodando: `ps aux | grep scheduler`
2. Verificar logs: `cat data/sync-log.json`
3. Executar manualmente: `pnpm run sync:all`

### Dados não estão sendo atualizados no CRM
1. Verificar se os arquivos JSON foram gerados em `data/`
2. Reiniciar o servidor de desenvolvimento: `pnpm run dev`
3. Verificar console do navegador para erros

---

## Manutenção

### Limpar logs antigos
```bash
rm data/sync-log.json
```

### Forçar sincronização manual
```bash
pnpm run sync:all
```

### Verificar integridade dos dados
```bash
cat data/consolidated-data.json | jq '.summary'
```

---

## Próximas Melhorias

- [ ] Implementar scraping real do Lexos Hub com Puppeteer
- [ ] Adicionar autenticação OAuth2 para Google Sheets
- [ ] Criar dashboard de monitoramento de sincronizações
- [ ] Implementar notificações em caso de falha
- [ ] Adicionar retry automático com backoff exponencial
- [ ] Criar testes automatizados para scripts
