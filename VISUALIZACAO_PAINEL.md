# 🎨 Visualização do Painel Super Admin

## 📸 Como Visualizar

### Opção 1: Preview HTML (Recomendado)
Abra o arquivo `preview-superadmin.html` no seu navegador para ver uma prévia completa do painel.

### Opção 2: Executar o Sistema
1. Inicie o servidor: `pnpm dev`
2. Acesse: `http://localhost:5173/super-admin/login`
3. Faça login com as credenciais do super admin

---

## 🖼️ Layout do Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🛡️ Super Admin Panel                    [🔄 Atualizar] [🚪 Sair]     │
│  Monitoramento e gestão do sistema                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total de     │ │ Total de     │ │ Receita      │ │ Erros (24h)  │
│ Clientes     │ │ Usuários     │ │ Total        │ │              │
│              │ │              │ │              │ │              │
│     42       │ │   1.247      │ │ R$ 2.847K    │ │      3       │
│ 35 ativos    │ │ 8.532 prod.  │ │ Todos os     │ │ Sistema      │
│ 7 trial      │ │ 15.890 ped.  │ │ clientes     │ │ estável      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐
│ 🖥️ Métricas do Sistema               │ │ ⚠️ Erros por Tenant (24h)            │
│                                      │ │                                      │
│ CPU: 24.5% ████████░░░░░░░░░░       │ │ • Empresa ABC Ltda                  │
│                                      │ │   2 erros, 5 avisos [1 crítico]     │
│ Memória: 1.247 MB / 2.048 MB        │ │                                      │
│ ████████████████░░░░░░░░░░░░         │ │ • XYZ Comércio                      │
│                                      │ │   1 erro, 2 avisos                   │
│ Memória Total: 16.0 GB               │ │                                      │
│ Memória Livre: 8.5 GB                │ │ Nenhum erro registrado 🎉            │
│ CPU Cores: 8                         │ │                                      │
│ Uptime: 12.5 dias                    │ │                                      │
│                                      │ │                                      │
│ Plataforma: linux                     │ │                                      │
│ Hostname: server-01                  │ │                                      │
│                                      │ │                                      │
│ Banco de Dados:                      │ │                                      │
│ Total: 45 | Ativas: 12 | Idle: 33    │ │                                      │
└──────────────────────────────────────┘ └──────────────────────────────────────┘

┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐
│ 📈 Clientes Mais Ativos (7 dias)     │ │ 👥 Estatísticas por Plano             │
│ Top 10 clientes por pedidos          │ │ Distribuição de clientes              │
│                                      │ │                                      │
│ 🥇 Empresa Premium                   │ │ Enterprise [8 clientes]                │
│    enterprise • active               │ │ Usuários: 245 | Produtos: 3.421       │
│    247 pedidos | R$ 89.450,00       │ │ Pedidos: 8.932                        │
│                                      │ │                                      │
│ 🥈 Mega Store                        │ │ Business [15 clientes]                 │
│    business • active                 │ │ Usuários: 378 | Produtos: 2.156       │
│    189 pedidos | R$ 67.230,50        │ │ Pedidos: 4.521                        │
│                                      │ │                                      │
│ 🥉 Tech Solutions                     │ │ Professional [12 clientes]           │
│    professional • active             │ │ Usuários: 120 | Produtos: 1.234       │
│    156 pedidos | R$ 45.890,00       │ │ Pedidos: 2.437                        │
│                                      │ │                                      │
│ ...                                  │ │ Starter [7 clientes]                   │
│                                      │ │ Usuários: 21 | Produtos: 721          │
│                                      │ │ Pedidos: 1.234                        │
└──────────────────────────────────────┘ └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 💾 Logs Recentes                                                       │
│ Últimas 20 entradas do sistema                                         │
├──────────┬────────────┬──────────────────────┬──────────┬─────────────┤
│ Nível    │ Categoria  │ Mensagem             │ Tenant   │ Data        │
├──────────┼────────────┼──────────────────────┼──────────┼─────────────┤
│ [info]   │ auth       │ Usuário logado...    │ abc-123  │ 15/01 14:32 │
│ [warning]│ api        │ Rate limit quase...  │ xyz-456  │ 15/01 14:28 │
│ [error]  │ integration│ Falha ao sincron... │ def-789  │ 15/01 14:15 │
└──────────┴────────────┴──────────────────────┴──────────┴─────────────┘
```

---

## 🎨 Características Visuais

### Cores e Estilo
- **Fundo**: Escuro (slate-900)
- **Cards**: Escuro com borda (slate-800/slate-700)
- **Texto Principal**: Branco
- **Texto Secundário**: Cinza claro (slate-300/400)
- **Acentos**: Gradiente roxo-rosa (purple-500 to pink-500)

### Componentes

#### Cards de Estatísticas
- 4 cards principais no topo
- Ícones coloridos (azul, verde, amarelo, vermelho)
- Números grandes e destacados
- Texto descritivo abaixo

#### Métricas do Sistema
- Barras de progresso coloridas
- Informações organizadas em grid
- Dados técnicos detalhados
- Status do banco de dados

#### Listas e Rankings
- Cards com fundo semi-transparente
- Badges coloridos para status
- Números formatados (R$)
- Ícones de ranking (1º, 2º, 3º)

#### Tabela de Logs
- Cabeçalho fixo
- Badges coloridos por nível
- Texto truncado para mensagens longas
- Data formatada em pt-BR

---

## 📱 Responsividade

- **Desktop**: Grid de 4 colunas para cards
- **Tablet**: Grid de 2 colunas
- **Mobile**: 1 coluna, scroll vertical

---

## 🔄 Funcionalidades Interativas

- **Auto-refresh**: Atualiza a cada 30 segundos
- **Botão Atualizar**: Atualização manual
- **Botão Sair**: Logout do sistema
- **Scroll**: Listas com scroll quando necessário

---

## 📊 Dados Exibidos

### Cards Principais
1. **Total de Clientes**: 42 (35 ativos, 7 trial)
2. **Total de Usuários**: 1.247 (8.532 produtos, 15.890 pedidos)
3. **Receita Total**: R$ 2.847.392,50
4. **Erros (24h)**: 3

### Métricas do Sistema
- CPU: 24.5%
- Memória: 1.247 MB / 2.048 MB (61%)
- Memória Total: 16.0 GB
- Memória Livre: 8.5 GB
- CPU Cores: 8
- Uptime: 12.5 dias
- Banco: 45 conexões (12 ativas, 33 idle)

### Top Clientes
1. Empresa Premium - 247 pedidos - R$ 89.450,00
2. Mega Store - 189 pedidos - R$ 67.230,50
3. Tech Solutions - 156 pedidos - R$ 45.890,00

### Estatísticas por Plano
- Enterprise: 8 clientes, 245 usuários, 3.421 produtos
- Business: 15 clientes, 378 usuários, 2.156 produtos
- Professional: 12 clientes, 120 usuários, 1.234 produtos
- Starter: 7 clientes, 21 usuários, 721 produtos

---

**Para ver o preview completo, abra `preview-superadmin.html` no navegador!**
