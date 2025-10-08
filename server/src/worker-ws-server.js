import http from "http";
import dotenv from "dotenv";
import { initWorkerNotificationWS } from "./services/websocket.workerNotify.js";
import { connectDB } from "./config/db.js";
import { initRedis } from "./config/redis.js";
import { log, err } from "./utils/logger.js";

dotenv.config();

const PORT = process.env.WORKER_WS_PORT || 8082;

async function start() {
  try {
    await connectDB();
    await initRedis();

    // Separate WS server for worker notifications
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end("Worker WebSocket service running.");
    });

    await initWorkerNotificationWS(server);
    server.listen(PORT, () => {
      log(`🟢 Worker WS Server running on port ${PORT}`);
    });
  } catch (e) {
    err("❌ Worker WS startup error:", e);
    process.exit(1);
  }
}

start();
