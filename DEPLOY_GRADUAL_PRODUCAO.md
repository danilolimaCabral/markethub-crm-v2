# 🚀 DEPLOY GRADUAL EM PRODUÇÃO (Canary/Blue-Green)

**Data:** 13/11/2025  
**Objetivo:** Deploy seguro com rollback automático  
**Tempo Estimado:** 4-6 horas de implementação  

---

## 🎯 O QUE É DEPLOY GRADUAL?

Deploy gradual (também chamado de **Canary Deployment**) é uma estratégia onde:
- ✅ Nova versão é deployed para **pequena porcentagem** de usuários primeiro
- ✅ Monitora-se métricas de erro/performance
- ✅ Se estável, aumenta-se gradualmente a porcentagem
- ✅ Se houver problemas, faz-se rollback automático

### Benefícios

- 🛡️ **Segurança:** Limita impacto de bugs em produção
- 🔄 **Rollback Rápido:** Volta à versão anterior em segundos
- 📊 **Validação Real:** Testa com tráfego real de produção
- 👥 **Experiência do Usuário:** Maioria dos usuários não vê bugs

---

## 📊 ESTRATÉGIAS DE DEPLOY

### 1. Canary Deployment (Recomendado) ⭐

```
Fase 1: 5%  de usuários → Nova versão
        95% de usuários → Versão antiga
        ↓ (Monitorar 30min)
        
Fase 2: 25% de usuários → Nova versão
        75% de usuários → Versão antiga
        ↓ (Monitorar 1h)
        
Fase 3: 50% de usuários → Nova versão
        50% de usuários → Versão antiga
        ↓ (Monitorar 2h)
        
Fase 4: 100% de usuários → Nova versão ✅
```

**Vantagens:**
- ✅ Impacto limitado de bugs
- ✅ Fácil de implementar
- ✅ Rollback rápido

### 2. Blue-Green Deployment

```
Ambiente Blue  (Atual) → 100% tráfego
Ambiente Green (Novo)  → 0% tráfego
                           ↓
Deploy completo no Green  
Testes no Green
                           ↓
Switch: Blue → 0%
        Green → 100% ✅
```

**Vantagens:**
- ✅ Zero downtime
- ✅ Rollback instantâneo (volta para Blue)
- ❌ Requer 2x recursos (Blue + Green)

### 3. Rolling Deployment

```
Servidor 1 → Deploy → Pronto ✅
Servidor 2 → Deploy → Pronto ✅
Servidor 3 → Deploy → Pronto ✅
Servidor 4 → Deploy → Pronto ✅
```

**Vantagens:**
- ✅ Não requer recursos extras
- ❌ Mais lento
- ❌ Versões mistas durante deploy

---

## 🚀 IMPLEMENTAÇÃO - RAILWAY + CLOUDFLARE

### Arquitetura Recomendada

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                       │
│               (Load Balancer + Cache)                   │
└─────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │  Railway     │    │  Railway     │
        │  Prod (Old)  │    │  Canary      │
        │              │    │  (New)       │
        │  95% tráfego │    │  5% tráfego  │
        └──────────────┘    └──────────────┘
```

### Passo 1: Configurar Cloudflare Load Balancer

#### 1.1. Adicionar Domínio ao Cloudflare

```bash
# 1. Acesse cloudflare.com
# 2. Adicione seu domínio: markthubcrm.com.br
# 3. Atualize nameservers no Registro.br
```

#### 1.2. Criar Load Balancer

```yaml
# Via Cloudflare Dashboard → Traffic → Load Balancing

Load Balancer: markthub-production
  └─ Pool: production-main (95% weight)
      └─ Origin: main.markthubcrm.com.br (Railway prod)
  └─ Pool: production-canary (5% weight)
      └─ Origin: canary.markthubcrm.com.br (Railway canary)

Health Check:
  - Path: /api/health
  - Interval: 60s
  - Timeout: 5s
  - Retries: 2
```

### Passo 2: Criar Ambiente Canary no Railway

```bash
# Criar projeto canary
railway init --name markethub-canary

# Configurar environment
railway environment canary

# Copiar variáveis de produção
railway variables copy --from production --to canary

# Deploy canary
railway up --environment canary
```

### Passo 3: Configurar Workflow de Deploy Gradual

#### `.github/workflows/deploy-production-gradual.yml`

```yaml
name: Deploy Gradual Production

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      phase:
        description: 'Deploy phase'
        required: true
        default: 'canary-5'
        type: choice
        options:
          - canary-5    # 5% dos usuários
          - canary-25   # 25% dos usuários
          - canary-50   # 50% dos usuários
          - full-100    # 100% dos usuários
          - rollback    # Voltar versão anterior

jobs:
  # Fase 1: Deploy Canary (5%)
  deploy-canary-5:
    if: github.event.inputs.phase == 'canary-5' || github.ref_type == 'tag'
    runs-on: ubuntu-latest
    environment:
      name: production-canary
      url: https://canary.markthubcrm.com.br
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup and Build
        run: |
          pnpm install
          pnpm test
          pnpm build

      - name: Deploy to Canary
        run: |
          railway link ${{ secrets.RAILWAY_CANARY_PROJECT_ID }}
          railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Configure Cloudflare (5%)
        run: |
          # Configurar load balancer: 95% main, 5% canary
          curl -X PATCH \
            "https://api.cloudflare.com/client/v4/zones/${{ secrets.CF_ZONE_ID }}/load_balancers/${{ secrets.CF_LB_ID }}" \
            -H "Authorization: Bearer ${{ secrets.CF_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "default_pools": {
                "production-main": { "weight": 95 },
                "production-canary": { "weight": 5 }
              }
            }'

      - name: Notify deployment
        run: |
          echo "🐤 Canary deployment (5%) successful!"
          echo "Monitor for 30 minutes before proceeding to 25%"

  # Monitor Canary
  monitor-canary:
    needs: deploy-canary-5
    runs-on: ubuntu-latest
    
    steps:
      - name: Monitor metrics
        run: |
          echo "Monitoring canary deployment..."
          
          # Verificar error rate
          ERROR_RATE=$(curl -s "https://canary.markthubcrm.com.br/api/metrics/errors" | jq '.rate')
          
          if [ "$ERROR_RATE" -gt 5 ]; then
            echo "❌ Error rate too high: $ERROR_RATE%"
            echo "Triggering automatic rollback..."
            exit 1
          fi
          
          echo "✅ Error rate OK: $ERROR_RATE%"

      - name: Check response time
        run: |
          # Verificar response time médio
          AVG_TIME=$(curl -w "%{time_total}" -o /dev/null -s https://canary.markthubcrm.com.br/api/health)
          
          if (( $(echo "$AVG_TIME > 2.0" | bc -l) )); then
            echo "❌ Response time too slow: ${AVG_TIME}s"
            exit 1
          fi
          
          echo "✅ Response time OK: ${AVG_TIME}s"

  # Fase 2: Expandir para 25%
  deploy-canary-25:
    if: github.event.inputs.phase == 'canary-25'
    runs-on: ubuntu-latest
    
    steps:
      - name: Update Cloudflare (25%)
        run: |
          curl -X PATCH \
            "https://api.cloudflare.com/client/v4/zones/${{ secrets.CF_ZONE_ID }}/load_balancers/${{ secrets.CF_LB_ID }}" \
            -H "Authorization: Bearer ${{ secrets.CF_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "default_pools": {
                "production-main": { "weight": 75 },
                "production-canary": { "weight": 25 }
              }
            }'
      
      - name: Monitor for 1 hour
        run: |
          echo "🐤 Canary at 25%. Monitor for 1 hour."

  # Fase 3: Expandir para 50%
  deploy-canary-50:
    if: github.event.inputs.phase == 'canary-50'
    runs-on: ubuntu-latest
    
    steps:
      - name: Update Cloudflare (50%)
        run: |
          curl -X PATCH \
            "https://api.cloudflare.com/client/v4/zones/${{ secrets.CF_ZONE_ID }}/load_balancers/${{ secrets.CF_LB_ID }}" \
            -H "Authorization: Bearer ${{ secrets.CF_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "default_pools": {
                "production-main": { "weight": 50 },
                "production-canary": { "weight": 50 }
              }
            }'

  # Fase 4: Deploy completo (100%)
  deploy-full-100:
    if: github.event.inputs.phase == 'full-100'
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to Main Production
        run: |
          # Deploy na produção principal
          railway link ${{ secrets.RAILWAY_PRODUCTION_PROJECT_ID }}
          railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Update Cloudflare (100%)
        run: |
          # Direcionar 100% para produção principal
          curl -X PATCH \
            "https://api.cloudflare.com/client/v4/zones/${{ secrets.CF_ZONE_ID }}/load_balancers/${{ secrets.CF_LB_ID }}" \
            -H "Authorization: Bearer ${{ secrets.CF_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "default_pools": {
                "production-main": { "weight": 100 },
                "production-canary": { "weight": 0 }
              }
            }'

      - name: Success notification
        run: |
          echo "🎉 Full deployment successful!"
          echo "Version: ${{ github.ref_name }}"

  # Rollback Automático
  rollback:
    if: failure() || github.event.inputs.phase == 'rollback'
    runs-on: ubuntu-latest
    
    steps:
      - name: Rollback Cloudflare
        run: |
          # Voltar 100% para produção principal (versão antiga)
          curl -X PATCH \
            "https://api.cloudflare.com/client/v4/zones/${{ secrets.CF_ZONE_ID }}/load_balancers/${{ secrets.CF_LB_ID }}" \
            -H "Authorization: Bearer ${{ secrets.CF_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "default_pools": {
                "production-main": { "weight": 100 },
                "production-canary": { "weight": 0 }
              }
            }'

      - name: Rollback Railway
        run: |
          railway link ${{ secrets.RAILWAY_CANARY_PROJECT_ID }}
          railway rollback
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Alert team
        run: |
          echo "🚨 ROLLBACK EXECUTED!"
          echo "Canary deployment failed. Reverted to stable version."
          # Adicionar notificação Slack/Discord aqui
```

---

## 📊 MÉTRICAS PARA MONITORAR

### Métricas Críticas

```javascript
// /api/metrics/canary-health
{
  "version": "v2.2.0",
  "deployment": "canary",
  "traffic_percentage": 5,
  
  "metrics": {
    "error_rate": 0.3,        // % de requisições com erro
    "avg_response_time": 250,  // ms
    "requests_per_minute": 1200,
    "active_users": 45,
    
    // Comparação com produção principal
    "vs_production": {
      "error_rate_diff": "+0.1%",      // Aceitável se < 1%
      "response_time_diff": "+15ms",   // Aceitável se < 200ms
      "cpu_usage_diff": "+2%",
      "memory_usage_diff": "+1%"
    }
  },
  
  "health": "healthy",  // healthy | degraded | critical
  "recommendation": "continue" // continue | hold | rollback
}
```

### Thresholds de Alerta

```yaml
Canary Health Thresholds:

CRITICAL (Rollback Automático):
  - error_rate > 5%
  - error_rate_increase > 200% vs production
  - avg_response_time > 3000ms
  - cpu_usage > 90%
  - memory_usage > 95%

WARNING (Hold Deploy):
  - error_rate > 2%
  - error_rate_increase > 100% vs production
  - avg_response_time > 1500ms
  - cpu_usage > 75%
  - memory_usage > 80%

HEALTHY (Continue):
  - error_rate < 1%
  - avg_response_time < 500ms
  - cpu_usage < 60%
  - memory_usage < 70%
```

---

## 🔧 IMPLEMENTAÇÃO SEM CLOUDFLARE (Railway Only)

Se não quiser usar Cloudflare, pode usar apenas Railway:

### Opção: Railway Replicas

```bash
# Produção principal (3 replicas)
railway up --replicas 3

# Canary (1 replica)
railway up --environment canary --replicas 1

# Railway faz load balancing automaticamente
# Resultado: 75% main, 25% canary (3:1 ratio)
```

**Limitações:**
- ❌ Não tem controle fino de porcentagem
- ❌ Mínimo é 25% (1:3 ratio)
- ✅ Mais simples de configurar
- ✅ Grátis (sem Cloudflare)

---

## 📋 CHECKLIST DE DEPLOY GRADUAL

### Pré-Deploy
- [ ] Staging testado e aprovado
- [ ] Backup do banco de dados
- [ ] Rollback plan documentado
- [ ] Team avisado sobre deploy
- [ ] Monitoramento configurado

### Fase 1: Canary 5% (30 min)
- [ ] Deploy canary executado
- [ ] Load balancer configurado (5%)
- [ ] Health check passando
- [ ] Métricas normais
- [ ] Sem erros críticos

### Fase 2: Canary 25% (1 hora)
- [ ] Expandido para 25%
- [ ] Métricas monitoradas
- [ ] Performance OK
- [ ] Feedback de usuários OK

### Fase 3: Canary 50% (2 horas)
- [ ] Expandido para 50%
- [ ] Carga balanceada
- [ ] Sistema estável
- [ ] Logs limpos

### Fase 4: Full Deploy 100%
- [ ] Deploy produção principal
- [ ] 100% tráfego migrado
- [ ] Canary desligado
- [ ] Verificação final
- [ ] Comunicação de sucesso

---

## 🚨 PLANO DE ROLLBACK

### Rollback Manual (< 5 minutos)

```bash
# Via GitHub Actions
gh workflow run deploy-production-gradual.yml \
  -f phase=rollback

# Ou via Cloudflare Dashboard
# 1. Traffic → Load Balancing
# 2. Editar load balancer
# 3. Colocar 100% weight em production-main
# 4. Salvar

# Ou via Railway
railway link $RAILWAY_CANARY_PROJECT_ID
railway rollback
```

### Rollback Automático (< 30 segundos)

O workflow acima já inclui rollback automático se:
- Error rate > 5%
- Response time > 3s
- Testes de health falharem
- CPU/Memory > 90%

---

## 💰 CUSTOS

### Com Cloudflare

```
Cloudflare Load Balancer:
- $5/mês (primeiro load balancer)
- $5/mês por load balancer adicional
- Health checks inclusos

Railway:
- Produção: $20-50/mês
- Canary: $10-25/mês (durante deploy)
- Total: $35-80/mês
```

### Sem Cloudflare (Railway Only)

```
Railway:
- Produção (3 replicas): $30-60/mês
- Canary (1 replica): $10-20/mês
- Total: $40-80/mês
```

---

## ✅ CONCLUSÃO

### Recomendação: Implementação Faseada

**Semana 1: Setup Básico**
- Criar ambiente canary no Railway
- Configurar workflow básico
- Testar deploy manual

**Semana 2: Automação**
- Implementar workflow completo
- Configurar monitoramento
- Testar rollback

**Semana 3: Cloudflare (Opcional)**
- Configurar load balancer
- Migrar DNS
- Testar deploy gradual

**Semana 4: Produção**
- Primeiro deploy gradual real
- Monitorar e ajustar
- Documentar lições aprendidas

---

**Status:** ✅ GUIA COMPLETO  
**Tempo de Implementação:** 4-6 horas (básico) ou 2-3 dias (completo)  
**Pronto para:** Implementação em produção  

