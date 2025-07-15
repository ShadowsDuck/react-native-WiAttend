import {
  pgTable,
  text,
  integer,
  timestamp,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

// -------------------- USERS --------------------
export const users = pgTable("users", {
  user_id: text("user_id").primaryKey(), // ID จาก Clerk หรือ UUID
  student_id: varchar("student_id", { length: 20 }).notNull().unique(),
  first_name: varchar("first_name", { length: 50 }).notNull(),
  last_name: varchar("last_name", { length: 50 }).notNull(),
  major: varchar("major", { length: 100 }).notNull(),
  year: integer("year").notNull(),
});

// -------------------- CLASSES --------------------
export const classes = pgTable("classes", {
  class_id: serial("class_id").primaryKey(),
  owner_user_id: text("owner_user_id")
    .notNull()
    .references(() => users.user_id),
  subject_name: varchar("subject_name", { length: 100 }).notNull(),
  semester_start_date: timestamp("semester_start_date").notNull(),
  semester_weeks: integer("semester_weeks").notNull(),
  attendance_close_after_minutes: integer(
    "attendance_close_after_minutes"
  ).notNull(),
});

// -------------------- ROOMS --------------------
export const rooms = pgTable("rooms", {
  room_id: serial("room_id").primaryKey(),
  room_name: varchar("room_name", { length: 100 }).notNull(),
});

// -------------------- WIFI_ACCESS_POINTS --------------------
export const wifi_access_points = pgTable("wifi_access_points", {
  ap_id: serial("ap_id").primaryKey(),
  room_id: integer("room_id")
    .notNull()
    .references(() => rooms.room_id),
  ssid: varchar("ssid", { length: 100 }).notNull(),
  bssid: varchar("bssid", { length: 50 }).notNull(), // MAC address
  min_rssi: integer("min_rssi"), // ค่าต่ำสุดของ RSSI เพื่อยืนยันว่าอยู่ในพื้นที่
});

// -------------------- SCHEDULES --------------------
export const schedules = pgTable("schedules", {
  schedule_id: serial("schedule_id").primaryKey(),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.class_id),
  day_of_week: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ...
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  room_id: integer("room_id")
    .notNull()
    .references(() => rooms.room_id),
});

// -------------------- USER_CLASSES --------------------
export const user_classes = pgTable("user_classes", {
  user_class_id: serial("user_class_id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.user_id),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.class_id),
});

// -------------------- ATTENDANCES --------------------
export const attendances = pgTable("attendances", {
  attendance_id: serial("attendance_id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.user_id),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.class_id),
  schedule_id: integer("schedule_id")
    .notNull()
    .references(() => schedules.schedule_id),
  timestamp: timestamp("timestamp").notNull(),
  wifi_rssi: integer("wifi_rssi").notNull(),
});
