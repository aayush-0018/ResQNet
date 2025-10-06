let socket;
let messageHandlers = {};

export function connectWS(onMessage) {
  // Use the correct WebSocket URL from environment variables if available
  const wsUrl = import.meta.env.VITE_SERVICE_URL || "ws://localhost:8081/ws";
  socket = new WebSocket(wsUrl);

  socket.onopen = () => console.log("✅ Connected to WebSocket");
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle different event types
    console.log("WebSocket received:", data);
    if (data.event === "emergency.sos") {
      onMessage(data.data);
    } else if (data.event === "normal.task") {
      // Handle normal task (resource allocation) notifications
      onMessage(data.data);
    } else if (data.event === "status.update") {
      // Handle status update notifications
      console.log("Status update received:", data.data);
      if (messageHandlers.statusUpdate) {
        messageHandlers.statusUpdate(data.data);
      } else {
        console.warn("No handler registered for status.update event");
      }
    }
  };

  socket.onclose = () => {
    console.log("❌ Disconnected from WebSocket");
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      console.log("🔄 Attempting to reconnect WebSocket...");
      connectWS(onMessage);
    }, 5000);
  };
}

export function addMessageHandler(eventType, handler) {
  messageHandlers[eventType] = handler;
}

export function removeMessageHandler(eventType) {
  delete messageHandlers[eventType];
}
