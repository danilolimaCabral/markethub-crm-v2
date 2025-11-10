# 🚀 Guia de Instalação e Deploy

**Versão:** 1.0.0  
**Última Atualização:** Novembro 2025  
**Autor:** Manus AI

---

## 📑 Índice

1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Instalação Local](#instalação-local)
3. [Deploy na Nuvem](#deploy-na-nuvem)
4. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
5. [Personalização](#personalização)
6. [Troubleshooting](#troubleshooting)

---

## 💻 Requisitos do Sistema

### Requisitos Mínimos

Para executar o sistema localmente ou em servidor próprio, você precisará dos seguintes componentes instalados:

| Componente | Versão Mínima | Recomendada | Descrição |
|------------|---------------|-------------|-----------|
| **Node.js** | 18.x | 22.x | Runtime JavaScript |
| **pnpm** | 8.x | 10.x | Gerenciador de pacotes |
| **Navegador** | Chrome 90+ | Chrome/Edge Latest | Para acessar o sistema |
| **Memória RAM** | 2GB | 4GB+ | Para build e execução |
| **Espaço em Disco** | 500MB | 1GB+ | Para dependências |

### Navegadores Suportados

O sistema foi testado e é totalmente compatível com os seguintes navegadores modernos:

- **Google Chrome** 90 ou superior
- **Microsoft Edge** 90 ou superior  
- **Mozilla Firefox** 88 ou superior
- **Safari** 14 ou superior
- **Opera** 76 ou superior

O sistema utiliza recursos modernos de JavaScript (ES2020+) e CSS (Tailwind 4), portanto navegadores antigos não são suportados.

---

## 🏠 Instalação Local

A instalação local é ideal para desenvolvimento, testes ou uso em ambiente controlado (intranet).

### Passo 1: Instalar Node.js e pnpm

Primeiro, você precisa instalar o Node.js. Acesse o site oficial e baixe a versão LTS (Long Term Support) mais recente para seu sistema operacional.

**Download Node.js:** https://nodejs.org/

Após instalar o Node.js, instale o pnpm globalmente executando o seguinte comando no terminal:

```bash
npm install -g pnpm
```

Para verificar se a instalação foi bem-sucedida, execute:

```bash
node --version
pnpm --version
```

Você deverá ver as versões instaladas de cada ferramenta.

### Passo 2: Clonar ou Baixar o Projeto

Se você recebeu o projeto em formato ZIP, extraia os arquivos em uma pasta de sua escolha. Se o projeto está em um repositório Git, clone-o com:

```bash
git clone <url-do-repositorio>
cd markethub-crm
```

### Passo 3: Instalar Dependências

Navegue até a pasta do projeto e instale todas as dependências necessárias:

```bash
cd markethub-crm
pnpm install
```

Este comando irá baixar e instalar todas as bibliotecas listadas no arquivo `package.json`. O processo pode levar alguns minutos dependendo da velocidade da sua internet.

### Passo 4: Iniciar Servidor de Desenvolvimento

Para iniciar o servidor de desenvolvimento local, execute:

```bash
pnpm dev
```

O sistema estará disponível em: **http://localhost:3000**

Abra seu navegador e acesse este endereço. Você verá a tela de login do sistema.

**Credenciais Padrão:**
- **Usuário:** admin
- **Senha:** admin123

### Passo 5: Build para Produção (Opcional)

Se você deseja gerar uma versão otimizada para produção, execute:

```bash
pnpm build
```

Os arquivos otimizados serão gerados na pasta `dist/`. Você pode servir estes arquivos com qualquer servidor web estático (Nginx, Apache, etc.).

Para testar o build localmente:

```bash
pnpm preview
```

---

## ☁️ Deploy na Nuvem

O sistema pode ser facilmente implantado em diversas plataformas de hospedagem na nuvem. Abaixo estão guias para as plataformas mais populares.

### Opção 1: Vercel (Recomendado - Gratuito)

A Vercel oferece hospedagem gratuita para aplicações frontend com deploy automático e CDN global.

**Vantagens:**
- Deploy em menos de 2 minutos
- HTTPS automático
- CDN global (velocidade em qualquer lugar do mundo)
- Domínio gratuito (.vercel.app)
- Suporte a domínios personalizados
- Deploy automático a cada atualização

**Passo a Passo:**

1. Crie uma conta gratuita em: https://vercel.com/signup

2. Instale a CLI da Vercel:
```bash
pnpm install -g vercel
```

3. Na pasta do projeto, execute:
```bash
vercel
```

4. Siga as instruções interativas:
   - Confirme que deseja fazer deploy do projeto
   - Selecione seu time/conta
   - Confirme configurações do projeto

5. Aguarde o deploy (geralmente leva 1-2 minutos)

6. Você receberá uma URL pública como: `https://seu-projeto.vercel.app`

**Deploy Contínuo:**

Se o projeto estiver em um repositório Git (GitHub, GitLab, Bitbucket), você pode conectar diretamente na interface web da Vercel para deploy automático a cada commit.

### Opção 2: Netlify (Gratuito)

Netlify é outra excelente opção gratuita com recursos similares à Vercel.

**Passo a Passo:**

1. Crie uma conta em: https://app.netlify.com/signup

2. Clique em "Add new site" > "Deploy manually"

3. Faça build do projeto localmente:
```bash
pnpm build
```

4. Arraste a pasta `dist/` para a área de drop na Netlify

5. Aguarde o deploy (1-2 minutos)

6. Você receberá uma URL como: `https://seu-projeto.netlify.app`

**Alternativa - Deploy via CLI:**

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Opção 3: GitHub Pages (Gratuito)

Se o projeto estiver no GitHub, você pode usar GitHub Pages gratuitamente.

**Passo a Passo:**

1. No arquivo `vite.config.ts`, adicione a base URL:
```typescript
export default defineConfig({
  base: '/nome-do-repositorio/',
  // ... resto da configuração
})
```

2. Crie arquivo `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. Faça commit e push para GitHub

4. Nas configurações do repositório, ative GitHub Pages apontando para branch `gh-pages`

5. Acesse em: `https://seu-usuario.github.io/nome-do-repositorio/`

### Opção 4: AWS S3 + CloudFront (Pago - Escalável)

Para empresas que precisam de infraestrutura robusta e escalável, AWS é a melhor opção.

**Passo a Passo Resumido:**

1. Crie um bucket S3 com acesso público
2. Faça build do projeto: `pnpm build`
3. Faça upload da pasta `dist/` para o bucket
4. Configure bucket para hospedagem de site estático
5. (Opcional) Configure CloudFront para CDN e HTTPS
6. (Opcional) Configure Route 53 para domínio personalizado

**Custo Estimado:**
- S3: ~$0.023 por GB armazenado + transferência
- CloudFront: ~$0.085 por GB transferido
- Para site com 1000 visitantes/mês: ~$5-10/mês

### Opção 5: Servidor Próprio (VPS)

Se você possui um servidor próprio (VPS, servidor dedicado, etc.), pode hospedar o sistema usando Nginx ou Apache.

**Exemplo com Nginx:**

1. Faça build do projeto:
```bash
pnpm build
```

2. Copie arquivos para servidor:
```bash
scp -r dist/* usuario@seu-servidor:/var/www/crm
```

3. Configure Nginx (`/etc/nginx/sites-available/crm`):
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/crm;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

4. Ative configuração e reinicie Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. (Recomendado) Configure HTTPS com Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

---

## ⚙️ Configuração de Variáveis de Ambiente

O sistema utiliza variáveis de ambiente para configurações sensíveis e personalizações.

### Arquivo .env

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Informações da Aplicação
VITE_APP_TITLE="Nome do Seu CRM"
VITE_APP_LOGO="/logo.svg"

# Mercado Livre (Opcional - para integração)
VITE_ML_CLIENT_ID="seu_client_id_aqui"
VITE_ML_CLIENT_SECRET="seu_client_secret_aqui"
VITE_ML_REDIRECT_URI="https://seu-dominio.com/callback"

# Analytics (Opcional)
VITE_ANALYTICS_ID="seu_analytics_id"
```

### Variáveis Disponíveis

| Variável | Descrição | Obrigatória | Padrão |
|----------|-----------|-------------|--------|
| `VITE_APP_TITLE` | Nome exibido no sistema | Não | "IA BRUNO CRM" |
| `VITE_APP_LOGO` | Caminho do logo | Não | "/logo.svg" |
| `VITE_ML_CLIENT_ID` | Client ID do Mercado Livre | Não | - |
| `VITE_ML_CLIENT_SECRET` | Client Secret do ML | Não | - |
| `VITE_ML_REDIRECT_URI` | URL de callback OAuth2 | Não | - |

**Importante:** Variáveis que começam com `VITE_` são expostas no frontend. Nunca coloque informações ultra-sensíveis nelas.

---

## 🎨 Personalização

### Alterar Nome e Logo

1. **Nome do Sistema:**
   - Edite `client/src/const.ts`:
   ```typescript
   export const APP_TITLE = "Seu CRM Personalizado";
   ```

2. **Logo:**
   - Substitua arquivo `client/public/logo.svg` pelo seu logo
   - Ou edite `client/src/const.ts`:
   ```typescript
   export const APP_LOGO = "/seu-logo.png";
   ```

3. **Favicon:**
   - Substitua `client/public/favicon.ico` pelo seu favicon

### Alterar Cores e Tema

As cores do sistema são definidas em `client/src/index.css`. Edite as variáveis CSS:

```css
@layer base {
  :root {
    --primary: 250 84% 54%;        /* Cor principal */
    --secondary: 240 5% 96%;       /* Cor secundária */
    --accent: 250 84% 54%;         /* Cor de destaque */
    /* ... outras variáveis */
  }
}
```

Use o formato **HSL** (Hue, Saturation, Lightness) para definir cores.

### Alterar Credenciais Padrão

Por segurança, altere as credenciais padrão do administrador:

1. Faça login com `admin / admin123`
2. Acesse **Usuários**
3. Edite o usuário **admin**
4. Altere a senha
5. Salve as alterações

**Importante:** Faça isso ANTES de colocar o sistema em produção!

---

## 🔧 Troubleshooting

### Problema: "Command not found: pnpm"

**Solução:**
```bash
npm install -g pnpm
```

### Problema: Erro ao instalar dependências

**Solução:**
```bash
# Limpe cache e reinstale
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Problema: Página em branco após deploy

**Causas Comuns:**
1. Base URL incorreta no `vite.config.ts`
2. Arquivos não foram copiados corretamente
3. Servidor não está configurado para SPA (Single Page Application)

**Solução:**
- Verifique console do navegador (F12) para erros
- Certifique-se que servidor redireciona todas as rotas para `index.html`

### Problema: Sistema lento ou travando

**Soluções:**
1. Limpe dados do localStorage (pode estar muito grande):
   - Abra console do navegador (F12)
   - Execute: `localStorage.clear()`
   - Recarregue a página

2. Use navegador atualizado (Chrome/Edge mais recente)

3. Desative extensões do navegador que podem interferir

### Problema: Não consigo fazer login

**Soluções:**
1. Verifique se está usando credenciais corretas: `admin / admin123`
2. Limpe cache do navegador
3. Limpe localStorage: `localStorage.clear()`
4. Tente em modo anônimo/privado do navegador

### Problema: Mercado Livre não conecta

**Verificações:**
1. Client ID e Client Secret estão corretos?
2. Redirect URI configurada no painel do ML corresponde à URL do seu sistema?
3. Aplicação está aprovada no Mercado Livre?

---

## 📞 Suporte

Para problemas não listados aqui, entre em contato com o suporte técnico através dos canais oficiais.

---

## 🔄 Atualizações

Para atualizar o sistema para uma nova versão:

1. Faça backup dos dados (exporte do localStorage)
2. Baixe nova versão do sistema
3. Substitua arquivos (mantenha `.env` se existir)
4. Execute: `pnpm install`
5. Execute: `pnpm build`
6. Faça deploy da nova versão

**Importante:** Sempre teste atualizações em ambiente de desenvolvimento antes de aplicar em produção!

---

**Desenvolvido com ❤️ por Manus AI**
