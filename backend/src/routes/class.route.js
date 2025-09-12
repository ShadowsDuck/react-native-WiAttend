import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getUserClasses,
  createClass,
  joinClass,
  getClassById,
  updateClassById,
  deleteClassById,
  getAllSessionsByClassId,
} from "../controllers/class.controller.js";
import { createScheduleAndSessions } from "../controllers/schedules.controller.js";
import { getAttendanceSummary } from "../controllers/attendances.controller.js";

const router = express.Router();

// public route

// protected routes
router.get("/", requireAuth(), getUserClasses);
router.post("/", requireAuth(), createClass);
router.post("/join", requireAuth(), joinClass);
router.get("/:classId", requireAuth(), getClassById);
router.put("/:classId", requireAuth(), updateClassById);
router.delete("/:classId", requireAuth(), deleteClassById);

router.post("/:classId/schedules", requireAuth(), createScheduleAndSessions);
router.get("/:classId/sessions", requireAuth(), getAllSessionsByClassId);

router.get("/:classId/summary", requireAuth(), getAttendanceSummary);

export default router;
