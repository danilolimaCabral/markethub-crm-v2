# ============================================================================
# MarketHub CRM - Dockerfile
# Multi-stage build para otimizar tamanho da imagem
# Build: 2025-11-10 15:44 - Force rebuild without cache
# ============================================================================

# ============================================================================
# Stage 1: Builder - Compilar e fazer build da aplicação
# ============================================================================
FROM node:22-alpine AS builder

# Metadados da imagem
LABEL maintainer="Danilo Lima Cabral"
LABEL description="MarketHub CRM - Sistema de gestão multi-tenant para e-commerce"
LABEL version="1.0.0"

# Instalar pnpm globalmente
RUN npm install -g pnpm@10.4.1

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (melhor cache)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar o resto do código
COPY . .

# Build da aplicação
RUN pnpm build

# ============================================================================
# Stage 2: Runner - Imagem final otimizada apenas com o necessário
# ============================================================================
FROM node:22-alpine AS runner

# Instalar apenas dependências de runtime
RUN apk add --no-cache \
    dumb-init \
    curl

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas os arquivos necessários do builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/database ./database
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Mudar para usuário não-root
USER nodejs

# Expor porta da aplicação
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Usar dumb-init para gerenciar processos corretamente
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação (com migrations)
CMD ["sh", "-c", "node scripts/migrate.js && node dist/index.js"]
