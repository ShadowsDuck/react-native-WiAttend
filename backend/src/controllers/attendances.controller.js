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
import { eq, sql, ne, and, count } from "drizzle-orm";

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

export async function getAttendanceSummary(req, res) {
  try {
    const { userId } = getAuth(req);
    const { classId } = req.params;

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    // --- 1. ดึงข้อมูลพื้นฐานของคลาสและสถิติ (ใช้ร่วมกันทั้ง Teacher และ Student) ---

    const classResult = await db
      .select({
        owner_user_id: classes.owner_user_id,
        subject_name: classes.subject_name,
      })
      .from(classes)
      .where(eq(classes.class_id, classId))
      .limit(1);

    if (classResult.length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }
    const classData = classResult[0];

    const totalPlannedSessionsResult = await db
      .select({ count: count() })
      .from(class_sessions)
      .where(
        and(
          eq(class_sessions.class_id, classId),
          eq(class_sessions.is_canceled, false)
        )
      );
    const totalPlannedSessionsCount = totalPlannedSessionsResult[0]?.count ?? 0;

    const sessionsHeldSoFarResult = await db
      .select({ count: count() })
      .from(class_sessions)
      .innerJoin(
        schedules,
        eq(class_sessions.schedule_id, schedules.schedule_id)
      )
      .where(
        and(
          and(
            eq(class_sessions.class_id, classId),
            eq(class_sessions.is_canceled, false)
          ),
          sql`(${class_sessions.session_date} + ${schedules.start_time}) <= (NOW() AT TIME ZONE 'Asia/Bangkok')`
        )
      );
    const sessionsHeldSoFarCount = sessionsHeldSoFarResult[0]?.count ?? 0;

    // --- 2. ตรวจสอบ Role และแยก Logic การดึงข้อมูล ---

    const isOwner = classData.owner_user_id === userId;

    if (isOwner) {
      // ===== LOGIC สำหรับ TEACHER (จาก `getClassAttendances`) =====

      const classMembers = await db
        .select({
          user_id: users.user_id,
          student_id: users.student_id,
          first_name: users.first_name,
          last_name: users.last_name,
          full_name:
            sql`CONCAT(${users.first_name}, ' ', ${users.last_name})`.as(
              "full_name"
            ),
          role: sql`CASE WHEN ${classes.owner_user_id} = ${users.user_id} THEN 'teacher' ELSE 'student' END`.as(
            "role"
          ),
        })
        .from(user_classes)
        .innerJoin(users, eq(user_classes.user_id, users.user_id))
        .innerJoin(classes, eq(user_classes.class_id, classes.class_id))
        .where(eq(user_classes.class_id, classId));

      const studentMembers = classMembers.filter(
        (member) => member.role !== "teacher"
      );
      const userIds = studentMembers.map((m) => m.user_id);

      // เพิ่ม teacher ด้วย
      const allUserIds = [classData.owner_user_id, ...userIds];
      let clerkUsersMap = new Map();

      if (allUserIds.length > 0) {
        const clerkUserListResponse = await clerkClient.users.getUserList({
          userId: allUserIds,
        });
        clerkUserListResponse.data.forEach((user) => {
          clerkUsersMap.set(user.id, { imageUrl: user.imageUrl });
        });
      }

      const attendanceRecords = await db
        .select({
          session_id: attendances.session_id,
          user_id: attendances.user_id,
          checked_in_at: attendances.checked_in_at,
        })
        .from(attendances)
        .innerJoin(
          class_sessions,
          eq(attendances.session_id, class_sessions.session_id)
        )
        .where(eq(class_sessions.class_id, classId));

      const attendanceMap = new Map();
      attendanceRecords.forEach((rec) => {
        if (!attendanceMap.has(rec.session_id)) {
          attendanceMap.set(rec.session_id, new Map());
        }
        attendanceMap.get(rec.session_id).set(rec.user_id, rec);
      });

      const result = studentMembers.map((member) => {
        const clerkProfile = clerkUsersMap.get(member.user_id);
        return {
          ...member,
          imageUrl: clerkProfile?.imageUrl || null,
          attendances: Array.from(attendanceMap.entries()).map(
            ([sessionId, map]) => {
              const rec = map.get(member.user_id);
              return {
                session_id: sessionId,
                is_present: !!rec,
                checked_in_at: rec?.checked_in_at || null,
              };
            }
          ),
        };
      });

      return res.status(200).json({
        class_id: classId,
        isOwner: true,
        subject_name: classData.subject_name,
        total_planned_sessions: totalPlannedSessionsCount,
        sessions_held_so_far: sessionsHeldSoFarCount,
        members: result,
      });
    } else {
      // ===== LOGIC สำหรับ STUDENT (จาก `getMyAttendances`) =====

      const enrolled = await db
        .select()
        .from(user_classes)
        .where(
          and(
            eq(user_classes.user_id, userId),
            eq(user_classes.class_id, classId)
          )
        );

      if (enrolled.length === 0) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this class" });
      }

      // 1. ดึง "ทุกคาบเรียนที่ผ่านไปแล้ว" ของคลาสนี้
      const pastSessions = await db
        .select({
          session_id: class_sessions.session_id,
          session_date: class_sessions.session_date,
          start_time: schedules.start_time,
          // อาจจะดึงข้อมูลอื่น ๆ ที่ต้องการแสดงผลมาด้วย
        })
        .from(class_sessions)
        .innerJoin(
          schedules,
          eq(class_sessions.schedule_id, schedules.schedule_id)
        )
        .where(
          and(
            eq(class_sessions.class_id, classId),
            sql`(${class_sessions.session_date} + ${schedules.start_time}) <= (NOW() AT TIME ZONE 'Asia/Bangkok')`
          )
        )
        .orderBy(class_sessions.session_date); // เรียงตามวันที่

      // 2. ดึง "ประวัติการเช็คชื่อ" ของนักเรียนคนนี้
      const studentAttendanceRecords = await db
        .select({
          session_id: attendances.session_id,
          checked_in_at: attendances.checked_in_at,
        })
        .from(attendances)
        .where(
          and(
            eq(
              attendances.user_id,
              userId
            ) /* อาจจะเพิ่ม inArray(attendances.session_id, ...) เพื่อประสิทธิภาพ */
          )
        );

      // 3. สร้าง Set เพื่อให้ค้นหาการเช็คชื่อได้เร็ว
      const checkedInSessionIds = new Set(
        studentAttendanceRecords.map((rec) => rec.session_id)
      );
      const checkedInTimeMap = new Map(
        studentAttendanceRecords.map((rec) => [
          rec.session_id,
          rec.checked_in_at,
        ])
      );

      // 4. สร้าง "ประวัติการเข้าเรียนฉบับสมบูรณ์"
      const fullAttendanceHistory = pastSessions.map((session) => ({
        session_id: session.session_id,
        session_date: session.session_date, // วันที่ของคาบเรียน
        start_time: session.start_time,
        is_present: checkedInSessionIds.has(session.session_id),
        checked_in_at: checkedInTimeMap.get(session.session_id) || null,
      }));

      return res.status(200).json({
        class_id: classId,
        isOwner: false,
        subject_name: classData.subject_name,
        total_planned_sessions: totalPlannedSessionsCount,
        sessions_held_so_far: sessionsHeldSoFarCount, // <-- ตัวหารที่ถูกต้อง
        // ส่งประวัติฉบับสมบูรณ์ไปแทน records เดิม
        attendances: fullAttendanceHistory,
      });
    }
  } catch (err) {
    console.error("❌ Error fetching attendance summary:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getStudentAttendanceDetail(req, res) {
  try {
    const { classId, userId } = req.params;

    if (!classId || !userId) {
      return res
        .status(400)
        .json({ message: "classId and userId are required" });
    }

    // ตรวจสอบว่ามี class จริงไหม
    const classResult = await db
      .select({ subject_name: classes.subject_name })
      .from(classes)
      .where(eq(classes.class_id, classId))
      .limit(1);

    if (classResult.length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }
    const classData = classResult[0];

    // ดึง student + ตรวจสอบ enrollment ไปพร้อมกัน
    const [studentDetail] = await db
      .select({
        first_name: users.first_name,
        last_name: users.last_name,
        full_name: sql`CONCAT(${users.first_name}, ' ', ${users.last_name})`.as(
          "full_name"
        ),
      })
      .from(user_classes)
      .innerJoin(users, eq(user_classes.user_id, users.user_id))
      .where(
        and(
          eq(user_classes.class_id, classId),
          eq(user_classes.user_id, userId)
        )
      )
      .limit(1);

    if (!studentDetail) {
      return res
        .status(403)
        .json({ message: "This student is not enrolled in this class" });
    }

    // --- นับจำนวน session ที่ plan ไว้ ---
    const totalPlannedSessionsResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(class_sessions)
      .where(
        and(
          eq(class_sessions.class_id, classId),
          eq(class_sessions.is_canceled, false)
        )
      );

    const totalPlannedSessionsCount = Number(
      totalPlannedSessionsResult[0]?.count ?? 0
    );

    // --- นับจำนวน session ที่ผ่านมาแล้ว ---
    const sessionsHeldSoFarResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(class_sessions)
      .innerJoin(
        schedules,
        eq(class_sessions.schedule_id, schedules.schedule_id)
      )
      .where(
        and(
          eq(class_sessions.class_id, classId),
          eq(class_sessions.is_canceled, false),
          sql`(${class_sessions.session_date} + ${schedules.start_time}) <= (NOW() AT TIME ZONE 'Asia/Bangkok')`
        )
      );
    const sessionsHeldSoFarCount = Number(
      sessionsHeldSoFarResult[0]?.count ?? 0
    );

    // --- ดึง session ที่ผ่านมาแล้ว ---
    const pastSessions = await db
      .select({
        session_id: class_sessions.session_id,
        session_date: class_sessions.session_date,
        start_time: schedules.start_time,
      })
      .from(class_sessions)
      .innerJoin(
        schedules,
        eq(class_sessions.schedule_id, schedules.schedule_id)
      )
      .where(
        and(
          eq(class_sessions.class_id, classId),
          sql`(${class_sessions.session_date} + ${schedules.start_time}) <= (NOW() AT TIME ZONE 'Asia/Bangkok')`
        )
      )
      .orderBy(class_sessions.session_date);

    // --- ดึง attendance ของนักเรียน ---
    const studentAttendanceRecords = await db
      .select({
        session_id: attendances.session_id,
        checked_in_at: attendances.checked_in_at,
      })
      .from(attendances)
      .innerJoin(
        class_sessions,
        eq(attendances.session_id, class_sessions.session_id)
      )
      .where(
        and(
          eq(attendances.user_id, userId),
          eq(class_sessions.class_id, classId)
        )
      );

    const checkedInSessionIds = new Set(
      studentAttendanceRecords.map((rec) => rec.session_id)
    );
    const checkedInTimeMap = new Map(
      studentAttendanceRecords.map((rec) => [rec.session_id, rec.checked_in_at])
    );

    const fullAttendanceHistory = pastSessions.map((session) => ({
      session_id: session.session_id,
      session_date: session.session_date,
      start_time: session.start_time,
      is_present: checkedInSessionIds.has(session.session_id),
      checked_in_at: checkedInTimeMap.get(session.session_id) || null,
    }));

    return res.status(200).json({
      subject_name: classData.subject_name,
      student: studentDetail,
      total_planned_sessions: totalPlannedSessionsCount,
      sessions_held_so_far: sessionsHeldSoFarCount,
      attendances: fullAttendanceHistory,
    });
  } catch (err) {
    console.error("❌ Error fetching student detail:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
