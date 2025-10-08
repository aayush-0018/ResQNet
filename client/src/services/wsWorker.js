// src/services/wsWorker.js
let socket = null;
let listeners = [];

export const connectWorkerWS = (userId) => {
  if (socket && socket.readyState === WebSocket.OPEN) return socket;

  let url = import.meta.env.VITE_WS_URL || "ws://localhost:8082";

  socket = new WebSocket(url); // 🔹 your worker WS server

  socket.onopen = () => {
    console.log("[WorkerWS] Connected");
    // Add a small delay to ensure WebSocket is fully ready
    setTimeout(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ action: "register", userId }));
          console.log("[WorkerWS] Registration sent for userId:", userId);
        } catch (err) {
          console.error("[WorkerWS] Failed to send registration:", err);
        }
      }
    }, 100);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("[WorkerWS] Message:", data);
      listeners.forEach((cb) => cb(data));
    } catch (err) {
      console.error("Invalid worker WS message", err);
    }
  };

  socket.onclose = (event) => {
    console.log("[WorkerWS] Disconnected", event.code, event.reason);
  };
  
  socket.onerror = (err) => {
    console.error("[WorkerWS] Error", err);
  };

  return socket;
};

export const addWorkerListener = (callback) => {
  listeners.push(callback);
  return () => { listeners = listeners.filter((l) => l !== callback); };
};
