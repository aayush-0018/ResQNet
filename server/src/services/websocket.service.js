import { WebSocketServer } from "ws";
import { log } from "../utils/logger.js";

let wss = null;

/**
 * initWebSocket(server)
 * - server is the HTTP server created with http.createServer(app)
 */
export const initWebSocket = (server) => {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    log("🔗 New WS client connected:", req.socket.remoteAddress || "unknown");

    // Send a ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on("message", (message) => {
      // optional: allow clients to send subscribe messages (region/role)
      // but we keep it simple now
      // Example: { action: "subscribe", region: "xyz" }
      try {
        const msg = JSON.parse(message.toString());
        console.log("WebSocket message received:", msg);
        // handle subscribe/unsubscribe later
      } catch (e) {
        // ignore non-json messages
      }
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      log("❌ WS client disconnected");
    });
    
    ws.on("error", (error) => {
      log("⚠️ WebSocket error:", error);
    });
  });
};

// Broadcast emergency immediately to all connected clients
export const emitEmergencyImmediate = (data) => {
  if (!wss) return;
  const msg = JSON.stringify({ event: "emergency.sos", data });
  let sentCount = 0;
  
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      try {
        client.send(msg);
        sentCount++;
      } catch (e) {
        // don't let one client error affect others
        console.warn("ws send error:", e);
      }
    }
  }
  
  log(`📢 Emergency broadcast sent to ${sentCount} clients`);
};

// Broadcast status update to all connected clients
export const emitStatusUpdate = (data) => {
  if (!wss) return;
  const msg = JSON.stringify({ event: "status.update", data });
  let sentCount = 0;
  
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      try {
        client.send(msg);
        sentCount++;
      } catch (e) {
        // don't let one client error affect others
        console.warn("ws send error:", e);
      }
    }
  }
  
  log(`📢 Status update broadcast sent to ${sentCount} clients for ID: ${data.id}`);
};

// Broadcast normal task (resource allocation) immediately to all connected clients
export const emitNormalTaskImmediate = (data) => {
  if (!wss) return;
  const msg = JSON.stringify({ event: "normal.task", data });
  let sentCount = 0;
  
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      try {
        client.send(msg);
        sentCount++;
      } catch (e) {
        // don't let one client error affect others
        console.warn("ws send error:", e);
      }
    }
  }
  
  log(`📢 Normal task broadcast sent to ${sentCount} clients`);
};
