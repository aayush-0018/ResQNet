import express from "express";
import { handleSOS, listRecentEmergencies, updateEmergencyStatus } from "../controllers/sos.controller.js";

const router = express.Router();

router.post("/", handleSOS);
router.get("/", listRecentEmergencies);
router.patch("/:id/status", updateEmergencyStatus);

export default router;
