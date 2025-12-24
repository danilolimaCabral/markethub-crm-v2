# Dockerfile para Markthub CRM V2
# Otimizado para produção no Railway

# Stage 1: Build
FROM node:22-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm@10.4.1

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código-fonte
COPY . .

# Build da aplicação
RUN pnpm build

# Stage 2: Production
FROM node:22-alpine

# Instalar pnpm
RUN npm install -g pnpm@10.4.1

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar apenas dependências de produção
RUN pnpm install --prod --frozen-lockfile

# Copiar build da aplicação do stage anterior
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/database ./database
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts

# Copiar script de entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
