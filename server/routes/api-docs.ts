import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

/**
 * Swagger/OpenAPI Documentation
 */
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Markethub CRM API',
    version: '1.0.0',
    description: 'API completa do sistema Markethub CRM para gestão de e-commerce multi-tenant',
    contact: {
      name: 'Suporte Markethub',
      email: 'suporte@markethubcrm.com.br'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desenvolvimento'
    },
    {
      url: 'https://api.markethubcrm.com.br/v1',
      description: 'Servidor de produção'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      tenantHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Tenant-ID'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    },
    {
      tenantHeader: []
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        description: 'Verifica o status da API',
        tags: ['Sistema'],
        responses: {
          '200': {
            description: 'API está funcionando',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    database: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/pedidos': {
      get: {
        summary: 'Listar pedidos',
        description: 'Lista todos os pedidos do tenant autenticado',
        tags: ['Pedidos'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por status'
          },
          {
            name: 'marketplace',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por marketplace'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 },
            description: 'Limite de resultados'
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 0 },
            description: 'Offset para paginação'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de pedidos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Pedido' }
                    },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        summary: 'Criar pedido',
        description: 'Cria um novo pedido',
        tags: ['Pedidos'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarPedido' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Pedido criado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Pedido' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' }
        }
      }
    },
    '/pedidos/{id}': {
      get: {
        summary: 'Buscar pedido por ID',
        tags: ['Pedidos'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Pedido encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Pedido' }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/produtos': {
      get: {
        summary: 'Listar produtos',
        description: 'Lista todos os produtos do tenant',
        tags: ['Produtos'],
        parameters: [
          {
            name: 'categoria',
            in: 'query',
            schema: { type: 'string' }
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string' }
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Buscar por nome ou SKU'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de produtos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Produto' }
                    },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Pedido: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          numero_pedido: { type: 'string' },
          cliente_nome: { type: 'string' },
          marketplace: { type: 'string' },
          valor_total: { type: 'number' },
          status: { type: 'string', enum: ['pendente', 'conferido', 'enviado', 'entregue'] },
          data_pedido: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      CriarPedido: {
        type: 'object',
        required: ['numero_pedido', 'cliente_nome', 'marketplace', 'valor_total'],
        properties: {
          numero_pedido: { type: 'string' },
          cliente_nome: { type: 'string' },
          marketplace: { type: 'string' },
          valor_total: { type: 'number' },
          status: { type: 'string' },
          observacoes: { type: 'string' }
        }
      },
      Produto: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string' },
          sku: { type: 'string' },
          categoria: { type: 'string' },
          preco_venda: { type: 'number' },
          estoque_atual: { type: 'integer' },
          status: { type: 'string' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          details: { type: 'object' }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Requisição inválida',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Não autenticado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Forbidden: {
        description: 'Acesso negado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Recurso não encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  },
  tags: [
    { name: 'Sistema', description: 'Endpoints do sistema' },
    { name: 'Pedidos', description: 'Gestão de pedidos' },
    { name: 'Produtos', description: 'Gestão de produtos' },
    { name: 'Clientes', description: 'Gestão de clientes' },
    { name: 'Autenticação', description: 'Autenticação e autorização' }
  ]
};

// Rota para servir documentação Swagger JSON
router.get('/swagger.json', (_req, res) => {
  res.json(swaggerDocument);
});

// Rota para servir UI do Swagger (usando swagger-ui-express se disponível)
router.get('/docs', (_req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Markethub CRM API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
        <style>
          body { margin: 0; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/api/docs/swagger.json',
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.presets.standalone
            ]
          });
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

export default router;
