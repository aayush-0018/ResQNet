import { useEffect, useState } from "react";
import { connectWorkerWS, addWorkerListener } from "../services/wsWorker";

export default function WorkerConnection({ userId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    connectWorkerWS(userId);
    const unsubscribe = addWorkerListener((data) => {
      setMessages((prev) => [data, ...prev]); // prepend new message
    });
    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="worker-conn">
      <h2>Worker Notifications (User: {userId})</h2>
      {messages.length === 0 && <p>No messages yet...</p>}
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>
            <strong>{msg.event}</strong>: {JSON.stringify(msg.data)}
          </li>
        ))}
      </ul>
    </div>
  );
}
