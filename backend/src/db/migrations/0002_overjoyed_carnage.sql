CREATE TABLE "class_sessions" (
	"session_id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"schedule_id" integer NOT NULL,
	"session_date" date NOT NULL,
	"is_canceled" boolean DEFAULT false NOT NULL,
	"custom_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendances" RENAME COLUMN "schedule_id" TO "session_id";--> statement-breakpoint
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_schedule_id_schedules_schedule_id_fk";
--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_classes_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("class_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_schedule_id_schedules_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_session_id_class_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("session_id") ON DELETE cascade ON UPDATE no action;