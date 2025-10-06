import http from "http";
import dotenv from "dotenv";
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
    await connectDB();
    await initRedis();

    const server = http.createServer(app);
    
    initWebSocket(server);
    await initWorkerNotificationWS(server); 

    server.listen(PORT, () => {
      log(`🚀 Primary Backend running on port ${PORT}`);
    });
  } catch (e) {
    err("Fatal startup error:", e);
    process.exit(1);
  }
}

start();
