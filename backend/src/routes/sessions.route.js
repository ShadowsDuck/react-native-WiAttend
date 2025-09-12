import express from "express";
import { requireAuth } from "@clerk/express";
import {
  checkin,
  updateSessionStatus,
} from "../controllers/sessions.controller.js";
import { getAttendanceSessionById } from "../controllers/attendances.controller.js";

const router = express.Router();

router.post("/:sessionId/checkin", requireAuth(), checkin);
router.get("/:sessionId/attendances", requireAuth(), getAttendanceSessionById);
router.put("/:sessionId", requireAuth(), updateSessionStatus);

export default router;
