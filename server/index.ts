import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Importar rotas
import authRouter from "./routes/auth";
import clientesRouter from "./routes/clientes";
import pedidosRouter from "./routes/pedidos";
import produtosRouter from "./routes/produtos";
import aiRouter from "./routes/ai";
import mercadolivreRouter from "./routes/mercadolivre";
import superadminRouter from "./routes/superadmin";
import tenantsRouter from "./routes/tenants";
import integrationsRouter from "./routes/api/v1/integrations";
import paymentsRouter from "./routes/payments";
import apiInfoRouter from "./routes/api-info";
import systemStatusRouter from "./routes/system-status";
import mlApiTestsRouter from "./routes/ml-api-tests";
import mlAdminDashboardRouter from "./routes/ml-admin-dashboard";
import marketplaceCredentialsRouter from "./routes/marketplace-credentials";
import setupTempRouter from "./routes/setup-temp";
import emergencyResetRouter from "./routes/emergency-reset";
import dashboardRouter from "./routes/dashboard";
import financialRouter from "./routes/financial";
import integrationsStatusRouter from "./routes/integrations-status";
import monitoringRouter from "./routes/monitoring";
import logisticsRouter from "./routes/logistics";
import marketplacesRouter from "./routes/marketplaces";
// import ticketsRouter from "./routes/tickets";

// Importar middlewares
import { requestLogger, errorLogger } from "./middleware/logger";
import { apiLimiter } from "./middleware/rateLimiter";
import { sanitize } from "./middleware/validation";

// Importar Swagger
// import { setupSwagger } from "./swagger";

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log("\n============================================================");
  console.log("🚀 EXECUTANDO MIGRAÇÕES DO BANCO DE DADOS");
  console.log("============================================================\n");
  
  try {
    const { stdout, stderr } = await execAsync("node scripts/migrate.js");
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log("\n✅ Migrações concluídas com sucesso!\n");
  } catch (error: any) {
    console.error("\n❌ Erro ao executar migrações:", error.message);
    console.error("\n⚠️  Servidor continuará sem as migrações...\n");
  }
}

async function startServer() {
  // Executar migrations antes de iniciar o servidor
  await runMigrations();
  
  const app = express();
  const server = createServer(app);

  // Middlewares
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Middleware de logging para todas as requisições
  app.use(requestLogger);
  
  // Middleware para sanitizar dados
  app.use(sanitize);
  
  // Middleware para desabilitar cache de arquivos estáticos
  app.use((req, res, next) => {
    if (req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
  
  // Rate limiting global (exceto webhook do ML que precisa ser público)
  app.use('/api/', (req, res, next) => {
    // Excluir webhook do Mercado Livre do rate limiting
    if (req.path === '/integrations/mercadolivre/webhook') {
      return next();
    }
    return apiLimiter(req, res, next);
  });

  // Configurar Swagger Documentation
  // setupSwagger(app); // Temporariamente desabilitado

  // API Routes
  app.use("/api/info", apiInfoRouter); // Informações da API
  app.use("/api/system", systemStatusRouter); // Status do sistema
  app.use("/api/auth", authRouter); // Autenticação (nova rota)
  app.use("/api/clientes", clientesRouter);
  app.use("/api/pedidos", pedidosRouter);
  app.use("/api/produtos", produtosRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/integrations/mercadolivre", mercadolivreRouter);
  app.use("/api/mercadolivre", mlApiTestsRouter);
  app.use("/api/admin/mercadolivre", mlAdminDashboardRouter);
  app.use("/api/admin/marketplace-credentials", marketplaceCredentialsRouter);
  app.use("/api/temp", setupTempRouter); // REMOVER APÓS TESTES
  app.use("/api/emergency", emergencyResetRouter); // ENDPOINT DE EMERGÊNCIA
  app.use("/api/superadmin", superadminRouter);
  app.use("/api/tenants", tenantsRouter);
  app.use("/api/v1/integrations", integrationsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/financial", financialRouter);
  app.use("/api/integrations", integrationsStatusRouter);
  app.use("/api/monitoring", monitoringRouter);
  app.use("/api/logistics", logisticsRouter);
  app.use("/api/marketplaces", marketplacesRouter);
  // app.use("/api/tickets", ticketsRouter);
  
  // Middleware de tratamento de erros (deve ser o último)
  app.use(errorLogger);

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Verifica o status da API
   *     tags: [Sistema]
   *     responses:
   *       200:
   *         description: API está funcionando
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthCheck'
   */
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: process.env.DB_NAME || "not configured"
    });
  });
  
  // Diagnostic endpoint
  app.get("/api/diagnostic", async (_req, res) => {
    try {
      const { Sequelize } = await import("sequelize");
      const sequelize = (await import("./config/database.js")).default;
      
      // Testar query simples
      let queryTest = "not tested";
      try {
        await sequelize.query("SELECT 1 as test");
        queryTest = "success";
      } catch (e: any) {
        queryTest = `failed: ${e.message}`;
      }
      
      // Testar INSERT com placeholders
      let insertTest = "not tested";
      try {
        await sequelize.query(
          "SELECT $1 as param1, $2 as param2, $3 as param3",
          { bind: ["test1", "test2", "test3"] }
        );
        insertTest = "success";
      } catch (e: any) {
        insertTest = `failed: ${e.message}`;
      }
      
      res.json({
        sequelize_version: "8.x",
        node_version: process.version,
        env: process.env.NODE_ENV,
        database_url: process.env.DATABASE_URL ? "configured" : "not configured",
        query_test: queryTest,
        insert_test: insertTest,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  // IMPORTANTE: Esta rota deve ser a última!
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}/`);
    console.log(`📊 API available at http://localhost:${port}/api`);
    console.log(`💾 Database: ${process.env.DB_NAME || 'not configured'}`);
  });
}

startServer().catch(console.error);
