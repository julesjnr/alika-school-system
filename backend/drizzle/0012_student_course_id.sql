ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "course_id" uuid;
--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_students_course_id" ON "students" USING btree ("course_id");
