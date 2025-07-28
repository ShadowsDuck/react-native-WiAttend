import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getScheduleById,
  updateScheduleById,
  deleteScheduleById,
} from "../controllers/schedules.controller.js";

const router = express.Router();

router.get("/:scheduleId", requireAuth(), getScheduleById);
router.put("/:scheduleId", requireAuth(), updateScheduleById);
router.delete("/:scheduleId", requireAuth(), deleteScheduleById);

export default router;
