import { db } from "../config/db.js";
import { classes, schedules, class_sessions, rooms } from "../db/schema.js";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import { add } from "date-fns";
import { dayMapping } from "../utils/dayMapping.js";

export async function createScheduleAndSessions(req, res) {
  // ตัวแปรสำหรับเก็บ ID ของ schedule ที่เพิ่งสร้าง
  // เพื่อใช้ในการ Rollback (ลบทิ้ง) หากขั้นตอนต่อไปล้มเหลว
  let createdScheduleId = null;

  try {
    const { userId } = getAuth(req);
    const { classId } = req.params;

    // --- ส่วนที่ 1: ตรวจสอบสิทธิ์และข้อมูลนำเข้าทั้งหมดก่อนลงมือ ---

    // ดึงข้อมูลคลาสเพื่อตรวจสอบความเป็นเจ้าของและเอาข้อมูลเทอมมาใช้
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.class_id, classId),
    });

    if (!classInfo) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classInfo.owner_user_id !== userId) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this class" });
    }

    const {
      day_of_week,
      start_time,
      end_time,
      checkin_close_after_min,
      room_id,
    } = req.body;

    // การตรวจสอบ Input ทั้งหมด (Validation)
    if (
      !day_of_week ||
      !start_time ||
      !end_time ||
      !checkin_close_after_min ||
      !room_id
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }
    if (isNaN(checkin_close_after_min)) {
      return res
        .status(400)
        .json({ message: "checkin_close_after_min must be a number" });
    }

    const TARGET_TIME_ZONE = "Asia/Bangkok";
    const TIME_FORMAT = "HH:mm:ss";
    const formattedStartTime = formatInTimeZone(
      start_time,
      TARGET_TIME_ZONE,
      TIME_FORMAT
    );
    const formattedEndTime = formatInTimeZone(
      end_time,
      TARGET_TIME_ZONE,
      TIME_FORMAT
    );

    if (formattedStartTime >= formattedEndTime) {
      return res
        .status(400)
        .json({ message: "Start time must be before end time" });
    }

    const existingSchedule = await db.query.schedules.findFirst({
      where: (schedules, { and, eq, gte, lte }) =>
        and(
          eq(schedules.class_id, classId),
          eq(schedules.day_of_week, day_of_week),
          lte(schedules.start_time, formattedEndTime),
          gte(schedules.end_time, formattedStartTime)
        ),
    });

    if (existingSchedule) {
      return res
        .status(409)
        .json({ message: "A conflicting schedule already exists" });
    }

    // --- ส่วนที่ 2: เริ่มการกระทำที่แก้ไขข้อมูล (Mutation) ---

    // 2.1 สร้าง Schedule ใหม่
    const newScheduleArray = await db
      .insert(schedules)
      .values({
        class_id: classId,
        day_of_week,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        checkin_close_after_min,
        room_id,
      })
      .returning();

    const newSchedule = newScheduleArray[0];
    if (!newSchedule) {
      // ไม่น่าจะเกิด แต่ดักไว้ก่อน
      throw new Error(
        "Failed to create schedule record, insert query returned nothing."
      );
    }
    // เก็บ ID ไว้เผื่อต้องใช้ลบทิ้ง
    createdScheduleId = newSchedule.schedule_id;

    // 2.2 สร้าง Sessions ทั้งหมดสำหรับ Schedule ใหม่
    const { semester_start_date, semester_weeks } = classInfo;
    const dayIndex = dayMapping[day_of_week.toLowerCase()];
    const sessionsToInsert = [];

    // 1. สร้าง Date object จากวันเริ่มเทอม โดยตั้งเวลาเป็นเที่ยงคืนเพื่อความแม่นยำ
    let startDate = new Date(semester_start_date);
    startDate.setUTCHours(0, 0, 0, 0);

    // 2. หาวันแรกที่ตรงกับ day_of_week
    let firstSessionDate = new Date(startDate);
    // ค่อยๆ บวกไปทีละวันจนกว่าจะเจอวันที่ตรงกับ dayIndex
    while (firstSessionDate.getDay() !== dayIndex) {
      firstSessionDate = add(firstSessionDate, { days: 1 });
    }

    // 3. วนลูปตามจำนวนสัปดาห์ โดยใช้วันแรกที่หาได้เป็นตัวตั้งต้น
    for (let week = 0; week < semester_weeks; week++) {
      const sessionDate = add(firstSessionDate, { weeks: week });

      sessionsToInsert.push({
        schedule_id: newSchedule.schedule_id,
        class_id: classId,
        session_date: sessionDate,
        is_canceled: false,
      });
    }

    if (sessionsToInsert.length > 0) {
      // ถ้าขั้นตอนนี้ล้มเหลว มันจะโยน Error เข้าไปใน catch block
      await db.insert(class_sessions).values(sessionsToInsert);
    }

    // ถ้าทุกอย่างสำเร็จ
    return res.status(201).json(newSchedule);
  } catch (error) {
    // --- ส่วนที่ 3: จัดการ Error และทำการ Rollback ---
    console.error(
      "An error occurred during the create process:",
      error.message
    );

    // ถ้า `createdScheduleId` มีค่า (หมายความว่า schedule ถูกสร้างไปแล้ว)
    // แต่เกิด error ในขั้นตอนหลังจากนั้น (เช่น ตอนสร้าง session)
    // เราต้องลบ schedule ที่สร้างไปแล้วทิ้ง
    if (createdScheduleId) {
      console.log(
        `Attempting to rollback (delete) schedule with ID: ${createdScheduleId}`
      );
      try {
        await db
          .delete(schedules)
          .where(eq(schedules.schedule_id, createdScheduleId));
        console.log(
          `Rollback successful for schedule ID: ${createdScheduleId}`
        );
      } catch (rollbackError) {
        // นี่คือกรณีที่เลวร้ายที่สุด: สร้าง schedule ไปแล้ว, สร้าง session ไม่ได้, และลบ schedule ก็ไม่ได้
        // ต้องแจ้งเตือนผู้ดูแลระบบให้มาตรวจสอบข้อมูลขยะใน DB
        console.error(
          "FATAL: FAILED TO ROLLBACK SCHEDULE. Manual database cleanup required.",
          rollbackError
        );
      }
    }

    // ส่ง Response Error กลับไปให้ Frontend
    // (ใช้ error.status ถ้ามี, หรือ 500 ถ้าไม่มี)
    return res.status(error.status || 500).json({
      message: error.message || "An internal server error occurred.",
    });
  }
}

export async function getScheduleById(req, res) {
  try {
    const { userId } = getAuth(req);
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({ message: "scheduleId is required" });
    }

    // ค้นหา schedule
    const existingSchedule = await db.query.schedules.findFirst({
      where: eq(schedules.schedule_id, scheduleId),
    });

    if (!existingSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // ตรวจสอบว่า user นี้เป็นเจ้าของคลาส
    const ownerResult = await db
      .select({ owner_user_id: classes.owner_user_id })
      .from(classes)
      .where(eq(classes.class_id, existingSchedule.class_id))
      .limit(1);

    const ownerUserId = ownerResult[0]?.owner_user_id;

    if (ownerUserId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this class" });
    }

    return res.status(200).json(existingSchedule);
  } catch (error) {
    console.error("❌ Error fetching schedule:", error.message);
    return res
      .status(error?.status || 500)
      .json({ message: error?.message || "Internal server error" });
  }
}

export async function updateScheduleById(req, res) {
  try {
    const { userId } = getAuth(req);
    const { scheduleId } = req.params;
    const { start_time, end_time, checkin_close_after_min, room_id } = req.body;

    // --- ส่วนที่ 1: ตรวจสอบสิทธิ์และข้อมูลนำเข้า ---
    if (
      start_time === undefined ||
      end_time === undefined ||
      checkin_close_after_min === undefined ||
      room_id === undefined
    ) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    const checkinMinutes = Number(checkin_close_after_min);
    if (isNaN(checkinMinutes)) {
      return res
        .status(400)
        .json({ message: "checkin_close_after_min must be a number" });
    }
    if (checkinMinutes < 0) {
      return res
        .status(400)
        .json({ message: "checkin_close_after_min must not be less than 0" });
    }

    const existingSchedule = await db.query.schedules.findFirst({
      where: eq(schedules.schedule_id, scheduleId),
    });

    if (!existingSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const existingRoom = await db.query.rooms.findFirst({
      where: eq(rooms.room_id, room_id),
    });

    if (!existingRoom) {
      return res.status(400).json({ message: "Invalid room_id" });
    }

    const ownerResult = await db
      .select({ owner_user_id: classes.owner_user_id })
      .from(classes)
      .where(eq(classes.class_id, existingSchedule.class_id))
      .limit(1);

    const ownerUserId = ownerResult[0]?.owner_user_id;

    if (ownerUserId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this class" });
    }

    // --- ส่วนที่ 2: อัปเดตข้อมูล ---
    const dataToUpdate = {
      start_time: start_time,
      end_time: end_time,
      checkin_close_after_min: checkinMinutes,
      room_id: room_id,
    };

    const updatedScheduleArray = await db
      .update(schedules)
      .set(dataToUpdate)
      .where(eq(schedules.schedule_id, scheduleId))
      .returning();

    // ถ้าทุกอย่างสำเร็จ
    return res.status(200).json(updatedScheduleArray[0]);
  } catch (error) {
    // จัดการ Error ทั่วไป
    console.error("An error occurred during schedule update:", error.message);
    return res.status(error?.status || 500).json({
      message: error?.message || "An internal server error occurred.",
    });
  }
}

export async function deleteScheduleById(req, res) {
  try {
    const { userId } = getAuth(req);
    const { scheduleId } = req.params;

    // --- ส่วนที่ 1: ตรวจสอบสิทธิ์ ---
    const existingSchedule = await db.query.schedules.findFirst({
      where: eq(schedules.schedule_id, scheduleId),
    });

    if (!existingSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const ownerResult = await db
      .select({ owner_user_id: classes.owner_user_id })
      .from(classes)
      .where(eq(classes.class_id, existingSchedule.class_id))
      .limit(1);

    const ownerUserId = ownerResult[0]?.owner_user_id;

    if (ownerUserId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this class" });
    }

    // ลบตารางเรียน
    await db.delete(schedules).where(eq(schedules.schedule_id, scheduleId));

    // ส่ง 204 No Content กลับไป
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting the schedule:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
