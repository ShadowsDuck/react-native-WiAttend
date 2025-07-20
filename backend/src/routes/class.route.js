import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getUserClasses,
  createClass,
  joinClass,
} from "../controllers/class.controller.js";

const router = express.Router();

// public route
// router.get("/:class_id", getClassByOwnerUserId);

// protected routes
router.get("/", requireAuth(), getUserClasses);
router.post("/", requireAuth(), createClass);
router.post("/join", requireAuth(), joinClass);
// router.put("/profile/editProfile", requireAuth(), updateUserProfile);

export default router;
