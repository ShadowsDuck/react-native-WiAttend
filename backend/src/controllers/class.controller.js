import { db } from "../config/db.js";
import { classes, user_classes } from "../db/schema.js";
import { getAuth } from "@clerk/express";
import { generateUniqueJoinCode } from "../utils/generateJoinCode.js";
import { eq, exists, sql } from "drizzle-orm";

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
        role: sql`'participant'`.as("role"), // Mark as participant
      })
      .from(user_classes)
      .innerJoin(classes, eq(user_classes.class_id, classes.class_id))
      .where(eq(user_classes.user_id, userId));

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
        role: sql`'owner'`.as("role"), // Mark as owner
      })
      .from(classes)
      .where(eq(classes.owner_user_id, userId));

    // Combine both arrays and remove duplicates (in case owner is also in user_classes)
    const allClasses = [...participatedClasses, ...ownedClasses];
    const uniqueClasses = allClasses.filter(
      (cls, index, self) =>
        index === self.findIndex((c) => c.class_id === cls.class_id)
    );

    // Sort by class_id for consistent ordering
    uniqueClasses.sort((a, b) => a.class_id - b.class_id);

    return res.status(200).json(uniqueClasses);
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

// export async function updateUserProfile(req, res) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // ตรวจสอบว่า user มีอยู่ใน db มั้ย
//     const existingUser = await db.query.users.findFirst({
//       where: eq(users.user_id, userId),
//     });

//     if (!existingUser) {
//       console.warn(`User not found in DB: ${userId}`);
//       return res.status(404).json({ message: "User not found" });
//     }

//     const { student_id, first_name, last_name, major, year } = req.body;
//     // เช็กว่าข้อมูลถูกส่งมาครบ
//     if (!student_id || !first_name || !last_name || !major || !year) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // 🔍 ตรวจว่า student_id นี้มีอยู่ในระบบแล้วหรือยัง (แต่ต้องไม่ใช่ของตัวเอง)
//     const duplicateStudent = await db.query.users.findFirst({
//       where: (users, { eq, and, ne }) =>
//         and(eq(users.student_id, student_id), ne(users.user_id, userId)),
//     });

//     if (duplicateStudent) {
//       return res.status(409).json({ message: "Student ID already exists" });
//     }

//     // อัปเดตข้อมูล
//     await db
//       .update(users)
//       .set({
//         student_id,
//         first_name,
//         last_name,
//         major,
//         year,
//       })
//       .where(eq(users.user_id, userId));

//     res.status(200).json({ message: "Profile updated successfully" });
//   } catch (error) {
//     console.error("Error creating the user", error);
//     res.status(500).json({ message: "Internal server Error" });
//   }
// }
