import { db } from "../config/db.js";
import { users } from "../db/schema.js";
import { eq, desc, and, gt, lt } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";

export async function getUserProfileByUserId(req, res) {
  try {
    const { user_id } = req.params;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.user_id, user_id))
      .orderBy(desc(users.created_at));

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user[0]);
  } catch (error) {
    console.log("Error getting the transactions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createUserProfile(req, res) {
  try {
    const { userId } = getAuth(req);
    console.log("🔐 userId from Clerk token:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // เช็คซ้ำว่า user ซ้ำไหม
    const exists = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.user_id, userId),
    });

    if (exists) {
      return res.status(200).json({ message: "User already exists" });
    }

    const user = await db.insert(users).values({ user_id: userId }).returning();
    console.log("✅ New user created:", user);

    res.status(201).json(user[0]);
  } catch (error) {
    console.error("Error creating the user", error);
    res.status(500).json({ message: "Internal server Error" });
  }
}
