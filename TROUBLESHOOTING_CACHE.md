# 🔧 Troubleshooting - Layout Antigo Aparecendo

Se o layout antigo ainda estiver aparecendo após o deploy, siga estes passos:

## 1. Limpar Cache do Navegador

### Chrome/Edge:
1. Pressione `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
2. Selecione "Imagens e arquivos em cache"
3. Clique em "Limpar dados"
4. **OU** Abra o DevTools (`F12`) → Clique com botão direito no ícone de recarregar → "Esvaziar cache e recarregar forçadamente"

### Firefox:
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Cache"
3. Clique em "Limpar agora"

### Safari:
1. Pressione `Cmd + Option + E`
2. Recarregue a página

## 2. Modo Anônimo/Privado

Abra o site em uma janela anônima/privada para testar sem cache:
- **Chrome**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`
- **Safari**: `Cmd + Shift + N`

## 3. Verificar Deploy no Railway

1. Acesse o painel do Railway
2. Verifique se o último deploy foi bem-sucedido
3. Procure por erros nos logs
4. Confirme que o commit `65d1323` foi deployado

## 4. Forçar Rebuild no Railway

Se o problema persistir:

1. No painel do Railway, vá em **Settings**
2. Role até "Danger Zone"
3. Clique em **Redeploy**
4. Aguarde o build completar (3-5 minutos)

## 5. Verificar Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas no Railway:

```bash
NODE_ENV=production
FRONTEND_URL=https://seu-dominio.railway.app
```

## 6. Hard Refresh

Tente um hard refresh no navegador:
- **Windows**: `Ctrl + F5` ou `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

## 7. Verificar Logs do Railway

```bash
# Acesse os logs em tempo real no Railway
# Procure por erros relacionados a:
- Build do Vite
- Carregamento de assets
- Erros 404 em arquivos CSS/JS
```

## 8. Testar Localmente

Para confirmar que o layout está correto:

```bash
cd /caminho/para/markethub-crm-v2
pnpm install
pnpm build
pnpm start
```

Acesse `http://localhost:3000` e verifique se o layout está correto.

## 9. Verificar Assets Gerados

Confirme que os arquivos CSS foram gerados corretamente:

```bash
ls -lh dist/public/assets/*.css
```

Você deve ver arquivos como `index-[hash].css` com tamanho razoável (> 50KB).

## 10. CDN/Proxy Cache

Se você estiver usando um CDN ou proxy (Cloudflare, etc.):

1. Acesse o painel do CDN
2. Limpe o cache (Purge Cache)
3. Aguarde alguns minutos

---

## ✅ Checklist Rápido

- [ ] Limpei o cache do navegador
- [ ] Testei em modo anônimo
- [ ] Verifiquei que o deploy foi bem-sucedido
- [ ] Fiz hard refresh (Ctrl+Shift+R)
- [ ] Verifiquei os logs do Railway
- [ ] Testei em outro navegador
- [ ] Aguardei 5 minutos após o deploy

---

## 🆘 Ainda com Problemas?

Se nada funcionar, o problema pode ser:

1. **Railway ainda está fazendo deploy** - Aguarde alguns minutos
2. **Erro no build** - Verifique os logs do Railway
3. **CDN com cache agressivo** - Limpe o cache do CDN

### Contato

Se o problema persistir, entre em contato com o suporte técnico com:
- Screenshot do problema
- Logs do Railway
- Navegador e versão
- URL do site
