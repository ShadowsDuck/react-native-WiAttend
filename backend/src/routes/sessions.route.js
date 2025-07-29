import express from "express";
import { requireAuth } from "@clerk/express";
import { checkin } from "../controllers/sessions.controller.js";
import { getAttendanceSessionById } from "../controllers/attendances.controller.js";

const router = express.Router();

router.post("/:sessionId/checkin", requireAuth(), checkin);
router.get("/:sessionId/attendances", requireAuth(), getAttendanceSessionById);

export default router;
