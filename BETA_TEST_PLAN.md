# 🧪 PLANO DE TESTES BETA - Markethub CRM v2.1

**Data Início:** $(date +%Y-%m-%d)
**Versão:** v2.1
**Ambiente:** Produção (www.markthubcrm.com.br)
**Tester:** Sistema Automatizado de IA

---

## 📋 OBJETIVO

Realizar testes beta completos em todos os 63 módulos do sistema, validando:
- ✅ Funcionalidade básica
- ✅ Interface e usabilidade
- ✅ Integrações
- ✅ Performance
- ✅ Segurança
- ✅ Bugs e problemas

---

## 🎯 ESCOPO DOS TESTES

### 1. AUTENTICAÇÃO E ACESSO (5 testes)

| # | Teste | Módulo | Status |
|---|-------|--------|--------|
| 1.1 | Login usuário comum | `Login.tsx` | 🔄 |
| 1.2 | Login Super Admin | `SuperAdminLogin.tsx` | 🔄 |
| 1.3 | Cadastro de novo usuário | `Cadastro.tsx` | 🔄 |
| 1.4 | Autenticação 2FA | `Setup2FA.tsx`, `Verify2FA.tsx` | 🔄 |
| 1.5 | Recuperação de senha | `Login.tsx` | 🔄 |

### 2. MÓDULOS OPERACIONAIS (12 testes)

| # | Teste | Módulo | Status |
|---|-------|--------|--------|
| 2.1 | Criar pedido | `Pedidos.tsx` | 🔄 |
| 2.2 | Listar pedidos | `Pedidos.tsx` | 🔄 |
| 2.3 | Editar pedido | `Pedidos.tsx` | 🔄 |
| 2.4 | Criar produto | `Produtos.tsx` | 🔄 |
| 2.5 | Listar produtos | `Produtos.tsx` | 🔄 |
| 2.6 | Editar produto | `Produtos.tsx` | 🔄 |
| 2.7 | Criar cliente | API `/clientes` | 🔄 |
| 2.8 | Listar clientes | API `/clientes` | 🔄 |
| 2.9 | Criar anúncio | `Anuncios.tsx` | 🔄 |
| 2.10 | Gestão de estoque | `Produtos.tsx` | 🔄 |
| 2.11 | Emissão de NF-e | `NotasFiscais.tsx` | 🔄 |
| 2.12 | Rastreamento de entregas | `Entregas.tsx` | 🔄 |

### 3. MÓDULOS FINANCEIROS (10 testes)

| # | Teste | Módulo | Status |
|---|-------|--------|--------|
| 3.1 | Criar conta a pagar | `ContasPagar.tsx` | 🔄 |
| 3.2 | Criar conta a receber | `ContasReceber.tsx` | 🔄 |
| 3.3 | Visualizar fluxo de caixa | `FluxoCaixa.tsx` | 🔄 |
| 3.4 | Adicionar receita | `Receitas.tsx` | 🔄 |
| 3.5 | Adicionar despesa | `Despesas.tsx` | 🔄 |
| 3.6 | Importar extrato | `ImportacaoFinanceira.tsx` | 🔄 |
| 3.7 | Calcular comissões | `Comissoes.tsx` | 🔄 |
| 3.8 | Calcular taxas ML | `CalculadoraTaxasML.tsx` | 🔄 |
| 3.9 | Gerar relatório financeiro | `PastaFinanceira.tsx` | 🔄 |
| 3.10 | Processar pagamento | API `/payments` | 🔄 |

### 4. INTEGRAÇÕES (5 testes)

| # | Teste | Módulo | Status |
|---|-------|--------|--------|
| 4.1 | Conectar Mercado Livre | `IntegracaoMercadoLivre.tsx` | 🔄 |
| 4.2 | Sincronizar produtos ML | `MercadoLivre.tsx` | 🔄 |
| 4.3 | Sincronizar pedidos ML | `MercadoLivre.tsx` | 🔄 |
| 4.4 | Webhook ML | API `/mercadolivre/webhooks` | 🔄 |
| 4.5 | Testar outras integrações | `Integracoes.tsx` | 🔄 |

### 5. MÓDULOS ADMINISTRATIVOS (8 testes)

| # | Teste | Módulo | Status |
|---|-------|--------|--------|
| 5.1 | Criar usuário | `Users.tsx` | 🔄 |
| 5.2 | Configurar permissões | `Permissoes.tsx` | 🔄 |
| 5.3 | Visualizar logs | `Logs.tsx` | 🔄 |
| 5.4 | Alterar configurações | `Settings.tsx` | 🔄 |
| 5.5 | Importar dados | `Importacao.tsx` | 🔄 |
| 5.6 | Gerenciar tenants | `SuperAdminTenants.tsx` | 🔄 |
| 5.7 | Dashboard Super Admin | `SuperAdminDashboard.tsx` | 🔄 |
| 5.8 | Calendário e eventos | `Calendario.tsx` | 🔄 |

### 6. MÓDULOS DE MARKETING (5 testes)

| # | Teste | Módulo | Status |
|---|-------|--------|--------|
| 6.1 | Criar campanha | `Marketing.tsx` | 🔄 |
| 6.2 | Gerenciar leads | `Leads.tsx` | 🔄 |
| 6.3 | Análise de conversões | `Conversoes.tsx` | 🔄 |
| 6.4 | Criar postagem | `Postagens.tsx` | 🔄 |
| 6.5 | Comunicação com clientes | `Comunicacao.tsx` | 🔄 |

### 7. DASHBOARDS E ANÁLISES (5 testes)

| # | Teste | Módulo | Status |
|---|-------|--------|--------|
| 7.1 | Dashboard CRM | `DashboardCRM.tsx` | 🔄 |
| 7.2 | Dashboard principal | `Dashboard.tsx` | 🔄 |
| 7.3 | Métricas | `Metricas.tsx` | 🔄 |
| 7.4 | Análise de vendas | `AnaliseVendas.tsx` | 🔄 |
| 7.5 | Inteligência de mercado | `InteligenciaMercado.tsx` | 🔄 |

### 8. ASSISTENTE IA E SUPORTE (4 testes)

| # | Teste | Módulo | Status |
|---|-------|--------|--------|
| 8.1 | Chat IA | `ChatIA.tsx` | 🔄 |
| 8.2 | Atendimento | `Atendimento.tsx` | 🔄 |
| 8.3 | Pós-vendas | `PosVendas.tsx` | 🔄 |
| 8.4 | Sistema de tickets | API `/tickets` | 🔄 |

### 9. OUTRAS FUNCIONALIDADES (6 testes)

| # | Teste | Módulo | Status |
|---|-------|--------|--------|
| 9.1 | Catálogo de produtos | `Catalogo.tsx` | 🔄 |
| 9.2 | Tabela de preços | `TabelaPreco.tsx` | 🔄 |
| 9.3 | Logística | `Logistica.tsx` | 🔄 |
| 9.4 | Onboarding | `Onboarding.tsx` | 🔄 |
| 9.5 | Documentação | `Docs.tsx` | 🔄 |
| 9.6 | API pública | `API.tsx` | 🔄 |

---

## 📊 CRITÉRIOS DE AVALIAÇÃO

Cada teste será avaliado com base em:

### ✅ **PASSOU** - Critérios:
- Funcionalidade básica funciona
- Interface carrega corretamente
- Sem erros críticos
- Performance aceitável (< 3s)

### ⚠️ **PASSOU COM RESSALVAS** - Critérios:
- Funcionalidade funciona, mas com problemas menores
- Interface tem pequenos bugs visuais
- Performance lenta (3-5s)

### ❌ **FALHOU** - Critérios:
- Funcionalidade não funciona
- Erros críticos
- Interface não carrega
- Performance inaceitável (> 5s)

### ⏭️ **PULADO** - Motivos:
- Funcionalidade não implementada
- Requer credenciais externas
- Dependência não disponível

---

## 🧪 CASOS DE TESTE DETALHADOS

### CASO 1: Criar Cliente Completo

**Objetivo:** Criar um cliente de teste e validar todo fluxo

**Pré-requisitos:**
- Sistema rodando
- Acesso ao sistema
- Token de autenticação válido

**Dados do Cliente:**
```json
{
  "nome": "Empresa Teste Beta S.A.",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@empresateste.com.br",
  "telefone": "(11) 98765-4321",
  "endereco": {
    "cep": "01310-100",
    "rua": "Avenida Paulista",
    "numero": "1000",
    "complemento": "Andar 10",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP"
  }
}
```

**Passos:**
1. Fazer login no sistema
2. Navegar para módulo de clientes
3. Clicar em "Novo Cliente"
4. Preencher formulário
5. Salvar
6. Validar criação
7. Buscar cliente criado
8. Editar informações
9. Validar edição

**Resultado Esperado:**
- ✅ Cliente criado com sucesso
- ✅ Dados salvos corretamente
- ✅ Cliente aparece na listagem
- ✅ Edição funciona

---

### CASO 2: Fluxo Completo de Venda

**Objetivo:** Simular uma venda completa do início ao fim

**Passos:**
1. Criar produto
2. Criar cliente
3. Criar pedido
4. Processar pagamento
5. Emitir nota fiscal
6. Gerar etiqueta de entrega
7. Atualizar rastreamento
8. Finalizar venda

**Resultado Esperado:**
- ✅ Todo fluxo funciona
- ✅ Dados consistentes
- ✅ Sem erros

---

### CASO 3: Integração Mercado Livre

**Objetivo:** Testar integração completa com ML

**Passos:**
1. Conectar conta ML (OAuth)
2. Sincronizar produtos
3. Atualizar estoque
4. Sincronizar pedidos
5. Processar webhook
6. Calcular taxas

**Resultado Esperado:**
- ✅ OAuth funciona
- ✅ Sincronização correta
- ✅ Webhooks processados

---

## 📝 TEMPLATE DE RELATÓRIO DE BUG

```markdown
### BUG #[ID]

**Módulo:** [Nome do módulo]
**Severidade:** 🔴 Crítico / 🟡 Moderado / 🟢 Baixo
**Data:** [Data]

**Descrição:**
[Descrição detalhada do problema]

**Passos para reproduzir:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Comportamento esperado:**
[O que deveria acontecer]

**Comportamento observado:**
[O que realmente aconteceu]

**Screenshots/Logs:**
[Se disponível]

**Ambiente:**
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Versão: [v2.1]

**Solução sugerida:**
[Se tiver]
```

---

## 🎯 MÉTRICAS DE SUCESSO

### Objetivo: 90%+ de aprovação

| Métrica | Meta | Resultado |
|---------|:----:|:---------:|
| Testes Passaram | ≥ 90% | - |
| Bugs Críticos | 0 | - |
| Bugs Moderados | ≤ 5 | - |
| Performance (média) | < 3s | - |
| Usabilidade | 8/10 | - |

---

## 📅 CRONOGRAMA

**Duração estimada:** 4-6 horas

- **Fase 1:** Testes de autenticação (30 min)
- **Fase 2:** Testes operacionais (2 horas)
- **Fase 3:** Testes financeiros (1 hora)
- **Fase 4:** Testes de integrações (1 hora)
- **Fase 5:** Testes administrativos (1 hora)
- **Fase 6:** Documentação de bugs (30 min)
- **Fase 7:** Relatório final (30 min)

---

## 👥 PERFIS DE TESTE

### Perfil 1: Usuário Comum
- **Permissões:** Visualizar, editar próprios dados
- **Módulos:** Pedidos, Produtos, Clientes

### Perfil 2: Gerente
- **Permissões:** Todas exceto admin
- **Módulos:** Todos menos Super Admin

### Perfil 3: Super Admin
- **Permissões:** Todas
- **Módulos:** Todos incluindo Super Admin

---

**Preparado para iniciar testes!** 🚀
