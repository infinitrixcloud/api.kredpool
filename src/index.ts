import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { log } from "./utils/log";
import { run } from "./utils/db";
import { router } from "./routes/routes"

function createApp() {
  const app = express();
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(express.json({ limit: "50mb" }));

  app.use(cors({ origin: "*" }));
  app.use(helmet());
  app.disable("x-powered-by");

  app.use("/", router);

  return app;
}

function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  const PORT = Number(process.env.PORT) || 3000;

  server.listen(PORT, () => {
    log(`Server listening on port ${PORT}`, "info");
  });
  server.timeout = 300000; // 5 minutes
server.headersTimeout = 60000;
server.requestTimeout = 300000;

  server.on("error", (err: any) => {
    log(`Server error: ${err.code ?? ""} ${err.message}`, "error");
    process.exit(1);
  });

  return server;
}

startServer();
