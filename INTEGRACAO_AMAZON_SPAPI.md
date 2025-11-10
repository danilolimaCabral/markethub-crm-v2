# Integração com Amazon Selling Partner API (SP-API)

## Visão Geral

A Amazon Selling Partner API (SP-API) é uma API REST que permite a vendedores e fornecedores acessar programaticamente dados sobre pedidos, envios, pagamentos, listagens e muito mais.

**Documentação Oficial:** https://developer-docs.amazon.com/sp-api/

## Principais Características

- **Autenticação:** OAuth 2.0 (LWA) + AWS Signature V4
- **Formato:** REST/JSON
- **Rate Limits:** Variam por endpoint (0.0167 a 5 req/s)
- **Regiões:** América do Norte, Europa, Extremo Oriente

## Registro Necessário

1. Conta de Vendedor Amazon
2. Registro como Desenvolvedor SP-API
3. Usuário IAM na AWS (Access Key + Secret Key)
4. Aplicação registrada no Seller Central (Client ID + Client Secret)

## Endpoints Principais

- **/orders/v0/orders** - Listar e obter pedidos
- **/catalog/2022-04-01/items** - Buscar produtos no catálogo
- **/listings/2021-08-01/items** - Criar/atualizar listagens
- **/fba/inventory/v1/summaries** - Inventário FBA
- **/products/pricing/v0/price** - Preços de produtos
- **/reports/2021-06-30/reports** - Relatórios

## Complexidade de Integração

⭐⭐⭐⭐⭐ (5/5 - Alta complexidade)

- Requer AWS IAM e assinatura de requisições
- Dois sistemas de autenticação (LWA + AWS Signature V4)
- Rate limits restritivos
- Documentação extensa mas complexa

## Links Úteis

- Documentação: https://developer-docs.amazon.com/sp-api/
- GitHub Samples: https://github.com/amzn/selling-partner-api-samples
- Developer University: https://developer.amazonservices.com/learn
