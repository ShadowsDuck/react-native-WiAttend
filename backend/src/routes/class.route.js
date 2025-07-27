import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getUserClasses,
  createClass,
  joinClass,
  getClassById,
  updateClassById,
  deleteClassById,
} from "../controllers/class.controller.js";
import { createScheduleAndSessions } from "../controllers/schedules.controller.js";

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

export default router;
