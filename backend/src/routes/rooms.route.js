import express from "express";
import { requireAuth } from "@clerk/express";
import { getAllRooms } from "../controllers/rooms.controller.js";

const router = express.Router();

router.get("/", requireAuth(), getAllRooms);

export default router;
