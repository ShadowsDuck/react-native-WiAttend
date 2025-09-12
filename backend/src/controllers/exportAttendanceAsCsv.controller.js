// --- Imports ---
import { db } from "../config/db.js";
import {
  class_sessions,
  classes,
  attendances,
  users,
  user_classes,
  schedules,
} from "../db/schema.js";
import { eq, sql, ne, and, asc, count } from "drizzle-orm";
import { Parser } from "@json2csv/plainjs";
import clerkClientNode from "@clerk/clerk-sdk-node";

export async function exportAttendanceAsCsv(req, res) {
  try {
    // --- Step A: Authentication from Query Parameter ---
    const { token } = req.query;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is missing." });
    }

    const claims = await clerkClientNode.verifyToken(token);
    const userId = claims.sub;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // --- Step B: Data Fetching and Authorization ---
    const { classId } = req.params;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is required." });
    }

    // 1. ดึงข้อมูลคลาสและตรวจสอบความเป็นเจ้าของ
    const classResult = await db
      .select({
        owner_user_id: classes.owner_user_id,
        subject_name: classes.subject_name,
      })
      .from(classes)
      .where(eq(classes.class_id, classId))
      .limit(1);

    if (classResult.length === 0 || classResult[0].owner_user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You are not the owner of this class." });
    }
    const classData = classResult[0];

    // 2. ดึงชื่อผู้สอน (Professor) ที่ทำการ Export
    const [professor] = await db
      .select({
        name: sql`CONCAT(${users.first_name}, ' ', ${users.last_name})`,
      })
      .from(users)
      .where(eq(users.user_id, userId));

    // 3. ดึง "ทุกคาบเรียนที่ผ่านไปแล้ว" โดยไม่รวมคาบที่ยกเลิก
    const pastSessions = await db
      .select({
        session_id: class_sessions.session_id,
        session_date: class_sessions.session_date,
      })
      .from(class_sessions)
      .innerJoin(
        schedules,
        eq(class_sessions.schedule_id, schedules.schedule_id)
      )
      .where(
        and(
          eq(class_sessions.class_id, classId),
          eq(class_sessions.is_canceled, false), // <--- กรองคาบที่ยกเลิกออก
          sql`(${class_sessions.session_date} + ${schedules.start_time}) <= (NOW() AT TIME ZONE 'Asia/Bangkok')`
        )
      )
      .orderBy(asc(class_sessions.session_date));

    // 4. ดึงข้อมูลนักเรียนและการเข้าเรียน
    const studentMembers = await db
      .select({
        user_id: users.user_id,
        student_id: users.student_id,
        full_name: sql`CONCAT(${users.first_name}, ' ', ${users.last_name})`.as(
          "full_name"
        ),
      })
      .from(user_classes)
      .innerJoin(users, eq(user_classes.user_id, users.user_id))
      .where(
        and(
          eq(user_classes.class_id, classId),
          ne(user_classes.user_id, classData.owner_user_id)
        )
      );

    const allAttendanceRecords = await db
      .select({
        session_id: attendances.session_id,
        user_id: attendances.user_id,
      })
      .from(attendances)
      .innerJoin(
        class_sessions,
        eq(attendances.session_id, class_sessions.session_id)
      )
      .where(eq(class_sessions.class_id, classId));

    // --- Step C: Calculate Summary Data ---

    // 1. จำนวนคาบเรียนทั้งหมดที่วางแผนไว้ (ไม่รวมที่ยกเลิก)
    const totalPlannedSessionsResult = await db
      .select({ value: count() })
      .from(class_sessions)
      .where(
        and(
          eq(class_sessions.class_id, classId),
          eq(class_sessions.is_canceled, false) // <--- กรองคาบที่ยกเลิกออก
        )
      );
    const totalPlannedSessionsCount = totalPlannedSessionsResult[0]?.value;

    // 2. นับจำนวนคาบที่ถูกยกเลิก
    const canceledSessionsList = await db
      .select({
        date: class_sessions.session_date,
        reason: class_sessions.custom_note,
      })
      .from(class_sessions)
      .where(
        and(
          eq(class_sessions.class_id, classId),
          eq(class_sessions.is_canceled, true)
        )
      )
      .orderBy(asc(class_sessions.session_date));

    // 3. คำนวณเปอร์เซ็นต์เฉลี่ย
    const totalStudents = studentMembers.length;
    const sessionsHeldCount = pastSessions.length;
    const totalPossibleAttendances = totalStudents * sessionsHeldCount;
    const totalActualAttendances = allAttendanceRecords.length;
    const averageAttendance =
      totalPossibleAttendances > 0
        ? Math.round((totalActualAttendances / totalPossibleAttendances) * 100)
        : 0;
    const canceledSessionsCount = canceledSessionsList.length;

    // --- Step D: Prepare Data for CSV File ---

    // 1. สร้างส่วนข้อมูลสรุปและ Metadata
    const exportDate = new Date().toLocaleString("th-TH", {
      dateStyle: "long",
      timeStyle: "short",
    });
    const summaryHeader = `\uFEFF"ข้อมูลสรุปวิชา: ${classData.subject_name}"\n`;
    const summaryData = [
      `"จำนวนนักเรียนทั้งหมด", "${totalStudents} คน"`,
      `"เปอร์เซ็นต์การเข้าเรียนเฉลี่ย", "${averageAttendance}%"`,
      `"จำนวนวันที่เรียนไปแล้ว", "${sessionsHeldCount} วัน"`,
      `"จำนวนวันเรียนทั้งหมด (ไม่รวมยกเลิก)", "${totalPlannedSessionsCount} วัน"`,
      `"จำนวนคาบที่ยกเลิก", "${canceledSessionsCount} ครั้ง"`,
      `"จัดทำโดย", "${professor?.name || "N/A"}"`,
      `"วันที่จัดทำ", "${exportDate}"`,
    ];
    const summaryCsv = summaryHeader + summaryData.join("\n") + "\n\n";

    // ** เพิ่ม: สร้างส่วนของรายการคาบที่ยกเลิก **
    let canceledSessionsCsv = "";
    if (canceledSessionsList.length > 0) {
      const canceledHeader = `\n\n"รายการวันที่ยกเลิกการเรียนการสอน"\n`;
      const canceledSubHeader = `'วันที่, เหตุผลการยกเลิก\n`;
      const canceledRows = canceledSessionsList
        .map((session) => {
          const date = new Date(session.date).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }); // DD-MM-YYYY
          const reason = session.reason || "ไม่ระบุเหตุผล"; // แสดงข้อความสำรองถ้าไม่มีเหตุผล
          return `"${date}", "${reason}"`;
        })
        .join("\n");
      canceledSessionsCsv = canceledHeader + canceledSubHeader + canceledRows;
    }

    // 2. สร้างตารางข้อมูลนักเรียน
    const attendanceMap = new Map();
    allAttendanceRecords.forEach((rec) => {
      if (!attendanceMap.has(rec.user_id)) {
        attendanceMap.set(rec.user_id, new Set());
      }
      attendanceMap.get(rec.user_id).add(rec.session_id);
    });

    const dataForTable = studentMembers.map((member) => {
      const studentRow = {
        รหัสนักศึกษา: member.student_id || "",
        "ชื่อ-นามสกุล": member.full_name,
      };
      const studentCheckedInSessions =
        attendanceMap.get(member.user_id) || new Set();
      let presentCount = 0;

      pastSessions.forEach((session) => {
        const dateColumnHeader = new Date(
          session.session_date
        ).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }); // DD-MM-YYYY
        if (studentCheckedInSessions.has(session.session_id)) {
          studentRow[dateColumnHeader] = "เข้าเรียน";
          presentCount++;
        } else {
          studentRow[dateColumnHeader] = "ขาดเรียน";
        }
      });

      const percentage =
        sessionsHeldCount > 0
          ? Math.round((presentCount / sessionsHeldCount) * 100)
          : 0;

      studentRow[
        "จำนวนครั้ง (มา/ทั้งหมด)"
      ] = `${presentCount}/${sessionsHeldCount}`;
      studentRow["เปอร์เซ็นต์เข้าเรียน"] = `${percentage}%`;
      return studentRow;
    });

    // 3. แปลงข้อมูลตารางเป็น CSV และรวมส่วนต่างๆ
    let tableCsv = "";
    if (dataForTable.length > 0) {
      const opts = { withBOM: false };
      const parser = new Parser(opts);
      tableCsv = parser.parse(dataForTable);
    } else {
      tableCsv = "ไม่มีข้อมูลนักเรียนในชั้นเรียนนี้";
    }

    const finalCsv =
      summaryCsv.trim() +
      "\n\n" +
      canceledSessionsCsv.trim() +
      "\n\n" +
      tableCsv.trim();

    // --- Step E: Send the CSV File as a Response ---
    // สร้าง String ของวันที่และเวลาปัจจุบันในรูปแบบที่ปลอดภัยสำหรับชื่อไฟล์ (YYYY-MM-DD_HH-mm-ss)
    const now = new Date();
    const dateString = now.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }); // DD-MM-YYYY
    const timeString = now.toLocaleTimeString("th-TH").replace(/:/g, "-"); // ให้ผลลัพธ์เป็น "HH-mm-ss"
    const fileName = `Export_Attendance_${dateString}_${timeString}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(finalCsv);
  } catch (err) {
    console.error("❌ Error exporting attendance as CSV:", err);
    if (err.name === "TokenValidationError" || err.message?.includes("clerk")) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
}
