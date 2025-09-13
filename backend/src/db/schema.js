import {
  pgTable,
  text,
  integer,
  timestamp,
  serial,
  varchar,
  date,
  smallint,
  time,
  pgEnum,
  unique,
  index,
  boolean,
} from "drizzle-orm/pg-core";

// -------------------- ENUM --------------------
export const majorEnum = pgEnum("major_enum", [
  "ไม่ระบุ",
  "Computer Science",
  "Information Technology",
]);

export const dayEnum = pgEnum("day_enum", [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

// export const attendanceStatusEnum = pgEnum("attendance_status", [
//   "present",
//   "absent",
// ]);

// -------------------- USERS --------------------
// ตารางข้อมูลผู้ใช้
export const users = pgTable("users", {
  user_id: text("user_id").primaryKey(),
  student_id: varchar("student_id", { length: 20 }).unique(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  major: majorEnum("major"),
  year: smallint("year"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// -------------------- CLASSES --------------------
// ตารางคลาสเรียน (ผู้สร้างคลาสจะเป็นเจ้าของคลาส)
export const classes = pgTable("classes", {
  class_id: serial("class_id").primaryKey(),
  owner_user_id: text("owner_user_id")
    .notNull()
    .references(() => users.user_id, { onDelete: "cascade" }),
  subject_name: text("subject_name").notNull(),
  semester_start_date: date("semester_start_date").notNull(),
  semester_weeks: integer("semester_weeks").notNull(),
  // description: text("description"),
  join_code: varchar("join_code", { length: 10 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// -------------------- ROOMS --------------------
// ตารางห้องเรียน (เก็บใส่ฐานข้อมูลเอง)
export const rooms = pgTable("rooms", {
  room_id: text("room_id").primaryKey(),
});

// -------------------- WIFI_ACCESS_POINTS --------------------
// ตาราง Access Point ที่แต่ละห้องมี (เก็บใส่ฐานข้อมูลเอง)
export const wifi_access_points = pgTable("wifi_access_points", {
  ap_id: serial("ap_id").primaryKey(),
  room_id: text("room_id")
    .notNull()
    .references(() => rooms.room_id, { onDelete: "restrict" }),
  ssid: varchar("ssid", { length: 100 }).notNull(),
  bssid: varchar("bssid", { length: 17 }).notNull().unique(),
  min_rssi: integer("min_rssi"),
});

// -------------------- SCHEDULES --------------------
// ตารางคาบเรียน (แต่ละคลาสอาจมีหลายคาบเรียน)
export const schedules = pgTable("schedules", {
  schedule_id: serial("schedule_id").primaryKey(),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.class_id, { onDelete: "cascade" }),
  day_of_week: dayEnum("day_of_week").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  checkin_close_after_min: integer("checkin_close_after_min").notNull(),
  room_id: text("room_id")
    .notNull()
    .references(() => rooms.room_id, { onDelete: "restrict" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// -------------------- CLASS_SESSIONS --------------------
// ตารางวันที่เรียนรายวันของแต่ละ schedule

export const class_sessions = pgTable("class_sessions", {
  session_id: serial("session_id").primaryKey(),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.class_id, { onDelete: "cascade" }),
  schedule_id: integer("schedule_id")
    .notNull()
    .references(() => schedules.schedule_id, { onDelete: "cascade" }),
  session_date: date("session_date").notNull(),
  is_canceled: boolean("is_canceled").default(false).notNull(),
  custom_note: text("custom_note"), // เช่น "หยุดวันแม่", "เลื่อนคาบเรียน"
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// -------------------- USER_CLASSES --------------------
// ตารางความสัมพันธ์ระหว่างผู้ใช้กับคลาสที่เข้าร่วม
export const user_classes = pgTable(
  "user_classes",
  {
    user_class_id: serial("user_class_id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.user_id, { onDelete: "cascade" }),
    class_id: integer("class_id")
      .notNull()
      .references(() => classes.class_id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  // Unique constraint: ไม่ให้ user เข้าร่วมคลาสเดิมซ้ำ
  (table) => [unique().on(table.user_id, table.class_id)]
);

// -------------------- ATTENDANCES --------------------
// ตารางบันทึกการเช็คชื่อเข้าเรียน
export const attendances = pgTable(
  "attendances",
  {
    attendance_id: serial("attendance_id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.user_id, { onDelete: "cascade" }),
    class_id: integer("class_id")
      .notNull()
      .references(() => classes.class_id, { onDelete: "cascade" }),
    session_id: integer("session_id")
      .notNull()
      .references(() => class_sessions.session_id, { onDelete: "cascade" }),
    checked_in_at: timestamp("checked_in_at").notNull(),
    // wifi_rssi: integer("wifi_rssi").notNull(),
    // status: attendanceStatusEnum("status").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Index เพื่อเร่งการค้นหาตาม user_id
    index("attendance_user_idx").on(table.user_id),
    // Index เพื่อเร่งการค้นหาตาม class_id
    index("attendance_class_idx").on(table.class_id),
  ]
);
