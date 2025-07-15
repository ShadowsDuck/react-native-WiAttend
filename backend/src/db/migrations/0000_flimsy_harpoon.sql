CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent');--> statement-breakpoint
CREATE TYPE "public"."day_enum" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');--> statement-breakpoint
CREATE TYPE "public"."major_enum" AS ENUM('Computer Science', 'Information Technology');--> statement-breakpoint
CREATE TABLE "attendances" (
	"attendance_id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"class_id" integer NOT NULL,
	"schedule_id" integer NOT NULL,
	"checked_in_at" timestamp NOT NULL,
	"wifi_rssi" integer NOT NULL,
	"status" "attendance_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"class_id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"subject_name" text NOT NULL,
	"semester_start_date" date NOT NULL,
	"semester_weeks" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"room_id" text PRIMARY KEY NOT NULL,
	"room_name" text NOT NULL,
	CONSTRAINT "rooms_room_name_unique" UNIQUE("room_name")
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"schedule_id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"day_of_week" "day_enum" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"checkin_close_after_min" integer NOT NULL,
	"room_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_classes" (
	"user_class_id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"class_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_classes_user_id_class_id_unique" UNIQUE("user_id","class_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"student_id" varchar(20) NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"major" "major_enum" NOT NULL,
	"year" smallint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "wifi_access_points" (
	"ap_id" serial PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"ssid" varchar(100) NOT NULL,
	"bssid" varchar(17) NOT NULL,
	"min_rssi" integer,
	CONSTRAINT "wifi_access_points_bssid_unique" UNIQUE("bssid")
);
--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_schedule_id_schedules_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_owner_user_id_users_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_room_id_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("room_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_classes" ADD CONSTRAINT "user_classes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_classes" ADD CONSTRAINT "user_classes_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wifi_access_points" ADD CONSTRAINT "wifi_access_points_room_id_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("room_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_user_idx" ON "attendances" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attendance_class_idx" ON "attendances" USING btree ("class_id");