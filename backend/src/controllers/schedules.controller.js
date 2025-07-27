import { db } from "../config/db.js";
import { schedules } from "../db/schema.js";
import { getAuth } from "@clerk/express";
import { eq, sql, or, asc, and, inArray } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";

export async function createSchedule(req, res) {
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

    const {
      day_of_week,
      start_time,
      end_time,
      checkin_close_after_min,
      room_id,
    } = req.body;

    // ตรวจสอบข้อมูลที่ได้มา
    if (isNaN(checkin_close_after_min)) {
      return res
        .status(400)
        .json({ message: "checkin_close_after_min must be a number" });
    }
    if (!day_of_week || !start_time || !end_time || !room_id) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
    }

    // แปลงเวลาที่ได้รับมาให้อยู่ในรูปแบบที่ DB ต้องการ
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
    // ตรวจสอบตรรกะเวลาหลังจากแปลงแล้ว
    if (formattedStartTime >= formattedEndTime) {
      return res.status(400).json({
        message: "เวลาเริ่มชั้นเรียนต้องอยู่ก่อนเวลาสิ้นสุดชั้นเรียน",
      });
    }

    // ตรวจสอบตารางเรียนซ้อนกันไหม
    // "ในคลาสเดียวกัน และในวันเดียวกัน มีคาบเรียนอื่นที่เวลาเรียน "คาบเกี่ยวกัน" กับเวลาใหม่ที่ส่งเข้ามาหรือไม่"
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
      return res.status(409).json({ message: "ตรวจพบความขัดแย้งของกำหนดการ" });
    }

    // เพิ่มข้อมูลลง DB
    const newSchedule = await db
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

    res.status(201).json(newSchedule[0]);
  } catch (error) {
    console.error("Error creating the schedule", error);
    res.status(500).json({ message: "Internal server Error" });
  }
}
