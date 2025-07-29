import { db } from "../config/db.js";
import {
  class_sessions,
  classes,
  attendances,
  users,
  user_classes,
  schedules,
} from "../db/schema.js";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, sql, ne, and } from "drizzle-orm";

export async function getAttendanceSessionById(req, res) {
  try {
    const { userId } = getAuth(req);
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    // ค้นหา session พร้อมข้อมูลคลาสและ schedule
    const sessionResult = await db
      .select({
        // class_sessions
        session_id: class_sessions.session_id,
        class_id: class_sessions.class_id,
        schedule_id: class_sessions.schedule_id,
        session_date: class_sessions.session_date,
        is_canceled: class_sessions.is_canceled,
        custom_note: class_sessions.custom_note,
        created_at: class_sessions.created_at,
        // classes
        owner_user_id: classes.owner_user_id,
        subject_name: classes.subject_name,
        //schedules
        start_time: schedules.start_time,
        end_time: schedules.end_time,
      })
      .from(class_sessions)
      .innerJoin(classes, eq(class_sessions.class_id, classes.class_id))
      .innerJoin(
        schedules,
        eq(class_sessions.schedule_id, schedules.schedule_id)
      )
      .where(eq(class_sessions.session_id, sessionId))
      .limit(1);

    if (sessionResult.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const session = sessionResult[0];

    // ตรวจสอบว่า user นี้เป็นเจ้าของคลาส
    if (session.owner_user_id !== userId) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this class" });
    }

    // ดึงรายชื่อสมาชิกทั้งหมดในคลาส
    const classMembers = await db
      .select({
        user_id: users.user_id,
        student_id: users.student_id,
        first_name: users.first_name,
        last_name: users.last_name,
        full_name: sql`CONCAT(${users.first_name}, ' ', ${users.last_name})`.as(
          "full_name"
        ),
        major: users.major,
        year: users.year,
      })
      .from(user_classes)
      .innerJoin(users, eq(user_classes.user_id, users.user_id))
      .where(
        and(
          eq(user_classes.class_id, session.class_id),
          ne(user_classes.user_id, session.owner_user_id)
        )
      )
      .orderBy(users.first_name, users.last_name);

    //  ดึงข้อมูลโปรไฟล์จาก Clerk
    // เตรียม array ของ user_id ทั้งหมด
    const userIds = classMembers.map((member) => member.user_id);
    let clerkUsersMap = new Map();

    // ถ้าในคลาสมีสมาชิก
    if (userIds.length > 0) {
      // เรียก Clerk API เพื่อดึงข้อมูลผู้ใช้ทั้งหมด
      // ผลลัพธ์ที่ได้จะเป็น Object { data: User[], totalCount: number }
      const clerkUserListResponse = await clerkClient.users.getUserList({
        userId: userIds,
      });

      // ให้เราใช้ clerkUserListResponse.data ซึ่งเป็น Array ที่เราต้องการ
      const clerkUsers = clerkUserListResponse.data;

      // สร้าง Map จาก clerkUsers (ซึ่งตอนนี้เป็น Array ที่ถูกต้องแล้ว)
      clerkUsers.forEach((user) => {
        clerkUsersMap.set(user.id, {
          imageUrl: user.imageUrl,
        });
      });
    }

    // ดึงข้อมูลการเช็คชื่อสำหรับ session นี้
    const attendanceRecords = await db
      .select({
        user_id: attendances.user_id,
        checked_in_at: attendances.checked_in_at,
        created_at: attendances.created_at,
      })
      .from(attendances)
      .where(eq(attendances.session_id, sessionId));

    // สร้าง Map เพื่อเช็คว่าใครเช็คชื่อแล้วบ้าง
    const attendanceMap = new Map();
    attendanceRecords.forEach((record) => {
      attendanceMap.set(record.user_id, record);
    });

    // รวมข้อมูลสมาชิกกับการเช็คชื่อ
    const attendanceList = classMembers.map((member) => {
      const attendanceRecord = attendanceMap.get(member.user_id);
      const clerkProfile = clerkUsersMap.get(member.user_id);
      return {
        user_id: member.user_id,
        student_id: member.student_id,
        user_name: member.full_name,
        first_name: member.first_name,
        last_name: member.last_name,
        major: member.major,
        year: member.year,
        is_present: !!attendanceRecord, // มีการเช็คชื่อหรือไม่
        checked_at: attendanceRecord?.checked_in_at || null,
        created_at: attendanceRecord?.created_at || null,
        imageUrl: clerkProfile?.imageUrl || null,
      };
    });

    // คำนวณสถิติ
    const totalMembers = classMembers.length;
    const presentCount = attendanceList.filter((a) => a.is_present).length;
    const absentCount = totalMembers - presentCount;
    const attendanceRate =
      totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

    // จัดรูปแบบเวลา
    const sessionTime =
      session.start_time && session.end_time
        ? `${session.start_time.slice(0, 5)} - ${session.end_time.slice(0, 5)}`
        : "ไม่ระบุ";

    // จัดรูปแบบข้อมูลส่งกลับ
    const responseData = {
      session_id: session.session_id,
      class_id: session.class_id,
      schedule_id: session.schedule_id,
      subject_name: session.subject_name,
      session_date: session.session_date,
      session_time: sessionTime,
      is_canceled: session.is_canceled,
      custom_note: session.custom_note,
      created_at: session.created_at,
      attendances: attendanceList,
      // สถิติเพิ่มเติม
      total_members: totalMembers,
      present_count: presentCount,
      absent_count: absentCount,
      attendance_rate: attendanceRate,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("❌ Error fetching attendance session:", error.message);
    console.error("Full error:", error);
    return res
      .status(error?.status || 500)
      .json({ message: error?.message || "Internal server error" });
  }
}
