import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getUserClasses,
  createClass,
  joinClass,
  getClassById,
} from "../controllers/class.controller.js";

const router = express.Router();

// public route

// protected routes
router.get("/", requireAuth(), getUserClasses);
router.post("/", requireAuth(), createClass);
router.post("/join", requireAuth(), joinClass);
router.get("/:classId", requireAuth(), getClassById);
// router.put("/profile/editProfile", requireAuth(), updateUserProfile);

export default router;
