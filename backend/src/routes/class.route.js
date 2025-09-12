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
  getClassMembers,
} from "../controllers/class.controller.js";
import { createScheduleAndSessions } from "../controllers/schedules.controller.js";
import {
  getAttendanceSummary,
  getStudentAttendanceDetail,
} from "../controllers/attendances.controller.js";
import { exportAttendanceAsCsv } from "../controllers/exportAttendanceAsCsv.controller.js";

const router = express.Router();

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
router.get(
  "/:classId/students/:userId",
  requireAuth(),
  getStudentAttendanceDetail
);
router.get("/:classId/export", exportAttendanceAsCsv);

router.get("/:classId/members", requireAuth(), getClassMembers);

export default router;
