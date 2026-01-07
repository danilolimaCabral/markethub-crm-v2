# 📊 Guia Completo de Importação de Planilhas - MarketHub CRM v2

## Visão Geral

O sistema MarketHub CRM v2 agora possui um módulo completo de importação de planilhas que permite a carga massiva de dados para facilitar análises e integração com sistemas externos. Este guia detalha como usar cada funcionalidade de importação.

---

## Módulos Suportados

### 1. Importação de Produtos

**Endpoint:** `POST /api/spreadsheet-import/produtos`

**Campos da Planilha:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `sku` | Texto | ✅ Sim | Código único do produto |
| `nome` | Texto | ✅ Sim | Nome do produto |
| `preco_venda` | Número | ❌ Não | Preço de venda (padrão: 0) |
| `preco_custo` | Número | ❌ Não | Preço de custo (padrão: 0) |
| `estoque_atual` | Número | ❌ Não | Quantidade em estoque (padrão: 0) |
| `estoque_minimo` | Número | ❌ Não | Estoque mínimo para alerta (padrão: 10) |
| `categoria` | Texto | ❌ Não | Categoria do produto (padrão: "Geral") |
| `descricao` | Texto | ❌ Não | Descrição detalhada |
| `peso` | Número | ❌ Não | Peso em gramas |
| `altura` | Número | ❌ Não | Altura em cm |
| `largura` | Número | ❌ Não | Largura em cm |
| `comprimento` | Número | ❌ Não | Comprimento em cm |

**Comportamento:**
- Se o SKU já existir, o produto será **atualizado**
- Se o SKU não existir, um novo produto será **criado**
- Avisos serão gerados para campos opcionais não preenchidos

**Exemplo de Uso:**

```bash
curl -X POST http://localhost:5000/api/spreadsheet-import/produtos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@produtos.xlsx"
```

---

### 2. Importação de Vendas do Mercado Livre

**Endpoint:** `POST /api/spreadsheet-import/vendas-ml`

**Campos da Planilha:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `order_id` | Texto | ✅ Sim | ID do pedido no Mercado Livre |
| `sku` | Texto | ✅ Sim | SKU do produto vendido |
| `quantidade` | Número | ❌ Não | Quantidade vendida (padrão: 1) |
| `preco_venda` | Número | ✅ Sim | Preço de venda total |
| `custo_produto` | Número | ❌ Não | Custo do produto (padrão: 0) |
| `comissao_ml` | Número | ❌ Não | Comissão do ML (calculada automaticamente se não informada) |
| `custo_frete` | Número | ❌ Não | Custo do frete (0 se preço >= R$ 79,90) |
| `categoria` | Texto | ❌ Não | Categoria para cálculo de comissão |
| `status` | Texto | ❌ Não | Status do pedido (padrão: "paid") |
| `data_venda` | Data | ❌ Não | Data da venda (padrão: data atual) |

**Cálculo Automático de Comissão:**

O sistema calcula automaticamente a comissão do Mercado Livre baseado na categoria:

| Categoria | Taxa de Comissão |
|-----------|------------------|
| Eletrônicos | 19% |
| Moda | 15% |
| Casa | 13% |
| Esportes | 14% |
| Livros | 11% |
| Outras | 15% (padrão) |

**Regra de Frete Grátis:**
- Se `preco_venda >= R$ 79,90`: `custo_frete = 0`
- Caso contrário: usa o valor informado em `custo_frete`

**Cálculo de Lucro Líquido:**

```
lucro_liquido = preco_venda - custo_produto - comissao_ml - custo_frete
```

---

### 3. Importação de Análise Financeira

**Endpoint:** `POST /api/spreadsheet-import/analise-financeira`

**Campos da Planilha:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `data` | Data | ✅ Sim | Data da transação |
| `tipo` | Texto | ✅ Sim | Tipo: `receita`, `despesa`, `opex`, `custo_fixo`, `custo_variavel` |
| `categoria` | Texto | ❌ Não | Categoria da transação (padrão: "Geral") |
| `descricao` | Texto | ❌ Não | Descrição detalhada |
| `valor` | Número | ✅ Sim | Valor da transação |

**Tipos de Transação:**

- **receita**: Receitas operacionais
- **despesa**: Despesas gerais
- **opex**: Despesas operacionais (OPEX)
- **custo_fixo**: Custos fixos mensais
- **custo_variavel**: Custos variáveis por venda

---

### 4. Importação de Clientes

**Endpoint:** `POST /api/spreadsheet-import/clientes`

**Campos da Planilha:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | Texto | ❌ Não | Nome completo do cliente |
| `email` | Texto | ✅ Sim* | Email do cliente |
| `telefone` | Texto | ❌ Não | Telefone de contato |
| `cpf` | Texto | ✅ Sim* | CPF do cliente |
| `endereco` | Texto | ❌ Não | Endereço completo |
| `cidade` | Texto | ❌ Não | Cidade |
| `estado` | Texto | ❌ Não | Estado (UF) |
| `cep` | Texto | ❌ Não | CEP |

**Observação:** É obrigatório informar **pelo menos** `email` **ou** `cpf`.

**Comportamento:**
- Se o cliente já existir (mesmo email ou CPF), será **atualizado**
- Se não existir, um novo cliente será **criado**

---

## Como Usar

### 1. Preparar a Planilha

1. Baixe o template correspondente:
   - `GET /api/spreadsheet-import/templates/produtos`
   - `GET /api/spreadsheet-import/templates/vendas-ml`
   - `GET /api/spreadsheet-import/templates/analise-financeira`
   - `GET /api/spreadsheet-import/templates/clientes`

2. Preencha a planilha com seus dados

3. Salve no formato `.xlsx` ou `.csv`

### 2. Fazer Upload

Use a interface web ou faça uma requisição HTTP:

```bash
curl -X POST http://localhost:5000/api/spreadsheet-import/produtos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@sua_planilha.xlsx"
```

### 3. Analisar o Resultado

A resposta da API incluirá:

```json
{
  "success": true,
  "imported": 150,
  "updated": 25,
  "errors": [],
  "warnings": [
    {
      "row": 10,
      "field": "categoria",
      "message": "Categoria não informada, usando 'Geral'"
    }
  ]
}
```

---

## Regras de Negócio

### Gestão de Estoque e Anúncios

O sistema implementa as seguintes regras automáticas:

1. **Alerta de Estoque Baixo**: Quando `estoque_atual < 15 unidades`
2. **Pausa Automática**: Anúncios são pausados quando `estoque_atual = 0`
3. **Reativação Automática**: Anúncios são reativados quando o estoque é reposto
4. **Prioridade**: Produtos com alto giro têm prioridade na reativação

### Validação de Dados

- Todos os dados são validados antes da importação
- Dados duplicados são identificados e tratados
- Erros são reportados com número da linha e campo específico

---

## Limitações

- **Tamanho máximo do arquivo**: 10MB
- **Formatos suportados**: `.xlsx`, `.xls`, `.csv`
- **Processamento**: Síncrono (para arquivos grandes, considere dividir em lotes)

---

## Exemplos de Planilhas

### Exemplo: Produtos

| sku | nome | preco_venda | preco_custo | estoque_atual | categoria |
|-----|------|-------------|-------------|---------------|-----------|
| PROD-001 | Camiseta Branca | 49.90 | 20.00 | 100 | Moda |
| PROD-002 | Tênis Esportivo | 199.90 | 80.00 | 50 | Esportes |

### Exemplo: Vendas ML

| order_id | sku | quantidade | preco_venda | custo_produto | categoria | data_venda |
|----------|-----|------------|-------------|---------------|-----------|------------|
| ML-123456 | PROD-001 | 2 | 99.80 | 40.00 | Moda | 2026-01-05 |
| ML-123457 | PROD-002 | 1 | 199.90 | 80.00 | Esportes | 2026-01-06 |

---

## Suporte

Para dúvidas ou problemas, consulte a documentação técnica ou entre em contato com o suporte.
