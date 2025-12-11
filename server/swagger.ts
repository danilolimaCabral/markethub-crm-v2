import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Markthub CRM API',
      version: '2.1.0',
      description: 'API completa do Markthub CRM - Sistema de gestão para e-commerce integrado ao Mercado Livre',
      contact: {
        name: 'Suporte Markthub',
        email: 'suporte@markethubcrm.com.br',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://production-url.railway.app',
        description: 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
            code: {
              type: 'string',
              description: 'Código do erro',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            database: {
              type: 'string',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints de autenticação e autorização',
      },
      {
        name: 'Clientes',
        description: 'Gestão de clientes',
      },
      {
        name: 'Pedidos',
        description: 'Gestão de pedidos',
      },
      {
        name: 'Produtos',
        description: 'Gestão de produtos',
      },
      {
        name: 'Mercado Livre',
        description: 'Integração com Mercado Livre',
      },
      {
        name: 'Pagamentos',
        description: 'Gestão de pagamentos e assinaturas',
      },
      {
        name: 'Tenants',
        description: 'Gestão de tenants (multi-tenant)',
      },
      {
        name: 'IA',
        description: 'Assistente de IA e análises',
      },
      {
        name: 'Sistema',
        description: 'Endpoints do sistema',
      },
    ],
  },
  apis: ['./server/routes/*.ts', './server/index.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Markthub CRM API Documentation',
  }));

  // JSON spec
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Documentação da API disponível em: /api-docs');
}

export default swaggerSpec;
