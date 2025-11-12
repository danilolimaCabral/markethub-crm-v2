# MarketHub CRM - Dockerfile Otimizado
# Força rebuild completo sem cache para garantir código atualizado

FROM node:22-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache bash postgresql-client

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm globalmente
RUN npm install -g pnpm@10.4.1

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar todo o código fonte
COPY . .

# CRÍTICO: Remover dist/ antigo para forçar rebuild completo
RUN rm -rf dist/

# Build do frontend e backend
RUN pnpm run build

# Verificar se build foi bem-sucedido
RUN ls -la dist/ && echo "✅ Build concluído com sucesso"

# Expor porta
EXPOSE 5000

# Comando de inicialização (migra DB e inicia servidor)
CMD ["pnpm", "start"]
