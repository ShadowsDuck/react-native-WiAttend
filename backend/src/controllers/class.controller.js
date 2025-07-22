import { db } from "../config/db.js";
import {
  classes,
  user_classes,
  users,
  schedules,
  rooms,
  wifi_access_points,
} from "../db/schema.js";
import { getAuth } from "@clerk/express";
import { generateUniqueJoinCode } from "../utils/generateJoinCode.js";
import { eq, sql, inArray } from "drizzle-orm";

export async function getUserClasses(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No user ID found in token" });
    }

    // Get classes where user is a participant (joined classes)
    const participatedClasses = await db
      .select({
        class_id: classes.class_id,
        subject_name: classes.subject_name,
        semester_start_date: classes.semester_start_date,
        semester_weeks: classes.semester_weeks,
        description: classes.description,
        join_code: classes.join_code,
        owner_user_id: classes.owner_user_id,
        // Add owner name fields
        owner_first_name: users.first_name,
        owner_last_name: users.last_name,
        role: sql`'participant'`.as("role"),
        joined_at: user_classes.created_at,
      })
      .from(user_classes)
      .innerJoin(classes, eq(user_classes.class_id, classes.class_id))
      // Join with users table to get owner information
      .innerJoin(users, eq(classes.owner_user_id, users.user_id))
      .where(eq(user_classes.user_id, userId))
      .orderBy(user_classes.created_at);

    // Get classes where user is the owner
    const ownedClasses = await db
      .select({
        class_id: classes.class_id,
        subject_name: classes.subject_name,
        semester_start_date: classes.semester_start_date,
        semester_weeks: classes.semester_weeks,
        description: classes.description,
        join_code: classes.join_code,
        owner_user_id: classes.owner_user_id,
        // Add owner name fields
        owner_first_name: users.first_name,
        owner_last_name: users.last_name,
        role: sql`'owner'`.as("role"),
        joined_at: user_classes.created_at,
      })
      .from(classes)
      // Join with users table to get owner information
      .innerJoin(users, eq(classes.owner_user_id, users.user_id))
      .leftJoin(
        user_classes,
        sql`${classes.class_id} = ${user_classes.class_id} AND ${user_classes.user_id} = ${userId}`
      )
      .where(eq(classes.owner_user_id, userId))
      .orderBy(user_classes.created_at);

    // Combine both arrays and remove duplicates
    const allClasses = [...participatedClasses, ...ownedClasses];
    const uniqueClasses = allClasses.filter(
      (cls, index, self) =>
        index === self.findIndex((c) => c.class_id === cls.class_id)
    );

    // Sort by joined_at from oldest to newest
    uniqueClasses.sort((a, b) => {
      if (!a.joined_at && !b.joined_at) return a.class_id - b.class_id;
      if (!a.joined_at) return 1;
      if (!b.joined_at) return -1;
      return new Date(a.joined_at) - new Date(b.joined_at);
    });

    // Transform the data to include formatted owner name
    const classesWithOwnerName = uniqueClasses.map((cls) => ({
      ...cls,
      owner_name: `${cls.owner_first_name || ""} ${
        cls.owner_last_name || ""
      }`.trim(),
      owner_full_name: {
        first_name: cls.owner_first_name,
        last_name: cls.owner_last_name,
      },
    }));

    return res.status(200).json(classesWithOwnerName);
  } catch (error) {
    console.error("❌ Error getting classes", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createClass(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { subject_name, semester_start_date, semester_weeks } = req.body;

    const join_code = await generateUniqueJoinCode();

    const classroom = await db
      .insert(classes)
      .values({
        owner_user_id: userId,
        subject_name,
        semester_start_date,
        semester_weeks,
        join_code,
      })
      .returning();

    const classId = classroom[0].class_id;

    // เพิ่มเจ้าของเข้า user_classes ด้วย
    await db.insert(user_classes).values({
      user_id: userId,
      class_id: classId,
    });

    res.status(201).json(classroom[0]);
  } catch (error) {
    console.error("Error creating the classroom", error);
    res.status(500).json({ message: "Internal server Error" });
  }
}

export async function joinClass(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { join_code } = req.body;

    const classData = await db
      .select({ class_id: classes.class_id })
      .from(classes)
      .where(eq(classes.join_code, join_code));

    const classId = classData[0].class_id;

    // ตรวจสอบว่า join_code ส่งมาถูกต้อง
    if (!classId) {
      return res.status(404).json({ message: "Invalid join code" });
    }

    // เช็คว่า user เข้าร่วมอยู่แล้วหรือยัง
    const exists = await db.query.user_classes.findFirst({
      where: (user_classes, { eq, and }) =>
        and(
          eq(user_classes.class_id, classId),
          eq(user_classes.user_id, userId)
        ),
    });

    if (exists) {
      return res.status(409).json({ message: "Already joined this class" });
    }

    await db.insert(user_classes).values({
      user_id: userId,
      class_id: classId,
    });

    res.status(201).json({ message: "Join class success" });
  } catch (error) {
    console.error("❌ [joinClass] error:", error);
    res.status(500).json({ message: "Internal server Error" });
  }
}

export async function getClassById(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No user ID found in token" });
    }

    const { classId } = req.params;

    const classDetail = await db
      .select()
      .from(classes)
      .innerJoin(users, eq(classes.owner_user_id, users.user_id))
      .where(eq(classes.class_id, classId));

    if (classDetail.length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }

    const classSchedules = await db
      .select()
      .from(schedules)
      .innerJoin(rooms, eq(schedules.room_id, rooms.room_id))
      .where(eq(schedules.class_id, classId));

    const roomIds = classSchedules.map((s) => s.rooms.room_id);

    const wifiAccessPoints = await db
      .select()
      .from(wifi_access_points)
      .where(inArray(wifi_access_points.room_id, roomIds));

    const classMembers = await db
      .select()
      .from(user_classes)
      .innerJoin(users, eq(user_classes.user_id, users.user_id))
      .where(eq(user_classes.class_id, classId));

    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(user_classes)
      .where(eq(user_classes.class_id, classId));

    const memberCount = Number(countResult[0]?.count ?? 0);

    const isOwner = classDetail[0].classes.owner_user_id === userId;
    const isMember = classMembers.some(
      (m) => m.user_classes.user_id === userId
    );
    const currentUserStatus = { isOwner, isMember };

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Forbidden - Not your class" });
    }

    return res.status(200).json({
      classDetail,
      classSchedules,
      wifiAccessPoints,
      classMembers,
      memberCount,
      currentUserStatus,
    });
  } catch (error) {
    console.log("Error getting class info", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
