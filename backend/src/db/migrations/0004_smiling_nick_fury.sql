ALTER TABLE "classes" ADD COLUMN "join_code" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_join_code_unique" UNIQUE("join_code");