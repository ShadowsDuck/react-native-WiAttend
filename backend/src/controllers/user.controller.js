import { db } from "../config/db.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

export async function getUserProfileByUserId(req, res) {
  try {
    const { user_id } = req.params;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.user_id, user_id));

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user[0]);
  } catch (error) {
    console.log("Error getting the user", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function upsertUserProfile(req, res) {
  try {
    const { userId } = getAuth(req);

    let user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.user_id, userId),
    });

    if (!user) {
      console.log(`User ${userId} not found. Creating new profile.`);

      try {
        const newUser = await db
          .insert(users)
          .values({ user_id: userId })
          .returning();
        user = newUser[0];
        return res.status(201).json(user);
      } catch (insertError) {
        // Handle duplicate key error
        if (insertError.code === "23505" || insertError.constraint) {
          console.log(`User ${userId} created by another process. Fetching...`);
          user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.user_id, userId),
          });
          if (user) {
            return res.status(200).json(user);
          }
        }
        throw insertError;
      }
    }

    console.log(`User ${userId} already exists. Returning profile.`);
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in upsertUserProfile", error);
    res.status(500).json({ message: "Internal server Error" });
  }
}

export async function updateUserProfile(req, res) {
  try {
    const { userId } = getAuth(req);

    // ตรวจสอบว่า user มีอยู่ใน db มั้ย
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.user_id, userId),
    });

    if (!existingUser) {
      console.warn(`User not found in DB: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    const { student_id, first_name, last_name, major, year } = req.body;
    // เช็กว่าข้อมูลถูกส่งมาครบ
    if (!student_id || !first_name || !last_name || !major || !year) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔍 ตรวจว่า student_id นี้มีอยู่ในระบบแล้วหรือยัง (แต่ต้องไม่ใช่ของตัวเอง)
    const duplicateStudent = await db.query.users.findFirst({
      where: (users, { eq, and, ne }) =>
        and(eq(users.student_id, student_id), ne(users.user_id, userId)),
    });

    if (duplicateStudent) {
      return res.status(409).json({ message: "Student ID already exists" });
    }

    // อัปเดตข้อมูล
    await db
      .update(users)
      .set({
        student_id,
        first_name,
        last_name,
        major,
        year,
      })
      .where(eq(users.user_id, userId));

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error creating the user", error);
    res.status(500).json({ message: "Internal server Error" });
  }
}
