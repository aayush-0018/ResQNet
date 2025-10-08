import http from "http";
import dotenv from "dotenv";
import path from "path";
import { fork } from "child_process";
import app from "./app.js";
import { initWebSocket } from "./services/websocket.service.js";
import { initWorkerNotificationWS } from "./services/websocket.workerNotify.js";
import { connectDB } from "./config/db.js";
import { initRedis } from "./config/redis.js";
import { log, err } from "./utils/logger.js";

dotenv.config();

const PORT = process.env.PORT || 8081;

async function start() {
  try {
    // 🧩 Connect to DB and Redis
    await connectDB();
    await initRedis();

    // 🖥️ Create HTTP server
    const server = http.createServer(app);

    // 🔌 Initialize WebSocket services
    initWebSocket(server);
    await initWorkerNotificationWS(server);

    // 🚀 Start workers in background (so all run under one Render instance)
    const notificationWorker = path.resolve("workers/notification.worker.js");
    const statusWorker = path.resolve("workers/statusUpdate.worker.js");

    fork(notificationWorker);
    fork(statusWorker);

    // 🌐 Start main API server
    server.listen(PORT, () => {
      log(`🚀 Server + Workers running on port ${PORT}`);
    });
  } catch (e) {
    err("❌ Fatal startup error:", e);
    process.exit(1);
  }
}

start();
