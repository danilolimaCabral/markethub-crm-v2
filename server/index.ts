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
// import ticketsRouter from "./routes/tickets";

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
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use("/api/clientes", clientesRouter);
  app.use("/api/pedidos", pedidosRouter);
  app.use("/api/produtos", produtosRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/integrations/mercadolivre", mercadolivreRouter);
  app.use("/api/superadmin", superadminRouter);
  app.use("/api/tenants", tenantsRouter);
  app.use("/api/v1/integrations", integrationsRouter);
  // app.use("/api/tickets", ticketsRouter);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: process.env.DB_NAME || "not configured"
    });
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
