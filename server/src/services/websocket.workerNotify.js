// src/services/websocket.workerNotify.js
import { WebSocketServer } from "ws";
import { initRedis, getSubClient } from "../config/redis.js";
import { log, err } from "../utils/logger.js";

let wssWorker = null;
const PUBSUB_CHANNEL = "worker:notification";
const clientsByUserId = new Map();

/**
 * Starts a NEW WebSocket server that listens to worker notifications
 * and forwards them to specific users.
 *
 * @param {import('http').Server} server - HTTP server instance
 */
export const initWorkerNotificationWS = async (server) => {
  try {
    await initRedis(); // ensure Redis connections
    const sub = getSubClient();

    // Create a separate server for worker notifications to avoid conflicts
    wssWorker = new WebSocketServer({ server, path: "/worker" });
    log("connected");
    wssWorker.on("connection", (ws) => {
      log("🔗 [WorkerWS] New client connected");
      ws.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.action === "register" && data.userId) {
            clientsByUserId.set(data.userId, ws);
            log(`✅ [WorkerWS] Registered userId: ${data.userId}`);
          }
        } catch {
          /* ignore invalid messages */
        }
      });
      ws.on("close", () => {
        for (const [id, socket] of clientsByUserId) {
          if (socket === ws) clientsByUserId.delete(id);
        }
        log("❌ [WorkerWS] Client disconnected");
      });
    });

    // Subscribe to Redis Pub/Sub channel from the worker
    await sub.subscribe(PUBSUB_CHANNEL, (message) => {
      try {
        const payload = JSON.parse(message);
        const targetClient = clientsByUserId.get(payload.userId);
        console.log("targetClient==>>", targetClient);
        if (targetClient && targetClient.readyState === targetClient.OPEN) {
          targetClient.send(
            JSON.stringify({ event: "worker.notification", data: payload })
          );
          log(`📡 [WorkerWS] Notification sent to ${payload.userId}`);
        } else {
          log(`⚠️ [WorkerWS] No client for userId ${payload.userId}`);
        }
      } catch (e) {
        err("[WorkerWS] Pub/Sub error:", e);
      }
    });

    log("🟢 [WorkerWS] Server ready and subscribed to Redis");
  } catch (e) {
    err("❌ [WorkerWS] Init error:", e);
    throw e;
  }
};
