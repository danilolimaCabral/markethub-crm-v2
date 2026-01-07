# 📊 Guia da Funcionalidade: Validação de Planilhas

**Data:** 06 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** ✅ Implementado

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Acessar](#como-acessar)
3. [Passo a Passo de Uso](#passo-a-passo-de-uso)
4. [Entidades e Campos Suportados](#entidades-e-campos-suportados)
5. [Entendendo o Relatório de Validação](#entendendo-o-relatório-de-validação)
6. [Instruções para Desenvolvedores](#instruções-para-desenvolvedores)

---

## 🎯 Visão Geral

A funcionalidade de **Validação de Planilhas** permite que os usuários façam o upload de arquivos nos formatos Excel (.xlsx, .xls) ou CSV (.csv) para validar dados em massa antes de importá-los para o sistema. 

O objetivo principal é garantir a integridade e a qualidade dos dados, identificando erros comuns como campos obrigatórios ausentes, formatos inválidos e inconsistências, sem o risco de importar dados incorretos para o banco de dados.

### Principais Benefícios

- **Segurança:** Valida os dados sem afetar o banco de dados de produção.
- **Qualidade dos Dados:** Identifica e reporta erros e avisos linha por linha.
- **Facilidade de Uso:** Interface intuitiva para upload e visualização dos resultados.
- **Flexibilidade:** Suporte para múltiplas entidades (Produtos, Pedidos, Clientes).
- **Agilidade:** Permite a correção de grandes volumes de dados de forma rápida.

---

## 🔑 Como Acessar

1.  Faça login no sistema MarketHub CRM.
2.  No menu lateral, navegue até **Configurações > Validação de Planilhas**.
    *(Nota: Um novo item de menu "Validação de Planilhas" precisa ser adicionado, apontando para a rota `/validacao-planilhas`)*

---

## 🚀 Passo a Passo de Uso

A página de validação é dividida em três seções principais:

### Passo 1: Selecione o Tipo de Dados

-   Escolha a entidade que deseja validar:
    -   **Produtos:** Para validar cadastro de novos produtos ou atualização de existentes.
    -   **Pedidos:** Para validar histórico de pedidos de marketplaces.
    -   **Clientes:** Para validar a base de clientes.
-   Clique em **"Baixar planilha de exemplo"** para obter um modelo com as colunas corretas e dados de exemplo. **É altamente recomendado usar o modelo como base.**

### Passo 2: Faça Upload da Planilha

-   Clique na área de upload ou arraste e solte o arquivo da sua planilha.
-   Formatos aceitos: `.xlsx`, `.xls`, `.csv`.
-   Tamanho máximo: **10MB**.
-   Após selecionar o arquivo, clique no botão **"Validar Planilha"**.

### Passo 3: Analise o Resultado

-   O sistema processará o arquivo e exibirá um relatório completo de validação.
-   Verifique as estatísticas, erros e avisos (detalhes na seção 5).
-   Se houver erros, corrija-os na sua planilha original e faça o upload novamente.
-   Se houver apenas avisos, a importação é possível, mas é recomendado revisar os pontos levantados.
-   Se a validação for bem-sucedida, a planilha está pronta para ser importada (a funcionalidade de importação real será implementada em uma próxima fase).

---

## 📚 Entidades e Campos Suportados

### 1. Produtos

| Campo | Obrigatório | Descrição |
| :--- | :--- | :--- |
| `nome` | **Sim** | Nome do produto. |
| `sku` | **Sim** | Código único de identificação do produto. |
| `preco_venda` | **Sim** | Preço final de venda. Deve ser um número maior que zero. |
| `categoria` | Não | Categoria do produto. Padrão: "Geral". |
| `preco_custo` | Não | Custo de aquisição do produto. |
| `estoque_atual` | Não | Quantidade em estoque. Padrão: 0. |
| `estoque_minimo` | Não | Estoque mínimo para alerta. Padrão: 5. |
| `status` | Não | Status do produto (`ativo`, `inativo`, `pausado`). Padrão: `ativo`. |
| `marketplace` | Não | Marketplace principal. Padrão: "Mercado Livre". |
| `descricao` | Não | Descrição detalhada do produto. |
| `imagem_url` | Não | URL da imagem principal do produto. |

### 2. Pedidos

| Campo | Obrigatório | Descrição |
| :--- | :--- | :--- |
| `numero_pedido` | **Sim** | Identificador único do pedido no marketplace. |
| `cliente_nome` | **Sim** | Nome do cliente que realizou a compra. |
| `valor_total` | **Sim** | Valor total do pedido. Deve ser um número maior que zero. |
| `marketplace` | Não | Marketplace de origem. Padrão: "Mercado Livre". |
| `status` | Não | Status do pedido (`pendente`, `conferido`, `enviado`, `entregue`, `cancelado`). Padrão: `pendente`. |
| `data_pedido` | Não | Data em que o pedido foi realizado. |
| `rastreio` | Não | Código de rastreamento do envio. |
| `observacoes` | Não | Observações internas sobre o pedido. |

### 3. Clientes

| Campo | Obrigatório | Descrição |
| :--- | :--- | :--- |
| `nome` | **Sim** | Nome completo do cliente. |
| `email` | Não | Endereço de e-mail do cliente. Será validado se o formato está correto. |
| `telefone` | Não | Telefone de contato. |
| `cpf_cnpj` | Não | CPF ou CNPJ do cliente. |
| `endereco` | Não | Endereço completo. |
| `cidade` | Não | Cidade do cliente. |
| `estado` | Não | Estado (UF) do cliente. |
| `cep` | Não | Código de Endereçamento Postal. |

---

## 🔍 Entendendo o Relatório de Validação

O relatório é composto por três partes:

### 1. Estatísticas

-   **Total de Linhas:** Número total de registros encontrados na planilha.
-   **Linhas Válidas:** Registros que passaram em todas as validações e estão prontos para importação.
-   **Linhas com Erro:** Registros que contêm erros críticos e não podem ser importados.

### 2. Erros

-   São problemas **críticos** que impedem a importação da linha correspondente.
-   **Exemplos:** Campo obrigatório em branco, SKU duplicado, preço inválido.
-   É necessário corrigir todos os erros na planilha original antes de tentar a importação.

### 3. Avisos

-   São problemas **não críticos** que não impedem a importação, mas que devem ser revisados.
-   **Exemplos:** SKU já existente no sistema (indica que será uma atualização), preço de custo maior que o de venda (margem negativa), status inválido que será substituído por um padrão.
-   A revisão dos avisos é recomendada para garantir a consistência dos dados.

---

## 👨‍💻 Instruções para Desenvolvedores

### 1. Instalação de Dependências

Esta funcionalidade requer a instalação da biblioteca `multer` para manipulação de uploads.

```bash
# Na raiz do projeto, execute:
pnpm add multer
pnpm add -D @types/multer
```

### 2. Registro da Rota

A nova rota de validação foi registrada no arquivo `server/index.ts`:

```typescript
// server/index.ts
import spreadsheetValidationRouter from "./routes/spreadsheet-validation";

// ...

app.use("/api/spreadsheet-validation", spreadsheetValidationRouter);
```

### 3. Adicionar Link no Frontend

É necessário adicionar um link no menu de navegação do frontend para a nova página.

-   **Componente da Página:** `client/src/pages/ValidacaoPlanilhas.tsx`
-   **Rota no React Router:** `/validacao-planilhas`

Adicione um `Link` ou `NavLink` no componente de menu apropriado (ex: `Sidebar.tsx` ou `App.tsx`):

```jsx
<Link to="/validacao-planilhas">Validação de Planilhas</Link>
```

### 4. Implementação da Importação (Próxima Fase)

A funcionalidade de importação real (escrita no banco de dados) ainda não foi implementada. O `TODO` está no arquivo `server/routes/spreadsheet-validation.ts`, na rota `POST /import`.

Para implementar, será necessário:

1.  Chamar o `SpreadsheetValidationService` para validar os dados.
2.  Se a validação for bem-sucedida, iterar sobre `validationResult.data`.
3.  Para cada registro, executar uma query SQL de `INSERT ... ON CONFLICT (sku) DO UPDATE` para inserir ou atualizar os dados no banco.
4.  Envolver as operações em uma transação para garantir a atomicidade.
5.  Retornar um relatório final de importação (linhas inseridas, atualizadas, etc.).
