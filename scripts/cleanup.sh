#!/bin/bash

# Script de Limpeza de Processos Órfãos
# MarketHub CRM - Previne "too many open files"

echo "🧹 Iniciando limpeza de processos órfãos..."
echo ""

# Contador de processos mortos
KILLED=0

# 1. Matar processos Vite órfãos
echo "1️⃣  Procurando processos Vite..."
VITE_PIDS=$(pgrep -f "vite.*--host" 2>/dev/null)
if [ ! -z "$VITE_PIDS" ]; then
  echo "   Encontrados: $VITE_PIDS"
  kill -9 $VITE_PIDS 2>/dev/null
  KILLED=$((KILLED + $(echo $VITE_PIDS | wc -w)))
  echo "   ✅ Vite limpo"
else
  echo "   ✅ Nenhum processo Vite órfão"
fi

# 2. Matar processos TSX/Scheduler órfãos
echo "2️⃣  Procurando processos TSX/Scheduler..."
TSX_PIDS=$(pgrep -f "tsx.*scheduler" 2>/dev/null)
if [ ! -z "$TSX_PIDS" ]; then
  echo "   Encontrados: $TSX_PIDS"
  kill -9 $TSX_PIDS 2>/dev/null
  KILLED=$((KILLED + $(echo $TSX_PIDS | wc -w)))
  echo "   ✅ TSX limpo"
else
  echo "   ✅ Nenhum processo TSX órfão"
fi

# 3. Matar processos TypeScript Compiler órfãos
echo "3️⃣  Procurando processos TSC..."
TSC_PIDS=$(pgrep -f "tsc.*--watch" 2>/dev/null)
if [ ! -z "$TSC_PIDS" ]; then
  echo "   Encontrados: $TSC_PIDS"
  kill -9 $TSC_PIDS 2>/dev/null
  KILLED=$((KILLED + $(echo $TSC_PIDS | wc -w)))
  echo "   ✅ TSC limpo"
else
  echo "   ✅ Nenhum processo TSC órfão"
fi

# 4. Matar processos Node defunct (zumbis)
echo "4️⃣  Procurando processos Node defunct..."
DEFUNCT_PIDS=$(ps aux | grep '[n]ode.*<defunct>' | awk '{print $2}' 2>/dev/null)
if [ ! -z "$DEFUNCT_PIDS" ]; then
  echo "   Encontrados: $DEFUNCT_PIDS"
  kill -9 $DEFUNCT_PIDS 2>/dev/null
  KILLED=$((KILLED + $(echo $DEFUNCT_PIDS | wc -w)))
  echo "   ✅ Zumbis limpos"
else
  echo "   ✅ Nenhum processo zumbi"
fi

# 5. Limpar cache do Vite
echo "5️⃣  Limpando cache do Vite..."
if [ -d "node_modules/.vite" ]; then
  rm -rf node_modules/.vite
  echo "   ✅ Cache limpo"
else
  echo "   ✅ Cache já limpo"
fi

# 6. Verificar arquivos abertos
echo "6️⃣  Verificando arquivos abertos..."
OPEN_FILES=$(lsof 2>/dev/null | wc -l)
echo "   📊 Arquivos abertos: $OPEN_FILES"

if [ $OPEN_FILES -gt 50000 ]; then
  echo "   ⚠️  AVISO: Muitos arquivos abertos ($OPEN_FILES)"
  echo "   💡 Considere reiniciar o sandbox"
elif [ $OPEN_FILES -gt 30000 ]; then
  echo "   ⚠️  Atenção: Arquivos abertos acima do normal ($OPEN_FILES)"
else
  echo "   ✅ Quantidade de arquivos OK"
fi

# Resumo
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Limpeza concluída!"
echo "   Processos mortos: $KILLED"
echo "   Arquivos abertos: $OPEN_FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Aguardar 2 segundos para processos finalizarem
sleep 2

exit 0
