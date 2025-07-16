import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getUserProfileByUserId,
  createUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

// public route
router.get("/profile/:user_id", getUserProfileByUserId);

// protected routes
router.post("/profile", requireAuth(), createUserProfile);

export default router;
