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
import clientesRouter from "./routes/clientes";
import pedidosRouter from "./routes/pedidos";
import produtosRouter from "./routes/produtos";
import aiRouter from "./routes/ai";
import mercadolivreRouter from "./routes/mercadolivre";
import superadminRouter from "./routes/superadmin";
import tenantsRouter from "./routes/tenants";
import integrationsRouter from "./routes/api/v1/integrations";
import paymentsRouter from "./routes/payments";
import apiDocsRouter from "./routes/api-docs";
// import ticketsRouter from "./routes/tickets";

// Importar middlewares
import { requestLogger, errorLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import { globalRateLimit } from "./middleware/rateLimit";
import { healthCheck, simpleHealthCheck } from "./monitoring/healthCheck";

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log("\n============================================================");
  console.log("🚀 EXECUTANDO MIGRAÇÕES DO BANCO DE DADOS");
  console.log("============================================================\n");
  
  try {
    // Tentar usar sistema de migrações automático primeiro
    try {
      const { runAllMigrations } = await import("./migrations/migrationRunner");
      await runAllMigrations();
    } catch (migrationError: any) {
      // Se falhar, tentar método antigo
      console.log("⚠️  Tentando método de migração alternativo...");
      const { stdout, stderr } = await execAsync("node scripts/migrate.js");
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      console.log("\n✅ Migrações concluídas com sucesso!\n");
    }
  } catch (error: any) {
    console.error("\n❌ Erro ao executar migrações:", error.message);
    console.error("\n⚠️  Servidor continuará sem as migrações...\n");
  }
}

async function startServer() {
  // Executar migrations antes de iniciar o servidor
  await runMigrations();
  
  // Iniciar scheduler de sincronização automática
  if (process.env.ENABLE_AUTO_SYNC !== 'false') {
    try {
      const SyncScheduler = (await import('./services/SyncScheduler')).default;
      await SyncScheduler.start();
      console.log('✅ Sincronização automática ativada');
    } catch (error: any) {
      console.warn('⚠️  Erro ao iniciar scheduler:', error.message);
    }
  }
  
  const app = express();
  const server = createServer(app);

  // Middlewares globais
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Rate limiting global
  app.use(globalRateLimit);
  
  // Logging de requisições
  app.use(requestLogger);

  // API Routes
  app.use("/api/docs", apiDocsRouter); // Documentação da API
  app.use("/api/clientes", clientesRouter);
  app.use("/api/pedidos", pedidosRouter);
  app.use("/api/produtos", produtosRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/integrations/mercadolivre", mercadolivreRouter);
  app.use("/api/integrations/amazon", (await import("./routes/amazon")).default);
  app.use("/api/integrations/shopee", (await import("./routes/shopee")).default);
  app.use("/api/superadmin", superadminRouter);
  app.use("/api/tenants", tenantsRouter);
  app.use("/api/v1/integrations", integrationsRouter);
  app.use("/api/payments", paymentsRouter);
  // app.use("/api/tickets", ticketsRouter);
  
  // Health check (antes do error handler)
  app.get("/api/health", healthCheck);
  app.get("/api/health/simple", simpleHealthCheck);
  
  // Error handler (deve ser o último middleware)
  app.use(errorLogger);
  app.use(errorHandler);
  
  // Diagnostic endpoint
  app.get("/api/diagnostic", async (_req, res) => {
    try {
      const { Sequelize } = await import("sequelize");
      const sequelize = (await import("./config/database.js")).default;
      
      // Testar query simples
      let queryTest = "not tested";
      try {
        await sequelize.query("SELECT 1 as test", []);
        queryTest = "success";
      } catch (e: any) {
        queryTest = `failed: ${e.message}`;
      }
      
      // Testar INSERT com placeholders
      let insertTest = "not tested";
      try {
        await sequelize.query(
          "SELECT $1 as param1, $2 as param2, $3 as param3",
          ["test1", "test2", "test3"]
        );
        insertTest = "success";
      } catch (e: any) {
        insertTest = `failed: ${e.message}`;
      }
      
      res.json({
        sequelize_version: Sequelize.version || "unknown",
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
