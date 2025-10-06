import express from "express";
import { handleNormalTask, listRecentNormalTasks, updateNormalTaskStatus } from "../controllers/normalTaskController.js";

const router = express.Router();

router.post("/", handleNormalTask);
router.get("/", listRecentNormalTasks);
router.patch("/:id/status", updateNormalTaskStatus);

export default router;