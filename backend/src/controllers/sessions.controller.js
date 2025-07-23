import { db } from "../config/db.js";
import {
  classes,
  user_classes,
  users,
  schedules,
  rooms,
  wifi_access_points,
  class_sessions,
  attendances,
} from "../db/schema.js";
import { getAuth } from "@clerk/express";
import { eq, sql, or, asc, and, inArray } from "drizzle-orm";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export async function checkin(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.params;

    const numericSessionId = parseInt(sessionId, 10);

    // ตรวจสอบเผื่อว่าสิ่งที่ส่งมาไม่ใช่ตัวเลข
    if (isNaN(numericSessionId)) {
      return res.status(400).json({ error: "Invalid session ID format" });
    }

    const sessionsResult = await db
      .select()
      .from(class_sessions)
      .innerJoin(
        schedules,
        eq(class_sessions.schedule_id, schedules.schedule_id)
      )
      .where(eq(class_sessions.session_id, numericSessionId));

    if (sessionsResult.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    const sessionInfo = sessionsResult[0];

    // เช็คชื่อไปหรือยัง
    const exists = await db.query.attendances.findFirst({
      where: (attendances, { eq, and }) =>
        and(
          eq(attendances.user_id, userId),
          eq(attendances.session_id, numericSessionId)
        ),
    });

    if (exists) {
      return res.status(400).json({ message: "User already checkin" });
    }

    const now = new Date();
    const TARGET_TIME_ZONE = "Asia/Bangkok";
    const todayDateStringInTargetZone = formatInTimeZone(
      now,
      TARGET_TIME_ZONE,
      "yyyy-MM-dd"
    );

    const startTimeInUTC = fromZonedTime(
      `${todayDateStringInTargetZone}T${sessionInfo.start_time}`,
      TARGET_TIME_ZONE
    );
    const closeTimeInUTC = new Date(
      startTimeInUTC.getTime() + sessionInfo.checkin_close_after_min * 60000
    );

    const GRACE_PERIOD_MS = 5000;
    const finalCloseTimeInUTC = new Date(
      closeTimeInUTC.getTime() + GRACE_PERIOD_MS
    );

    if (now >= finalCloseTimeInUTC) {
      return res.status(400).json({ message: "Time out" });
    }

    const newAttendance = {
      user_id: userId,
      class_id: sessionInfo.class_sessions.class_id,
      session_id: numericSessionId,
      checked_in_at: sql`NOW() AT TIME ZONE 'Asia/Bangkok'`,
    };

    await db.insert(attendances).values(newAttendance);

    return res.status(201).json({ message: "Check-in successful" });
  } catch (error) {
    console.error("Error creating the user", error);
    res.status(500).json({ message: "Internal server Error" });
  }
}
