import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getUserProfileByUserId,
  upsertUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

// public route
router.get("/profile/:user_id", getUserProfileByUserId);

// protected routes
router.post("/profile", requireAuth(), upsertUserProfile);
router.put("/profile/editProfile", requireAuth(), updateUserProfile);

export default router;
