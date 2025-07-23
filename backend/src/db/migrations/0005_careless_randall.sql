ALTER TABLE "attendances" DROP COLUMN "wifi_rssi";--> statement-breakpoint
ALTER TABLE "attendances" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "description";--> statement-breakpoint
DROP TYPE "public"."attendance_status";