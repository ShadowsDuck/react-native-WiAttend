import express from "express";
import { requireAuth } from "@clerk/express";
import { checkin } from "../controllers/sessions.controller.js";

const router = express.Router();

// public route

// protected routes
router.post("/:sessionId/checkin", requireAuth(), checkin);

export default router;
