# 🧹 Guia de Uso do Script de Limpeza

## O Que é o Script cleanup.sh?

O `cleanup.sh` é um script automatizado que **limpa processos órfãos** e **reduz o número de arquivos abertos** para prevenir o erro **"EMFILE: too many open files"**.

## 🚨 Quando Usar?

Use o script de limpeza quando:

1. **Servidor de desenvolvimento não inicia**
   - Erro: `EMFILE: too many open files`
   - Erro: `Error: watch ENOSPC`

2. **Sistema está lento**
   - Muitos processos Node.js rodando
   - CPU/memória alta sem motivo

3. **Antes de iniciar desenvolvimento**
   - Garantir ambiente limpo
   - Evitar conflitos de porta

4. **Após parar servidor abruptamente**
   - Ctrl+C não finalizou processos
   - Processos zumbis (defunct)

## 📖 Como Usar

### Opção 1: Executar Diretamente

```bash
cd /home/ubuntu/lexos-hub-web
bash scripts/cleanup.sh
```

### Opção 2: Via npm/pnpm (Recomendado)

```bash
cd /home/ubuntu/lexos-hub-web
pnpm cleanup
```

### Opção 3: Antes de Iniciar Dev Server (Mais Seguro)

```bash
cd /home/ubuntu/lexos-hub-web
pnpm dev:safe
```

Este comando executa:
1. `cleanup.sh` (limpa processos)
2. Aguarda 2 segundos
3. Inicia `vite --host` (servidor limpo)

## 🔍 O Que o Script Faz?

### 1. Mata Processos Vite Órfãos
- Processos `vite --host` que não foram finalizados
- Libera porta 3000

### 2. Mata Processos TSX/Scheduler
- Scripts `tsx scripts/scheduler.ts` órfãos
- Reduz file watchers

### 3. Mata Processos TypeScript Compiler
- Processos `tsc --watch` travados
- Libera recursos

### 4. Mata Processos Node Defunct (Zumbis)
- Processos `<defunct>` que não respondem
- Limpa memória

### 5. Limpa Cache do Vite
- Remove `node_modules/.vite`
- Força rebuild limpo

### 6. Verifica Arquivos Abertos
- Conta total de arquivos abertos
- Alerta se acima de 30.000

## 📊 Saída do Script

```bash
🧹 Iniciando limpeza de processos órfãos...

1️⃣  Procurando processos Vite...
   ✅ Nenhum processo Vite órfão

2️⃣  Procurando processos TSX/Scheduler...
   Encontrados: 211587 211588 211604
   ✅ TSX limpo

3️⃣  Procurando processos TSC...
   ✅ Nenhum processo TSC órfão

4️⃣  Procurando processos Node defunct...
   Encontrados: 147756
   ✅ Zumbis limpos

5️⃣  Limpando cache do Vite...
   ✅ Cache limpo

6️⃣  Verificando arquivos abertos...
   📊 Arquivos abertos: 45631
   ⚠️  Atenção: Arquivos abertos acima do normal (45631)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Limpeza concluída!
   Processos mortos: 4
   Arquivos abertos: 45631
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ⚠️ Interpretando os Alertas

### ✅ Arquivos OK (< 30.000)
```
📊 Arquivos abertos: 15234
✅ Quantidade de arquivos OK
```
**Ação:** Nenhuma. Sistema saudável.

### ⚠️ Atenção (30.000 - 50.000)
```
📊 Arquivos abertos: 45631
⚠️  Atenção: Arquivos abertos acima do normal
```
**Ação:** Execute `pnpm dev:safe` ao invés de `pnpm dev`.

### 🚨 Crítico (> 50.000)
```
📊 Arquivos abertos: 52341
⚠️  AVISO: Muitos arquivos abertos (52341)
💡 Considere reiniciar o sandbox
```
**Ação:** 
1. Execute o cleanup: `pnpm cleanup`
2. Se não resolver, reinicie o sandbox
3. Use `pnpm dev:safe` sempre

## 🛠️ Scripts Disponíveis

### `pnpm dev`
Inicia servidor **SEM** limpeza prévia.
```bash
pnpm dev
```
**Use quando:** Sistema está limpo (primeira vez).

### `pnpm dev:safe` ⭐ (Recomendado)
Limpa processos **ANTES** de iniciar servidor.
```bash
pnpm dev:safe
```
**Use quando:** 
- Sistema teve erro anterior
- Muitos arquivos abertos
- Desenvolvimento diário (mais seguro)

### `pnpm cleanup`
Apenas limpa processos, **NÃO** inicia servidor.
```bash
pnpm cleanup
```
**Use quando:**
- Quer apenas limpar
- Antes de fazer build
- Antes de publicar

### `pnpm check-files`
Verifica quantos arquivos estão abertos.
```bash
pnpm check-files
# Saída: 45631
```
**Use quando:**
- Quer monitorar sistema
- Antes de iniciar dev server
- Diagnosticar problemas

## 🔧 Configurações Adicionais

### vite.config.ts

O arquivo `vite.config.ts` foi configurado para **ignorar diretórios grandes**:

```typescript
server: {
  watch: {
    ignored: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/logs/**',
      '**/data/**',
      '**/database/**',
      '**/diagrams/**',
      '**/*.md',
      '**/apresentacao-*/**'
    ],
    usePolling: false,
  }
}
```

Isso reduz drasticamente o número de file watchers.

## 🚀 Workflow Recomendado

### Desenvolvimento Diário

```bash
# 1. Verificar arquivos abertos
pnpm check-files

# 2. Se > 30.000, limpar primeiro
pnpm cleanup

# 3. Iniciar servidor com segurança
pnpm dev:safe
```

### Antes de Publicar

```bash
# 1. Limpar processos
pnpm cleanup

# 2. Fazer build limpo
pnpm build

# 3. Verificar se build funcionou
ls -lh dist/

# 4. Publicar via interface Manus
```

### Se Servidor Travar

```bash
# 1. Parar servidor (Ctrl+C)

# 2. Limpar processos órfãos
pnpm cleanup

# 3. Aguardar 5 segundos
sleep 5

# 4. Reiniciar com segurança
pnpm dev:safe
```

## 🐛 Troubleshooting

### Problema: Script não tem permissão

**Erro:**
```
bash: scripts/cleanup.sh: Permission denied
```

**Solução:**
```bash
chmod +x scripts/cleanup.sh
```

### Problema: Script não encontra processos

**Saída:**
```
✅ Nenhum processo Vite órfão
✅ Nenhum processo TSX órfão
```

**Ação:** Normal! Significa que não há processos órfãos. Pode iniciar servidor normalmente.

### Problema: Ainda dá erro "too many open files"

**Após executar cleanup:**
```bash
pnpm cleanup
# Aguardar 5 segundos
sleep 5
# Verificar arquivos
pnpm check-files
```

**Se ainda > 50.000:**
1. Feche outras aplicações
2. Reinicie o sandbox
3. Use apenas `pnpm dev:safe`

### Problema: Processos voltam imediatamente

**Causa:** Scheduler ou outros scripts em background.

**Solução:**
```bash
# Parar TODOS os processos Node
pkill -9 node

# Aguardar 5 segundos
sleep 5

# Iniciar apenas dev server
pnpm dev:safe
```

## 📚 Referências

- [Vite Watch Options](https://vitejs.dev/config/server-options.html#server-watch)
- [Node.js File Descriptors](https://nodejs.org/api/fs.html#file-system-flags)
- [Linux ulimit](https://ss64.com/bash/ulimit.html)

## 💡 Dicas Extras

1. **Use `pnpm dev:safe` sempre** - É mais seguro e previne problemas

2. **Monitore arquivos abertos** - Execute `pnpm check-files` regularmente

3. **Limpe antes de build** - Sempre execute `pnpm cleanup` antes de `pnpm build`

4. **Não execute múltiplos dev servers** - Um por vez é suficiente

5. **Feche terminais não usados** - Cada terminal pode ter processos órfãos

---

**Criado por:** Sistema MarketHub CRM  
**Data:** 10/11/2025  
**Versão:** 1.0
