import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

// Importar rotas
import clientesRouter from "./routes/clientes";
import pedidosRouter from "./routes/pedidos";
import produtosRouter from "./routes/produtos";
import aiRouter from "./routes/ai";
import mercadolivreRouter from "./routes/mercadolivre";
// import ticketsRouter from "./routes/tickets";

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
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
