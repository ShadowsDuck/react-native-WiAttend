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

    // 1. ดึง BSSID ที่สแกนเจอจาก body ของ request
    const { wifiData: scannedWifiData } = req.body;
    if (
      !scannedWifiData ||
      !Array.isArray(scannedWifiData) ||
      scannedWifiData.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "ข้อมูลการสแกน Wi-Fi หายไปหรือไม่ถูกต้อง" });
    }

    // 2. ดึงข้อมูล Access Point ที่อนุญาตจาก DB (เหมือนเดิม)
    const classroomRoomId = sessionInfo.schedules.room_id;
    const allowedAccessPoints = await db.query.wifi_access_points.findMany({
      where: (wifi_access_points, { eq }) =>
        eq(wifi_access_points.room_id, classroomRoomId),
    });

    if (allowedAccessPoints.length === 0) {
      return res
        .status(400)
        .json({ message: "ห้องเรียนนี้ไม่มี Wi-Fi สำหรับการเช็คชื่อ" });
    }

    // 3. *** Logic การตรวจสอบใหม่ทั้งหมด ***
    // เราจะหาว่ามี Wi-Fi "อย่างน้อยหนึ่งตัว" ที่สแกนเจอ
    // ซึ่งตรงกับ BSSID ที่อนุญาต "และ" มีความแรงสัญญาณ (RSSI) สูงกว่าค่าขั้นต่ำที่กำหนดไว้
    const isLocationVerified = scannedWifiData.some((scannedWifi) => {
      // 3.1 หา AP ที่อนุญาตซึ่งมี BSSID ตรงกับตัวที่เพิ่งสแกนเจอ
      const matchingAllowedAP = allowedAccessPoints.find(
        (allowedAP) => allowedAP.bssid.toLowerCase() === scannedWifi.bssid
      );

      // 3.2 ถ้าไม่เจอ BSSID ที่ตรงกันเลยสำหรับตัวนี้ ให้ข้ามไป (return false)
      if (!matchingAllowedAP) {
        return false;
      }

      // 3.3 ถ้าเจอ BSSID ที่ตรงกัน ให้เปรียบเทียบ RSSI ต่อ
      // ค่า RSSI เป็นค่าติดลบ (เช่น -50, -60) ยิ่งค่า "ใกล้ 0" ยิ่งแรง
      // ดังนั้น scannedWifi.rssi >= matchingAllowedAP.min_rssi จึงเป็นการเช็คว่าสัญญาณแรงพอ
      const isRssiStrongEnough = scannedWifi.rssi >= matchingAllowedAP.min_rssi;

      console.log(
        `Checking BSSID: ${scannedWifi.bssid}, Scanned RSSI: ${scannedWifi.rssi}, Required min_rssi: ${matchingAllowedAP.min_rssi}, Strong enough: ${isRssiStrongEnough}`
      );

      return isRssiStrongEnough; // คืนค่า true ถ้าสัญญาณแรงพอ
    });

    // 4. ถ้าหลังจากวนเช็คทั้งหมดแล้วยังไม่มีตัวไหนตรงเงื่อนไขเลย -> ปฏิเสธ
    if (!isLocationVerified) {
      return res
        .status(400)
        .json({
          message: "คุณไม่ได้อยู่บริเวณห้องเรียน หรือสัญญาณ Wi-Fi อ่อนเกินไป",
        });
    }

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
