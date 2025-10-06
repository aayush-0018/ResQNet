import express from "express";
import { 
  broadcastEmergency, 
  getContributors, 
  subscribeToNDRF, 
  unsubscribeFromNDRF,
  getContributorSubscriptions,
  getContributorNotifications
} from "../controllers/broadcast.controller.js";

const router = express.Router();

// Broadcast emergency to contributors
router.post("/emergency/broadcast", broadcastEmergency);

// Get all contributors for an NDRF team
router.get("/contributors/:ndrfTeamId", getContributors);

// Get contributor subscriptions
router.get("/contributor/:contributorId/subscriptions", getContributorSubscriptions);

// Get contributor notifications
router.get("/contributor/:contributorId/notifications", getContributorNotifications);

// Subscribe contributor to NDRF team
router.post("/subscribe", subscribeToNDRF);

// Unsubscribe contributor from NDRF team
router.post("/unsubscribe", unsubscribeFromNDRF);

export default router;