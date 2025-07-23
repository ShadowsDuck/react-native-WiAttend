import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

const TARGET_TIME_ZONE = "Asia/Bangkok";

export function processSessionStatuses(sessions, checkedInSessionIds) {
  if (!sessions || sessions.length === 0) {
    return [];
  }

  const now = new Date(); // เวลาปัจจุบัน (UTC)

  return sessions.map((session) => {
    const todayDateStringInTargetZone = formatInTimeZone(
      now,
      TARGET_TIME_ZONE,
      "yyyy-MM-dd"
    );

    const startTimeInUTC = fromZonedTime(
      `${todayDateStringInTargetZone}T${session.start_time}`,
      TARGET_TIME_ZONE
    );
    const closeTimeInUTC = new Date(
      startTimeInUTC.getTime() + session.checkin_close_after_min * 60000
    );
    const endTimeInUTC = fromZonedTime(
      `${todayDateStringInTargetZone}T${session.end_time}`,
      TARGET_TIME_ZONE
    );

    let status = "upcoming";

    if (now >= startTimeInUTC && now < closeTimeInUTC) {
      status = "active";
    } else if (now >= closeTimeInUTC && now < endTimeInUTC) {
      status = "expired";
    } else if (now >= endTimeInUTC) {
      status = "finished";
    }

    // ตรวจสอบว่า session_id นี้อยู่ใน Set ของหลักฐานการเช็คชื่อหรือไม่
    const hasCheckedIn = checkedInSessionIds.has(session.session_id);

    return {
      ...session,
      status: status,
      has_checked_in: hasCheckedIn,
    };
  });
}
