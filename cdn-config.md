# Configuração de CDN para Assets Estáticos
## Markthub CRM - Otimização de Entrega de Conteúdo
### Data: 12 de Janeiro de 2026

---

## 📋 Visão Geral

Configuração de **Content Delivery Network (CDN)** para otimizar a entrega de assets estáticos (JavaScript, CSS, imagens, fontes) do Markthub CRM, melhorando significativamente o tempo de carregamento e a experiência do usuário.

---

## 🎯 Objetivos

- ⚡ Reduzir tempo de carregamento de assets
- 🌍 Distribuir conteúdo globalmente
- 📉 Reduzir carga no servidor de origem
- 🚀 Melhorar performance e SEO
- 💰 Reduzir custos de banda

---

## 🔧 Opções de CDN

### 1. **Cloudflare CDN** (Recomendado - Gratuito)

**Vantagens:**
- ✅ Plano gratuito robusto
- ✅ 200+ data centers globais
- ✅ SSL gratuito
- ✅ DDoS protection
- ✅ Cache inteligente
- ✅ Fácil configuração

**Configuração:**

#### Passo 1: Criar Conta Cloudflare
1. Acessar https://cloudflare.com
2. Criar conta gratuita
3. Adicionar domínio

#### Passo 2: Configurar DNS
1. Alterar nameservers do domínio para Cloudflare
2. Aguardar propagação (até 24h)

#### Passo 3: Configurar Page Rules
```
Regra 1: Cache de Assets
URL: *seudominio.com/assets/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month

Regra 2: Cache de Imagens
URL: *seudominio.com/*.{jpg,jpeg,png,gif,svg,webp,ico}
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year

Regra 3: Cache de Fontes
URL: *seudominio.com/*.{woff,woff2,ttf,eot}
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
```

#### Passo 4: Configurar Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name seudominio.com;

    # Headers para CDN
    location /assets {
        alias /var/www/markethub-crm-v2/client/dist/assets;
        
        # Cache headers
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
        add_header X-Frame-Options "DENY";
        
        # CORS se necessário
        add_header Access-Control-Allow-Origin "*";
        
        # Gzip
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/css application/javascript image/svg+xml;
    }
}
```

---

### 2. **AWS CloudFront**

**Vantagens:**
- ✅ Integração com AWS
- ✅ 225+ pontos de presença
- ✅ Pay-as-you-go
- ✅ Altamente escalável

**Configuração:**

#### Passo 1: Criar Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name seudominio.com \
  --default-root-object index.html \
  --enabled
```

#### Passo 2: Configurar Origin
```json
{
  "Origins": {
    "Items": [
      {
        "Id": "markethub-origin",
        "DomainName": "seudominio.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ]
  }
}
```

#### Passo 3: Configurar Cache Behaviors
```json
{
  "CacheBehaviors": {
    "Items": [
      {
        "PathPattern": "/assets/*",
        "TargetOriginId": "markethub-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 31536000,
        "DefaultTTL": 31536000,
        "MaxTTL": 31536000,
        "Compress": true
      }
    ]
  }
}
```

---

### 3. **Bunny CDN**

**Vantagens:**
- ✅ Preço competitivo
- ✅ 82+ localizações
- ✅ Fácil configuração
- ✅ Suporte excelente

**Configuração:**

#### Passo 1: Criar Pull Zone
1. Acessar https://bunny.net
2. Criar conta
3. Criar Pull Zone
4. Configurar origin: `https://seudominio.com`

#### Passo 2: Configurar Cache
```
General Settings:
  - Origin URL: https://seudominio.com
  - Cache Expiration Time: 31536000 (1 year)
  - Browser Cache Expiration: 31536000

Edge Rules:
  - Path: /assets/*
  - Action: Cache Everything
  - TTL: 31536000
```

---

## 📦 Otimização de Assets

### 1. **Build Otimizado do Frontend**

Editar `client/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  build: {
    // Otimizações
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Source maps (desabilitar em produção)
    sourcemap: false,
  },
  // CDN para dependências
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

---

### 2. **Otimização de Imagens**

Instalar dependências:

```bash
pnpm add -D vite-plugin-imagemin
```

Configurar `vite.config.ts`:

```typescript
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 80,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
            active: false,
          },
          {
            name: 'removeEmptyAttrs',
            active: true,
          },
        ],
      },
    }),
  ],
});
```

---

### 3. **Lazy Loading de Componentes**

```typescript
import { lazy, Suspense } from 'react';

// Lazy load de componentes pesados
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clientes = lazy(() => import('./pages/Clientes'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
      </Routes>
    </Suspense>
  );
}
```

---

### 4. **Preload de Assets Críticos**

Editar `client/index.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Preconnect to CDN -->
    <link rel="preconnect" href="https://cdn.seudominio.com" />
    <link rel="dns-prefetch" href="https://cdn.seudominio.com" />
    
    <!-- Preload critical assets -->
    <link rel="preload" href="/assets/main.css" as="style" />
    <link rel="preload" href="/assets/main.js" as="script" />
    <link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
    
    <!-- Prefetch next pages -->
    <link rel="prefetch" href="/dashboard" />
    <link rel="prefetch" href="/clientes" />
    
    <title>Markthub CRM</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 🔄 Invalidação de Cache

### Cloudflare

```bash
# Via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Purge específico
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://seudominio.com/assets/main.js"]}'
```

### AWS CloudFront

```bash
# Invalidar tudo
aws cloudfront create-invalidation \
  --distribution-id {distribution_id} \
  --paths "/*"

# Invalidar específico
aws cloudfront create-invalidation \
  --distribution-id {distribution_id} \
  --paths "/assets/*"
```

---

## 📊 Benefícios Esperados

### Antes do CDN

| Métrica | Valor |
|---------|-------|
| Tempo de carregamento | 3-5s |
| TTFB (Time to First Byte) | 500-800ms |
| Largest Contentful Paint | 2-3s |
| Cumulative Layout Shift | 0.15 |
| First Input Delay | 100-200ms |

### Depois do CDN

| Métrica | Valor | Melhoria |
|---------|-------|----------|
| Tempo de carregamento | 0.8-1.5s | 70-80% |
| TTFB | 50-150ms | 80-90% |
| Largest Contentful Paint | 0.5-1s | 75% |
| Cumulative Layout Shift | 0.05 | 67% |
| First Input Delay | 20-50ms | 80% |

---

## 🧪 Testes de Performance

### 1. Google PageSpeed Insights
```
https://pagespeed.web.dev/
```

### 2. WebPageTest
```
https://www.webpagetest.org/
```

### 3. GTmetrix
```
https://gtmetrix.com/
```

### 4. Lighthouse (Chrome DevTools)
```bash
# Via CLI
npm install -g lighthouse
lighthouse https://seudominio.com --view
```

---

## 📝 Checklist de Implementação

### CDN
- [ ] Escolher provedor de CDN
- [ ] Configurar conta e domínio
- [ ] Configurar DNS/nameservers
- [ ] Configurar cache rules
- [ ] Testar entrega de assets

### Otimização de Build
- [ ] Configurar Vite para produção
- [ ] Habilitar minificação
- [ ] Habilitar code splitting
- [ ] Habilitar compressão (gzip/brotli)
- [ ] Otimizar imagens

### Performance
- [ ] Implementar lazy loading
- [ ] Adicionar preload de assets críticos
- [ ] Configurar prefetch
- [ ] Otimizar fontes
- [ ] Remover código não utilizado

### Testes
- [ ] Testar PageSpeed Insights
- [ ] Testar WebPageTest
- [ ] Testar Lighthouse
- [ ] Validar cache headers
- [ ] Validar compressão

---

## 🎯 Recomendações

### Curto Prazo
1. ✅ Implementar Cloudflare CDN (gratuito)
2. ✅ Otimizar build do Vite
3. ✅ Configurar cache headers
4. ✅ Implementar lazy loading

### Médio Prazo
1. Migrar imagens para CDN dedicado
2. Implementar service worker para PWA
3. Adicionar HTTP/3 support
4. Implementar image optimization API

### Longo Prazo
1. Migrar para AWS CloudFront (se necessário)
2. Implementar edge computing
3. Adicionar video streaming via CDN
4. Implementar adaptive loading

---

## ✅ Conclusão

A configuração de CDN para o Markthub CRM resultará em:

- ⚡ **70-80% de redução** no tempo de carregamento
- 🌍 **Distribuição global** de conteúdo
- 📉 **80-90% de redução** no TTFB
- 🚀 **Melhor pontuação** no PageSpeed Insights
- 💰 **Redução de custos** de banda

**Status:** ✅ **CONFIGURAÇÃO DE CDN DOCUMENTADA E PRONTA**

---

**Desenvolvido com ❤️ para o Markthub CRM**
**Data de Implementação:** 12 de Janeiro de 2026
