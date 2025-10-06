import express from "express";
import { registerDept, loginDept, getNDRFTeams } from "../controllers/departmentAuth.controller.js";

const router = express.Router();
router.post("/register", registerDept);
router.post("/login", loginDept);
router.get("/ndrf-teams", getNDRFTeams);
export default router;
