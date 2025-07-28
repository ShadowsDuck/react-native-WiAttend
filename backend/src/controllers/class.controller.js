import { db } from "../config/db.js";
import {
  classes,
  user_classes,
  users,
  schedules,
  class_sessions,
  attendances,
} from "../db/schema.js";
import { getAuth } from "@clerk/express";
import { generateUniqueJoinCode } from "../utils/generateJoinCode.js";
import { eq, sql, or, asc, and, gte, lte, inArray } from "drizzle-orm";
import { processSessionStatuses } from "../utils/session.js";
import { add, startOfMonth, endOfMonth } from "date-fns";
import { dayMapping } from "../utils/dayMapping.js";

export async function getUserClasses(req, res) {
  try {
    const { userId } = getAuth(req);

    // --- Query หลัก: ดึงข้อมูลคลาสทั้งหมดในครั้งเดียว ---
    const userClasses = await db
      .select({
        // --- ส่วนที่ 1: เลือกข้อมูลพื้นฐานของคลาสจากตาราง 'classes' ---
        class_id: classes.class_id,
        subject_name: classes.subject_name,
        // description: classes.description,
        join_code: classes.join_code,
        owner_user_id: classes.owner_user_id,

        // --- ส่วนที่ 2: สร้างข้อมูลใหม่ขึ้นมาด้วยพลังของ SQL เพื่อลดภาระฝั่ง Client ---

        // สร้าง 'owner_name' โดยการนำชื่อจริงและนามสกุลจากตาราง 'users' มาต่อกัน
        // ใช้ CONCAT() ของ SQL เพื่อต่อสตริง และ TRIM() เพื่อลบช่องว่างส่วนเกินที่อาจเกิดขึ้น
        owner_name:
          sql`TRIM(CONCAT(${users.first_name}, ' ', ${users.last_name}))`.as(
            "owner_name"
          ),

        // สร้าง 'role' เพื่อระบุบทบาทของผู้ใช้ในคลาสนี้
        // ใช้ CASE WHEN ของ SQL เพื่อสร้างเงื่อนไข:
        // - ถ้า owner_user_id ของคลาสตรงกับ userId ปัจจุบัน -> บทบาทคือ 'owner'
        // - กรณีอื่นๆ ทั้งหมด -> บทบาทคือ 'participant'
        role: sql`CASE WHEN ${classes.owner_user_id} = ${userId} THEN 'owner' ELSE 'participant' END`.as(
          "role"
        ),

        // ดึงข้อมูล 'created_at' จากตาราง 'user_classes' เพื่อใช้เป็น 'วันที่เข้าร่วม' (joined_at)
        joined_at: user_classes.created_at,
      })
      // --- ส่วนที่ 3: การเชื่อมตาราง (JOINs) ---

      // เริ่มจากตาราง 'classes' เป็นตารางหลัก
      .from(classes)

      // INNER JOIN กับตาราง 'users' เพื่อเอาข้อมูลชื่อของเจ้าของคลาส
      // เชื่อมโดยใช้ `classes.owner_user_id` กับ `users.user_id`
      .innerJoin(users, eq(classes.owner_user_id, users.user_id))

      // LEFT JOIN กับตาราง 'user_classes' เพื่อตรวจสอบว่าผู้ใช้คนปัจจุบันได้เข้าร่วมคลาสไหนบ้าง
      // **เหตุผลที่ใช้ LEFT JOIN:** เราต้องการให้คลาสที่ผู้ใช้เป็นเจ้าของแสดงขึ้นมาเสมอ
      // แม้ว่าผู้ใช้คนนั้น (ในฐานะเจ้าของ) จะไม่มี record อยู่ในตาราง user_classes ก็ตาม
      // โดยจะเชื่อมเฉพาะ record ที่ class_id ตรงกัน และ user_id คือผู้ใช้คนปัจจุบันเท่านั้น
      .leftJoin(
        user_classes,
        sql`${classes.class_id} = ${user_classes.class_id} AND ${user_classes.user_id} = ${userId}`
      )

      // --- ส่วนที่ 4: เงื่อนไขการคัดกรองข้อมูล (Filtering) ---

      // .where() คือเงื่อนไขหลักในการหาคลาสที่เกี่ยวข้องกับผู้ใช้
      // ใช้ or() เพื่อระบุว่าเราต้องการคลาสที่เข้าเงื่อนไขข้อใดข้อหนึ่งต่อไปนี้:
      // 1. คลาสที่ 'owner_user_id' คือ userId ปัจจุบัน (เขาเป็นเจ้าของ)
      // 2. คลาสที่ 'user_id' ในตาราง 'user_classes' คือ userId ปัจจุบัน (เขาเป็นสมาชิก)
      .where(
        or(eq(classes.owner_user_id, userId), eq(user_classes.user_id, userId))
      )

      // --- ส่วนที่ 5: การจัดเรียงข้อมูล (Sorting) ---

      // จัดเรียงผลลัพธ์ตามวันที่เข้าร่วม (joined_at) จากเก่าที่สุดไปใหม่ที่สุด
      // เพื่อให้คลาสที่เข้าร่วมก่อนแสดงขึ้นมาก่อน
      .orderBy(asc(user_classes.created_at));

    // 5. ส่งข้อมูลที่ได้จาก Database กลับไปให้ Frontend ได้เลย
    // ไม่จำเป็นต้องมีการ filter, map, หรือ sort ใน JavaScript อีกต่อไป
    return res.status(200).json(userClasses);
  } catch (error) {
    // กรณีเกิดข้อผิดพลาดที่ไม่คาดคิดในระหว่างการทำงาน
    console.error("❌ Error getting user classes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createClass(req, res) {
  try {
    const { userId } = getAuth(req);

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

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { classId } = req.params;

    // --- Query หลักเพื่อดึงข้อมูลคลาสและเจ้าของ ---
    const classResult = await db
      .select({
        // เลือกข้อมูลที่จำเป็นจาก 'classes'
        ...classes,
        // สร้าง owner_name ขึ้นมาเลย
        owner_name:
          sql`TRIM(CONCAT(${users.first_name}, ' ', ${users.last_name}))`.as(
            "owner_name"
          ),
      })
      .from(classes)
      .innerJoin(users, eq(classes.owner_user_id, users.user_id))
      .where(eq(classes.class_id, classId));

    if (classResult.length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }
    const classDetail = classResult[0]; // เราได้ข้อมูลคลาสมาแล้ว

    // ตรวจสอบสิทธิ์การเข้าถึง
    const memberCheck = await db.query.user_classes.findFirst({
      where: and(
        eq(user_classes.class_id, classId),
        eq(user_classes.user_id, userId)
      ),
    });

    const isOwner = classDetail.owner_user_id === userId;
    const isMember = !!memberCheck;

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Forbidden: Not your class" });
    }

    // --- ดึงข้อมูลส่วนที่เหลือ (Schedules, Members, etc.) ---

    // Query 1: ดึงตารางเรียนทั้งหมด
    const schedulesQuery = await db.query.schedules.findMany({
      where: eq(schedules.class_id, classId),
      orderBy: [asc(schedules.day_of_week), asc(schedules.start_time)],
    });

    // Query 2: นับจำนวนสมาชิก
    const memberCountQuery = db
      .select({ count: sql`count(*)` })
      .from(user_classes)
      .where(eq(user_classes.class_id, classId));

    // Query 3: หาทุก Sessions ของวันนี้
    // const today = new Date().toISOString().split("T")[0]; // ได้ YYYY-MM-DD
    const allTodaySessionsQuery = db
      .select({
        // เลือกข้อมูลที่จำเป็นจากทั้งสองตาราง
        session_id: class_sessions.session_id,
        schedule_id: class_sessions.schedule_id,
        session_date: class_sessions.session_date,
        start_time: schedules.start_time,
        end_time: schedules.end_time,
        checkin_close_after_min: schedules.checkin_close_after_min,
        room_id: schedules.room_id,
      })
      .from(class_sessions)
      .innerJoin(
        schedules,
        eq(class_sessions.schedule_id, schedules.schedule_id)
      )
      .where(
        and(
          eq(class_sessions.class_id, classId),
          eq(
            class_sessions.session_date,
            sql`(NOW() AT TIME ZONE 'Asia/Bangkok')::date`
          ),
          eq(class_sessions.is_canceled, false)
        )
      )
      .orderBy(asc(schedules.start_time));

    // รัน Query ทั้งหมดพร้อมกัน
    const [classSchedules, countResult, allTodaySessions] = await Promise.all([
      schedulesQuery,
      memberCountQuery,
      allTodaySessionsQuery,
    ]);

    const memberCount = Number(countResult[0]?.count ?? 0);

    // Query 4: หา attendances
    const todaySessionIds = allTodaySessions.map(
      (session) => session.session_id
    );
    let userAttendancesForToday = [];
    if (todaySessionIds.length > 0) {
      userAttendancesForToday = await db.query.attendances.findMany({
        where: and(
          eq(attendances.user_id, userId),
          inArray(attendances.session_id, todaySessionIds)
        ),
        columns: { session_id: true },
      });
    }
    const checkedInSessionIds = new Set(
      userAttendancesForToday.map((att) => att.session_id)
    );

    const processedTodaySessions = processSessionStatuses(
      allTodaySessions,
      checkedInSessionIds
    );

    // --- ประกอบร่าง JSON ที่จะส่งกลับไป ---
    return res.status(200).json({
      classDetail: classDetail, // ส่งข้อมูลคลาสที่ "แบน" แล้วไปเลย
      classSchedules,
      memberCount,
      all_today_sessions: processedTodaySessions,
      currentUserStatus: { isOwner, isMember },
    });
  } catch (error) {
    console.error("Error getting class info by id:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateClassById(req, res) {
  // ตัวแปรสำหรับ Backup ข้อมูลเก่า
  let originalClassData = null;
  let originalSessionsData = [];

  try {
    const { userId } = getAuth(req);
    const { classId } = req.params;

    // --- ส่วนที่ 1: ตรวจสอบสิทธิ์และข้อมูลนำเข้า ---
    const { subject_name, semester_start_date, semester_weeks } = req.body;
    const needsSessionRecreation =
      semester_start_date !== undefined || semester_weeks !== undefined;

    const existingClass = await db.query.classes.findFirst({
      where: eq(classes.class_id, classId),
    });
    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" });
    }
    if (existingClass.owner_user_id !== userId) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this class" });
    }

    const dataToUpdate = {};

    if (subject_name !== undefined) {
      dataToUpdate.subject_name = subject_name;
    }

    if (semester_start_date !== undefined) {
      // ตรวจสอบว่าเป็นวันที่ที่ถูกต้องหรือไม่
      const date = new Date(semester_start_date);
      if (isNaN(date.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid semester_start_date format" });
      }
      dataToUpdate.semester_start_date = semester_start_date;
    }

    if (semester_weeks !== undefined) {
      const semester_weeksNumber = Number(semester_weeks);
      // ตรวจสอบตัวแปรที่ถูกต้อง
      if (isNaN(semester_weeksNumber) || semester_weeksNumber <= 0) {
        return res.status(400).json({
          message: "Invalid semester_weeks format, must be a positive number",
        });
      }
      // ระบุชื่อคอลัมน์ใน DB ให้ถูกต้อง
      dataToUpdate.semester_weeks = semester_weeksNumber;
    }

    // ตรวจสอบว่ามีข้อมูลส่งมาให้อัปเดตหรือไม่
    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    // --- ส่วนที่ 2: เริ่มกระบวนการที่อาจต้อง Rollback ---
    // 2.1 Backup ข้อมูลเก่า ถ้าจำเป็นต้องสร้าง Session ใหม่
    if (needsSessionRecreation) {
      originalClassData = { ...existingClass }; // Copy ข้อมูลคลาสเก่าไว้
      const allSchedules = await db.query.schedules.findMany({
        where: eq(schedules.class_id, classId),
      });
      if (allSchedules.length > 0) {
        const scheduleIds = allSchedules.map((s) => s.schedule_id);
        originalSessionsData = await db.query.class_sessions.findMany({
          where: inArray(class_sessions.schedule_id, scheduleIds),
        });
      }
    }

    // 2.2 อัปเดตตาราง classes ก่อน
    const updatedClassArray = await db
      .update(classes)
      .set(dataToUpdate)
      .where(eq(classes.class_id, classId))
      .returning();
    const updatedClass = updatedClassArray[0];

    // 2.3 ถ้าต้องสร้าง Session ใหม่ ให้ทำที่นี่
    if (needsSessionRecreation) {
      console.log(`Recreating sessions for class ID: ${classId}`);
      const allSchedules = await db.query.schedules.findMany({
        where: eq(schedules.class_id, classId),
      });

      if (allSchedules.length > 0) {
        // ลบของเก่า
        const scheduleIds = allSchedules.map((s) => s.schedule_id);
        await db
          .delete(class_sessions)
          .where(inArray(class_sessions.schedule_id, scheduleIds));

        // สร้างของใหม่
        const allNewSessionsToInsert = [];
        for (const schedule of allSchedules) {
          const startDate = new Date(updatedClass.semester_start_date);
          const dayIndex = dayMapping[schedule.day_of_week.toLowerCase()];
          // ใช้ Logic การคำนวณวันที่ที่ถูกต้องจากครั้งก่อน
          let firstSessionDate = new Date(startDate);
          firstSessionDate.setUTCHours(0, 0, 0, 0);
          while (firstSessionDate.getDay() !== dayIndex) {
            firstSessionDate = add(firstSessionDate, { days: 1 });
          }
          for (let week = 0; week < updatedClass.semester_weeks; week++) {
            const sessionDate = add(firstSessionDate, { weeks: week });
            allNewSessionsToInsert.push({
              schedule_id: schedule.schedule_id,
              class_id: classId,
              session_date: sessionDate,
              is_canceled: false,
            });
          }
        }
        if (allNewSessionsToInsert.length > 0) {
          // ถ้าการ insert นี้ล้มเหลว จะโยน Error เข้า catch block
          await db.insert(class_sessions).values(allNewSessionsToInsert);
        }
      }
    }

    // ถ้าทุกอย่างสำเร็จ
    return res.status(200).json(updatedClass);
  } catch (error) {
    // --- ส่วนที่ 3: จัดการ Error และทำการ Rollback ด้วยตัวเอง ---
    console.error(
      "An error occurred during the update process:",
      error.message
    );

    // ถ้า `originalClassData` มีค่า (หมายถึงเราอยู่ในกระบวนการที่ต้อง Rollback)
    if (originalClassData) {
      console.log(
        `Attempting to restore data for class ID: ${originalClassData.class_id}`
      );
      try {
        // 3.1 Restore ข้อมูลคลาสกลับไปเป็นเหมือนเดิม
        await db
          .update(classes)
          .set({
            subject_name: originalClassData.subject_name,
            semester_start_date: originalClassData.semester_start_date,
            semester_weeks: originalClassData.semester_weeks,
          })
          .where(eq(classes.class_id, originalClassData.class_id));

        // 3.2 ลบ session ที่อาจจะถูกสร้างไปแล้ว (ถ้ามี)
        const allSchedules = await db.query.schedules.findMany({
          where: eq(schedules.class_id, originalClassData.class_id),
        });
        if (allSchedules.length > 0) {
          const scheduleIds = allSchedules.map((s) => s.schedule_id);
          await db
            .delete(class_sessions)
            .where(inArray(class_sessions.schedule_id, scheduleIds));
        }

        // 3.3 Restore session เก่ากลับเข้าไป
        if (originalSessionsData.length > 0) {
          // Drizzle ต้องการให้ลบค่าที่ DB สร้างเองออกไปก่อน insert
          const restoredSessions = originalSessionsData.map(
            ({ session_id, created_at, ...rest }) => rest
          );
          await db.insert(class_sessions).values(restoredSessions);
        }
        console.log("Data restoration successful.");
      } catch (restoreError) {
        console.error(
          "FATAL: FAILED TO RESTORE DATA. Manual database cleanup required.",
          restoreError
        );
      }
    }

    // ส่ง Response Error กลับไปให้ Frontend
    return res.status(error.status || 500).json({
      message: error.message || "An internal server error occurred.",
    });
  }
}

export async function deleteClassById(req, res) {
  try {
    const { userId } = getAuth(req);

    const { classId } = req.params;

    // ตรวจสอบว่าคลาสมีอยู่จริงหรือไม่
    const existingClass = await db.query.classes.findFirst({
      where: (classes, { eq }) => eq(classes.class_id, classId),
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // ตรวจสอบสิทธิ์ความเป็นเจ้าของ
    if (existingClass.owner_user_id !== userId) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this class" });
    }

    // ลบชั้นเรียน
    await db.delete(classes).where(eq(classes.class_id, classId));

    // ส่ง 204 No Content กลับไป
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting the class:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAllSessionsByClassId(req, res) {
  try {
    const { userId } = getAuth(req);
    const { classId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Month and year query parameters are required." });
    }

    // แปลงเป็นตัวเลข
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (isNaN(monthNum) || isNaN(yearNum)) {
      return res.status(400).json({ message: "Invalid month or year format." });
    }

    // --- คำนวณช่วงวันที่ของเดือนที่ต้องการ ---
    // new Date() รับ month เป็น 0-indexed (0=Jan, 1=Feb,...)
    const targetDate = new Date(yearNum, monthNum - 1, 1);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // --- ดึงข้อมูล Sessions เฉพาะในเดือนนั้นๆ ---
    const sessionsInMonth = await db
      .select({
        session_id: class_sessions.session_id,
        schedule_id: class_sessions.schedule_id,
        session_date: class_sessions.session_date,
        is_canceled: class_sessions.is_canceled,
        custom_note: class_sessions.custom_note,
        start_time: schedules.start_time,
        end_time: schedules.end_time,
        room_id: schedules.room_id,
      })
      .from(class_sessions)
      .innerJoin(
        schedules,
        eq(class_sessions.schedule_id, schedules.schedule_id)
      )
      .where(
        and(
          eq(class_sessions.class_id, classId),
          gte(
            class_sessions.session_date,
            monthStart.toISOString().split("T")[0]
          ),
          lte(class_sessions.session_date, monthEnd.toISOString().split("T")[0])
        )
      )
      .orderBy(class_sessions.session_date); // เรียงตามวันที่

    return res.status(200).json(sessionsInMonth);
  } catch (error) {
    console.error("Error fetching sessions for class:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
