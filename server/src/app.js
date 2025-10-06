import express from "express";
import cors from "cors";
import sosRoutes from "./routes/sos.routes.js";
import normalTaskRoutes from "./routes/normalTask.routes.js";
import deptAuthRoutes from "./routes/departmentAuth.routes.js";
import broadcastRoutes from "./routes/broadcast.routes.js";


const app = express();

app.use(cors());
app.use(express.json());

// health
app.get("/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// API routes
app.use("/api/sos", sosRoutes);
app.use("/api/normal", normalTaskRoutes);
app.use("/api/dept", deptAuthRoutes);
app.use("/api", broadcastRoutes);

// root/landing
app.get("/", (req, res) => {
  res.send("Community Emergency Network - Primary Backend");
});

export default app;
